import type { Hotel } from "@/types/hotel";
import type { HotelProviderDebugInfo, HotelSearchParams } from "@/types/search";
import { mergeHotelsByIdentity } from "@/lib/hotelMerge";
import {
  createRakutenParams,
  fetchRakutenApi,
  getRakutenCredentials,
  getRakutenResponseBodySnippet,
  maskRakutenUrl,
} from "./rakutenShared";

const KEYWORD_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/KeywordHotelSearch/20170426";
const HOTEL_DETAIL_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/HotelDetailSearch/20170426";
const VACANT_HOTEL_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/VacantHotelSearch/20170426";
const DEFAULT_KEYWORD = "東京";
const RAKUTEN_LIST_HITS = 30;
const RAKUTEN_LIST_PAGE_COUNT = 2;
const MIN_AREA_RESULT_COUNT = 10;

type RakutenHotelBasicInfo = {
  hotelNo?: number | string | null;
  hotelName?: string | null;
  hotelInformationUrl?: string | null;
  planListUrl?: string | null;
  hotelMinCharge?: number | string | null;
  address1?: string | null;
  address2?: string | null;
  hotelImageUrl?: string | null;
  hotelThumbnailUrl?: string | null;
  reviewAverage?: number | string | null;
  hotelSpecial?: string | null;
  hotelDescription?: string | null;
  access?: string | null;
  parkingInformation?: string | null;
  nearestStation?: string | null;
};

type RakutenHotelEntry = {
  hotelBasicInfo?: RakutenHotelBasicInfo;
  hotelDetailInfo?: { areaName?: string | null; hotelClassCode?: string | number | null };
  roomInfo?: Array<{
    roomBasicInfo?: {
      roomName?: string | null;
      planName?: string | null;
      dailyCharge?: {
        total?: number | string | null;
        rakutenCharge?: number | string | null;
      } | null;
      reserveUrl?: string | null;
      withBreakfastFlag?: number | string | null;
    };
    dailyCharge?: {
      total?: number | string | null;
      rakutenCharge?: number | string | null;
    } | null;
    reserveUrl?: string | null;
  }>;
};

type RakutenHotelResponse = {
  hotels?: unknown[];
  error?: string;
  error_description?: string;
};

export type RakutenHotelFetchResult = {
  hotels: Hotel[];
  debug: HotelProviderDebugInfo;
};

type ExtractedHotelBasicInfo = {
  basicInfo: RakutenHotelBasicInfo;
  pattern: string;
};

function parseRakutenResponse(body: string): RakutenHotelResponse | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as RakutenHotelResponse;
  } catch {
    return null;
  }
}

function toFiniteNumber(value: number | string | null | undefined): number {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : 0;
}

function toNullableFiniteNumber(value: number | string | null | undefined): number | null {
  const number = typeof value === "string" ? Number(value) : value;
  return typeof number === "number" && Number.isFinite(number) ? number : null;
}

export type RakutenVacantHotelParams = HotelSearchParams & {
  hotelNo?: string | number;
  largeClassCode?: string;
  middleClassCode?: string;
  smallClassCode?: string;
  detailClassCode?: string;
  latitude?: number;
  longitude?: number;
  searchRadius?: number;
};

export function mapRakutenKeywordHotelToHotel(
  entry: RakutenHotelEntry,
): Hotel | null {
  const basicInfo = entry.hotelBasicInfo;
  if (!basicInfo?.hotelNo || !basicInfo.hotelName) return null;

  const address = `${basicInfo.address1 ?? ""}${basicInfo.address2 ?? ""}`.trim();
  const bookingUrl =
    basicInfo.hotelInformationUrl || basicInfo.planListUrl || "";
  const amenityText = [
    basicInfo.hotelName,
    basicInfo.hotelSpecial,
    basicInfo.hotelDescription,
    basicInfo.access,
    basicInfo.parkingInformation,
    basicInfo.nearestStation,
    address,
  ].filter(Boolean).join(" ");

  return {
    id: `rakuten-${basicInfo.hotelNo}`,
    providerIds: { rakuten: String(basicInfo.hotelNo) },
    name: basicInfo.hotelName,
    area: address || entry.hotelDetailInfo?.areaName || "エリア情報なし",
    rating: toNullableFiniteNumber(basicInfo.reviewAverage),
    hotelClass: null,
    amenities: [],
    amenityText,
    access: basicInfo.access ?? undefined,
    description: basicInfo.hotelSpecial ?? basicInfo.hotelDescription ?? undefined,
    sourceFields: {
      rating: "hotelBasicInfo.reviewAverage",
      amenities: [
        "hotelBasicInfo.hotelName",
        "hotelBasicInfo.hotelSpecial",
        "hotelBasicInfo.hotelDescription",
        "hotelBasicInfo.access",
        "hotelBasicInfo.parkingInformation",
        "hotelBasicInfo.nearestStation",
        "hotelBasicInfo.address1",
        "hotelBasicInfo.address2",
      ],
    },
    imageUrl:
      basicInfo.hotelImageUrl || basicInfo.hotelThumbnailUrl || "",
    offers: [
      {
        site: "楽天トラベル",
        price: Math.max(0, toFiniteNumber(basicInfo.hotelMinCharge)),
        bookingUrl,
        priceLabel: "参考最安値",
        sourcePriceField: "hotelBasicInfo.hotelMinCharge",
        isDateSpecific: false,
        roomType: "プラン詳細は予約サイトで確認",
        hasBreakfast: false,
        cancellation: "予約サイトで確認",
      },
    ],
  };
}

export function mapRakutenVacantHotelToHotel(
  entry: RakutenHotelEntry,
): Hotel | null {
  const hotel = mapRakutenKeywordHotelToHotel(entry);
  if (!hotel) return null;

  const offers: Hotel["offers"] = (entry.roomInfo ?? []).flatMap(
    (roomInfo) => {
      const { roomBasicInfo } = roomInfo;
      if (!roomBasicInfo) return [];
      return [
        {
          site: "楽天トラベル",
          price: Math.max(
            0,
            toFiniteNumber(
              roomInfo.dailyCharge?.total ?? roomBasicInfo.dailyCharge?.total,
            ),
          ),
          bookingUrl:
            roomInfo.reserveUrl ||
            roomBasicInfo.reserveUrl ||
            hotel.offers[0]?.bookingUrl ||
            "",
          roomType:
            roomBasicInfo.planName ||
            roomBasicInfo.roomName ||
            "プラン詳細は予約サイトで確認",
          priceLabel: "指定日の最安値",
          sourcePriceField: "dailyCharge.total",
          isDateSpecific: true,
          planName: roomBasicInfo.planName ?? undefined,
          roomName: roomBasicInfo.roomName ?? undefined,
          hasBreakfast: String(roomBasicInfo.withBreakfastFlag) === "1",
          cancellation: "予約サイトで確認",
        },
      ];
    },
  );

  return offers.length > 0 ? { ...hotel, offers } : hotel;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getObjectKeys(value: unknown): string[] {
  return isRecord(value) ? Object.keys(value) : [];
}

function getFirstRecord(value: unknown): Record<string, unknown> | null {
  if (isRecord(value)) return value;
  if (!Array.isArray(value)) return null;
  return value.find(isRecord) ?? null;
}

function getRawHotelKeys(value: unknown): string[] {
  return getObjectKeys(getFirstRecord(value));
}

function getHotelKeys(value: unknown): string[] {
  const rawHotel = getFirstRecord(value);
  if (!rawHotel) return [];
  return getObjectKeys(getFirstRecord(rawHotel.hotel));
}

function isRakutenHotelBasicInfo(value: unknown): value is RakutenHotelBasicInfo {
  if (!isRecord(value)) return false;
  return "hotelNo" in value || "hotelName" in value;
}

function getBasicInfoValue(value: unknown): RakutenHotelBasicInfo | null {
  if (isRakutenHotelBasicInfo(value)) return value;
  if (!Array.isArray(value)) return null;
  return value.find(isRakutenHotelBasicInfo) ?? null;
}

function extractHotelBasicInfo(rawHotel: unknown): ExtractedHotelBasicInfo | null {
  if (Array.isArray(rawHotel)) {
    const firstRawHotel = rawHotel[0];
    const firstExtracted = extractHotelBasicInfo(firstRawHotel);
    if (firstExtracted) {
      return {
        basicInfo: firstExtracted.basicInfo,
        pattern: `rawHotel[0].${firstExtracted.pattern.replace(/^rawHotel\./, "")}`,
      };
    }

    const extracted = rawHotel
      .map(extractHotelBasicInfo)
      .find((info): info is ExtractedHotelBasicInfo => info !== null);
    if (extracted) {
      return {
        basicInfo: extracted.basicInfo,
        pattern: `rawHotel.find(item => item.hotelBasicInfo).${extracted.pattern.replace(/^rawHotel\./, "")}`,
      };
    }
    return null;
  }

  if (!isRecord(rawHotel)) return null;

  const directBasicInfo = getBasicInfoValue(rawHotel.hotelBasicInfo);
  if (directBasicInfo) {
    return {
      basicInfo: directBasicInfo,
      pattern: Array.isArray(rawHotel.hotelBasicInfo)
        ? "rawHotel.hotelBasicInfo[0]"
        : "rawHotel.hotelBasicInfo",
    };
  }

  const hotel = rawHotel.hotel;
  if (isRecord(hotel)) {
    const nestedBasicInfo = getBasicInfoValue(hotel.hotelBasicInfo);
    if (nestedBasicInfo) {
      return {
        basicInfo: nestedBasicInfo,
        pattern: Array.isArray(hotel.hotelBasicInfo)
          ? "rawHotel.hotel.hotelBasicInfo[0]"
          : "rawHotel.hotel.hotelBasicInfo",
      };
    }
  }

  if (Array.isArray(hotel)) {
    const firstHotel = hotel[0];
    if (isRecord(firstHotel)) {
      const firstBasicInfo = getBasicInfoValue(firstHotel.hotelBasicInfo);
      if (firstBasicInfo) {
        return {
          basicInfo: firstBasicInfo,
          pattern: Array.isArray(firstHotel.hotelBasicInfo)
            ? "rawHotel.hotel[0].hotelBasicInfo[0]"
            : "rawHotel.hotel[0].hotelBasicInfo",
        };
      }
    }

    const hotelWithBasicInfo = hotel.find((item) =>
      isRecord(item) && getBasicInfoValue(item.hotelBasicInfo),
    );
    if (isRecord(hotelWithBasicInfo)) {
      const foundBasicInfo = getBasicInfoValue(hotelWithBasicInfo.hotelBasicInfo);
      if (foundBasicInfo) {
        return {
          basicInfo: foundBasicInfo,
          pattern: Array.isArray(hotelWithBasicInfo.hotelBasicInfo)
            ? "rawHotel.hotel.find(item => item.hotelBasicInfo).hotelBasicInfo[0]"
            : "rawHotel.hotel.find(item => item.hotelBasicInfo).hotelBasicInfo",
        };
      }
    }
  }

  return null;
}

function addRoomInfo(
  entry: RakutenHotelEntry,
  value: unknown,
): void {
  if (Array.isArray(value)) {
    entry.roomInfo = [
      ...(entry.roomInfo ?? []),
      ...(value as NonNullable<RakutenHotelEntry["roomInfo"]>),
    ];
  } else if (isRecord(value)) {
    entry.roomInfo = [
      ...(entry.roomInfo ?? []),
      value as NonNullable<RakutenHotelEntry["roomInfo"]>[number],
    ];
  }
}

function mergeRakutenHotelPart(
  entry: RakutenHotelEntry,
  part: Record<string, unknown>,
): void {
  const basicInfo = getBasicInfoValue(part.hotelBasicInfo);
  if (basicInfo) {
    entry.hotelBasicInfo = basicInfo;
  }
  if (isRecord(part.hotelDetailInfo)) {
    entry.hotelDetailInfo =
      part.hotelDetailInfo as RakutenHotelEntry["hotelDetailInfo"];
  }
  addRoomInfo(entry, part.roomInfo);
}

function normalizeRakutenHotelEntry(value: unknown): RakutenHotelEntry | null {
  if (Array.isArray(value)) {
    const entry: RakutenHotelEntry = {};
    for (const part of value) {
      const nestedEntry = normalizeRakutenHotelEntry(part);
      if (!nestedEntry) continue;
      if (nestedEntry.hotelBasicInfo && !entry.hotelBasicInfo) {
        entry.hotelBasicInfo = nestedEntry.hotelBasicInfo;
      }
      if (nestedEntry.hotelDetailInfo && !entry.hotelDetailInfo) {
        entry.hotelDetailInfo = nestedEntry.hotelDetailInfo;
      }
      if (nestedEntry.roomInfo) addRoomInfo(entry, nestedEntry.roomInfo);
    }
    return entry.hotelBasicInfo ? entry : null;
  }

  if (!isRecord(value)) return null;

  const entry: RakutenHotelEntry = {};
  const extractedBasicInfo = extractHotelBasicInfo(value);
  if (extractedBasicInfo) {
    entry.hotelBasicInfo = extractedBasicInfo.basicInfo;
  }
  mergeRakutenHotelPart(entry, value);

  const parts = Array.isArray(value.hotel)
    ? value.hotel
    : isRecord(value.hotel)
    ? [value.hotel]
    : [];
  for (const part of parts) {
    if (!isRecord(part)) continue;
    mergeRakutenHotelPart(entry, part);

    const nestedEntry = normalizeRakutenHotelEntry(part);
    if (nestedEntry?.hotelBasicInfo && !entry.hotelBasicInfo) {
      entry.hotelBasicInfo = nestedEntry.hotelBasicInfo;
    }
    if (nestedEntry?.hotelDetailInfo && !entry.hotelDetailInfo) {
      entry.hotelDetailInfo = nestedEntry.hotelDetailInfo;
    }
    if (nestedEntry?.roomInfo) addRoomInfo(entry, nestedEntry.roomInfo);
  }
  return entry.hotelBasicInfo ? entry : null;
}

function createRakutenDebug(
  rawCount: number,
  mappedCount: number,
  warnings: string[],
  diagnostics: Partial<HotelProviderDebugInfo> = {},
): HotelProviderDebugInfo {
  return {
    provider: "rakuten",
    rawCount,
    mappedCount,
    warnings,
    ...diagnostics,
  };
}

async function fetchRakutenHotelsWithDebug(
  endpoint: string,
  params: URLSearchParams,
  mapper: (entry: RakutenHotelEntry) => Hotel | null = mapRakutenKeywordHotelToHotel,
): Promise<RakutenHotelFetchResult> {
  const { response, responseBody, requestUrl } = await fetchRakutenApi(
    endpoint,
    params,
    {
      next: { revalidate: 300 },
    },
  );
  const data = parseRakutenResponse(responseBody);

  if (!data || !isRecord(data)) {
    if (!response.ok) {
      console.error("Rakuten Travel API request failed", {
        status: response.status,
        responseBodySnippet: getRakutenResponseBodySnippet(responseBody),
        url: maskRakutenUrl(requestUrl),
      });
      throw new Error(
        `楽天トラベルAPIからホテル情報を取得できませんでした: HTTP ${response.status}`,
      );
    }
    throw new Error("楽天トラベルAPIのレスポンス形式が不正です。");
  }

  if (response.status === 404 && data?.error === "not_found") {
    return {
      hotels: [],
      debug: createRakutenDebug(0, 0, ["楽天APIは0件を返しました。"]),
    };
  }

  if (!response.ok || !data || data.error) {
    const responseDetail = data?.error_description ?? data?.error;
    const detail = !response.ok
      ? `HTTP ${response.status}${responseDetail ? `: ${responseDetail}` : ""}`
      : responseDetail ?? `HTTP ${response.status}`;
    console.error("Rakuten Travel API request failed", {
      status: response.status,
      responseBodySnippet: getRakutenResponseBodySnippet(responseBody),
      url: maskRakutenUrl(requestUrl),
    });
    throw new Error(`楽天トラベルAPIからホテル情報を取得できませんでした: ${detail}`);
  }

  if (!Array.isArray(data.hotels)) {
    console.warn("Rakuten Travel API unexpected hotel list shape", {
      status: response.status,
      topLevelKeys: getObjectKeys(data),
    hotelsIsArray: Array.isArray(data.hotels),
    hotelsLength: null,
      firstHotelKeys: [],
      hotelBasicInfoFound: false,
    });
    throw new Error("楽天トラベルAPIのホテル一覧レスポンス形式が不正です。");
  }

  const rawHotels = data.hotels;
  const extractedInfos = rawHotels.map(extractHotelBasicInfo);
  const normalizedEntries = rawHotels.flatMap((rawHotel) => {
    const entry = normalizeRakutenHotelEntry(rawHotel);
    return entry ? [entry] : [];
  });
  const mappedHotels = normalizedEntries.map((entry) => ({
    entry,
    hotel: mapper(entry),
  }));
  const hotels = mappedHotels
    .map(({ hotel }) => hotel)
    .filter((hotel): hotel is Hotel => hotel !== null);
  const hotelBasicInfoFound = normalizedEntries.some((entry) =>
    Boolean(entry.hotelBasicInfo),
  );
  const detectedPattern =
    extractedInfos.find((info): info is ExtractedHotelBasicInfo => info !== null)
      ?.pattern ?? "not_detected";
  const warnings: string[] = [];

  if (rawHotels.length === 0) {
    warnings.push("楽天APIは0件を返しました。");
  } else if (hotels.length === 0) {
    warnings.push(
      "楽天APIはホテル候補を返しましたが、Hotel型への変換結果が0件でした。",
    );
  }
  if (!hotelBasicInfoFound && rawHotels.length > 0) {
    warnings.push("楽天APIレスポンス内でhotelBasicInfoを検出できませんでした。");
  }
  const missingHotelNoCount = normalizedEntries.filter(
    (entry) => !entry.hotelBasicInfo?.hotelNo,
  ).length;
  if (missingHotelNoCount > 0) {
    warnings.push(
      `hotelNoを取得できないホテル候補が${missingHotelNoCount}件あり、変換対象から外しました。`,
    );
  }

  const logPayload = {
    status: response.status,
    topLevelKeys: getObjectKeys(data),
    hotelsIsArray: Array.isArray(data.hotels),
    hotelsLength: rawHotels.length,
    firstHotelKeys: getRawHotelKeys(rawHotels[0]),
    firstHotelHotelKeys: getHotelKeys(rawHotels[0]),
    hotelBasicInfoFound,
    detectedPattern,
  };
  if (warnings.length > 0) {
    console.warn("Rakuten Travel API hotel response diagnostics", logPayload);
  } else {
    console.info("Rakuten Travel API hotel response diagnostics", logPayload);
  }

  return {
    hotels,
    debug: createRakutenDebug(rawHotels.length, hotels.length, warnings, {
      responseTopLevelKeys: getObjectKeys(data),
      firstRawHotelKeys: getRawHotelKeys(rawHotels[0]),
      firstRawHotelHotelKeys: getHotelKeys(rawHotels[0]),
      detectedPattern,
    }),
  };
}

async function fetchRakutenHotels(
  endpoint: string,
  params: URLSearchParams,
  mapper: (entry: RakutenHotelEntry) => Hotel | null = mapRakutenKeywordHotelToHotel,
): Promise<Hotel[]> {
  return (await fetchRakutenHotelsWithDebug(endpoint, params, mapper)).hotels;
}

async function fetchRakutenHotelPages(
  endpoint: string,
  params: URLSearchParams,
  mapper: (entry: RakutenHotelEntry) => Hotel | null = mapRakutenKeywordHotelToHotel,
): Promise<RakutenHotelFetchResult> {
  const pages = await Promise.all(
    Array.from({ length: RAKUTEN_LIST_PAGE_COUNT }, async (_, index) => {
      const pageParams = new URLSearchParams(params);
      pageParams.set("page", String(index + 1));
      return fetchRakutenHotelsWithDebug(endpoint, pageParams, mapper);
    }),
  );
  const warnings = pages.flatMap((result) => result.debug.warnings);
  const hotels = mergeHotelsByIdentity(pages.flatMap((result) => result.hotels));
  const firstDebug = pages[0]?.debug;

  return {
    hotels,
    debug: createRakutenDebug(
      pages.reduce((sum, result) => sum + result.debug.rawCount, 0),
      hotels.length,
      warnings,
      {
        responseTopLevelKeys: firstDebug?.responseTopLevelKeys,
        firstRawHotelKeys: firstDebug?.firstRawHotelKeys,
        firstRawHotelHotelKeys: firstDebug?.firstRawHotelHotelKeys,
        detectedPattern: firstDebug?.detectedPattern,
      },
    ),
  };
}

export async function getRakutenHotelsByKeyword({
  keyword,
}: { keyword?: string } = {}): Promise<Hotel[]> {
  return (await getRakutenHotelsByKeywordWithDebug({ keyword })).hotels;
}

export async function getRakutenHotelsByKeywordWithDebug({
  keyword,
}: { keyword?: string } = {}): Promise<RakutenHotelFetchResult> {
  const params = createRakutenParams(getRakutenCredentials());
  params.set("keyword", keyword?.trim() || DEFAULT_KEYWORD);
  params.set("hits", String(RAKUTEN_LIST_HITS));
  params.set("sort", "standard");

  return fetchRakutenHotelPages(KEYWORD_SEARCH_ENDPOINT, params);
}

function hasVacantSearchArea(params: RakutenVacantHotelParams): boolean {
  const area = params.rakutenAreaCandidate;
  const hasAreaCode = Boolean(
    area?.areaClassCode ??
      params.areaClassCode ??
      params.largeClassCode ??
      area?.middleClassCode ??
      params.middleClassCode ??
      area?.smallClassCode ??
      params.smallClassCode ??
      area?.detailClassCode ??
      params.detailClassCode,
  );
  const hasCoordinates =
    Number.isFinite(params.latitude) && Number.isFinite(params.longitude);
  return Boolean(params.hotelNo || hasAreaCode || hasCoordinates);
}

export async function getRakutenVacantHotels(
  options: RakutenVacantHotelParams = {},
): Promise<Hotel[]> {
  return (await getRakutenVacantHotelsWithDebug(options)).hotels;
}

export async function getRakutenVacantHotelsWithDebug(
  options: RakutenVacantHotelParams = {},
): Promise<RakutenHotelFetchResult> {
  const { keyword, checkIn, checkOut, guests } = options;

  if (!checkIn || !checkOut || !guests) {
    return getRakutenHotelsByKeywordWithDebug({ keyword });
  }

  // VacantHotelSearch does not accept a free-text keyword as its location.
  if (!hasVacantSearchArea(options)) {
    return getRakutenHotelsByKeywordWithDebug({ keyword });
  }

  const params = createRakutenParams(getRakutenCredentials());
  const area = options.rakutenAreaCandidate;
  params.set("checkinDate", checkIn);
  params.set("checkoutDate", checkOut);
  params.set("adultNum", String(guests));
  params.set("roomNum", "1");
  params.set("hits", String(RAKUTEN_LIST_HITS));
  // 一覧はホテル単位で取得する。プラン単位の searchPattern=1 は、
  // 同一ホテルのプランに偏りやすいため指定日最安値の補完時だけに使う。
  params.set("searchPattern", "0");
  params.set("sort", "+roomCharge");
  params.set("responseType", "large");

  if (options.hotelNo) params.set("hotelNo", String(options.hotelNo));
  const largeClassCode =
    area?.areaClassCode ?? options.areaClassCode ?? options.largeClassCode;
  const middleClassCode = area?.middleClassCode ?? options.middleClassCode;
  const smallClassCode = area?.smallClassCode ?? options.smallClassCode;
  if (largeClassCode) params.set("largeClassCode", largeClassCode);
  if (middleClassCode) params.set("middleClassCode", middleClassCode);
  if (smallClassCode) params.set("smallClassCode", smallClassCode);
  if (options.latitude !== undefined) params.set("latitude", String(options.latitude));
  if (options.longitude !== undefined) params.set("longitude", String(options.longitude));
  if (options.searchRadius !== undefined) {
    params.set("searchRadius", String(options.searchRadius));
  }

  const fetchVacantHotels = (searchParams: URLSearchParams) =>
    fetchRakutenHotelPages(
      VACANT_HOTEL_SEARCH_ENDPOINT,
      searchParams,
      mapRakutenVacantHotelToHotel,
    );
  const fallBackToKeyword = async (): Promise<RakutenHotelFetchResult> => {
    const keywordResult = await getRakutenHotelsByKeywordWithDebug({ keyword });
    return {
      ...keywordResult,
      debug: {
        ...keywordResult.debug,
        warnings: [
          ...keywordResult.debug.warnings,
          "指定した地区では候補が見つからなかったため、目的地キーワードで検索しました。",
        ],
      },
    };
  };

  try {
    const narrowResult = await fetchVacantHotels(params);
    if (!smallClassCode || narrowResult.hotels.length >= MIN_AREA_RESULT_COUNT) {
      return narrowResult.hotels.length > 0 || !keyword
        ? narrowResult
        : fallBackToKeyword();
    }

    const broaderParams = new URLSearchParams(params);
    broaderParams.delete("smallClassCode");
    const broadResult = await fetchVacantHotels(broaderParams);
    if (broadResult.hotels.length <= narrowResult.hotels.length) {
      return narrowResult.hotels.length > 0 || !keyword
        ? narrowResult
        : fallBackToKeyword();
    }

    return {
      ...broadResult,
      debug: {
        ...broadResult.debug,
        warnings: [
          ...broadResult.debug.warnings,
          "指定した地区では候補が少なかったため、周辺エリアも含めて検索しました。",
        ],
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isInvalidDetailClassCode =
      message.includes("HTTP 400") &&
      message.toLowerCase().includes("detailclasscode");

    if (!isInvalidDetailClassCode || !params.has("detailClassCode")) {
      throw error;
    }

    // GetAreaClass の階層データと VacantHotelSearch の詳細地区コードが
    // 一時的に不整合な場合でも、中分類/小分類で検索を継続する。
    const fallbackParams = new URLSearchParams(params);
    fallbackParams.delete("detailClassCode");
    const result = await fetchVacantHotels(fallbackParams);

    return {
      ...result,
      debug: {
        ...result.debug,
        warnings: [
          ...result.debug.warnings,
          "選択した詳細地区コードを楽天APIが受け付けなかったため、広い地区条件で検索しました。",
        ],
      },
    };
  }
}

/** @deprecated Use getRakutenHotelsByKeyword or getRakutenVacantHotels. */
export const getRakutenHotels = getRakutenHotelsByKeyword;

export async function getRakutenHotelById(
  id: string | number,
): Promise<Hotel | undefined> {
  const params = createRakutenParams(getRakutenCredentials());
  params.set("hotelNo", String(id).replace(/^rakuten-/, ""));

  return (await fetchRakutenHotels(HOTEL_DETAIL_ENDPOINT, params))[0];
}

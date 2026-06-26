import "server-only";

import {
  createRakutenParams,
  fetchRakutenApi,
  getRakutenCredentials,
  getRakutenResponseBodySnippet,
  maskRakutenUrl,
} from "./rakutenShared";

const VACANT_HOTEL_SEARCH_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/VacantHotelSearch/20170426";

export type RakutenDateSpecificPriceStatus = "available" | "not_found";

export type RakutenDateSpecificLowestPrice = {
  hotelId: string;
  hotelNo: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  price: number | null;
  bookingUrl: string;
  reserveUrl: string;
  planListUrl: string;
  hotelInformationUrl: string;
  planName?: string;
  roomName?: string;
  sourcePriceField: "dailyCharge.total" | "dailyCharge.rakutenCharge";
  matchedPlanCount: number;
  rawPlanCount: number;
  extractedPriceCount: number;
  searchPatternsTried: string[];
  pagesFetched: number;
  chargeFlags: string[];
  status: RakutenDateSpecificPriceStatus;
  warnings: string[];
};

type RakutenResponse = {
  hotels?: unknown[];
  error?: string;
  error_description?: string;
};

type PlanPriceCandidate = {
  price: number;
  sourcePriceField: "dailyCharge.total" | "dailyCharge.rakutenCharge";
  reserveUrl: string;
  planName?: string;
  roomName?: string;
  chargeFlag?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseResponse(body: string): RakutenResponse | null {
  try {
    return JSON.parse(body) as RakutenResponse;
  } catch {
    return null;
  }
}

function toPositiveNumber(value: unknown): number | null {
  const number = typeof value === "string" ? Number(value.replace(/,/g, "")) : value;
  return typeof number === "number" && Number.isFinite(number) && number > 0
    ? number
    : null;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function getRakutenHotelNo(hotelId: string): string {
  return hotelId.replace(/^rakuten-/, "").trim();
}

function findRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(findRecords);
  if (!isRecord(value)) return [];
  return [
    value,
    ...Object.values(value).flatMap((child) =>
      Array.isArray(child) || isRecord(child) ? findRecords(child) : [],
    ),
  ];
}

function findHotelBasicInfo(value: unknown): Record<string, unknown> | null {
  return (
    findRecords(value).find((record) =>
      Boolean(record.hotelNo || record.hotelName || record.planListUrl),
    ) ?? null
  );
}

function dailyChargeRecords(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  return isRecord(value) ? [value] : [];
}

function collectPlanPrices(value: unknown): {
  prices: PlanPriceCandidate[];
  rawPlanCount: number;
} {
  const candidates: PlanPriceCandidate[] = [];
  let rawPlanCount = 0;
  const visit = (
    current: unknown,
    context: Omit<PlanPriceCandidate, "price" | "sourcePriceField"> = {
      reserveUrl: "",
    },
  ) => {
    if (Array.isArray(current)) {
      current.forEach((item) => visit(item, context));
      return;
    }
    if (!isRecord(current)) return;

    const nextContext = {
      reserveUrl: getString(current.reserveUrl) || context.reserveUrl,
      planName: getString(current.planName) || context.planName,
      roomName: getString(current.roomName) || context.roomName,
      chargeFlag: getString(current.chargeFlag) || context.chargeFlag,
    };
    if (nextContext.reserveUrl || nextContext.planName || nextContext.roomName) {
      rawPlanCount += 1;
    }
    for (const dailyCharge of dailyChargeRecords(current.dailyCharge)) {
      const chargeFlag = getString(dailyCharge.chargeFlag) || nextContext.chargeFlag;
      const total = toPositiveNumber(dailyCharge.total);
      const rakutenCharge = toPositiveNumber(dailyCharge.rakutenCharge);
      if (total !== null) {
        candidates.push({
          price: total,
          sourcePriceField: "dailyCharge.total",
          ...nextContext,
          chargeFlag,
        });
      } else if (rakutenCharge !== null) {
        candidates.push({
          price: rakutenCharge,
          sourcePriceField: "dailyCharge.rakutenCharge",
          ...nextContext,
          chargeFlag,
        });
      }
    }
    Object.values(current).forEach((child) => {
      if (Array.isArray(child) || isRecord(child)) visit(child, nextContext);
    });
  };
  visit(value);
  const seen = new Set<string>();
  const prices = candidates
    .filter((candidate) => {
      const key = [
        candidate.price,
        candidate.reserveUrl,
        candidate.sourcePriceField,
        candidate.planName ?? "",
        candidate.roomName ?? "",
      ].join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.price - b.price);
  return { prices, rawPlanCount };
}

function applyStayParams(
  url: URL,
  checkInDate: string,
  checkOutDate: string,
  adults: number,
): void {
  const [checkInYear, checkInMonth, checkInDay] = checkInDate.split("-");
  const [checkOutYear, checkOutMonth, checkOutDay] = checkOutDate.split("-");
  url.searchParams.set("f_nen1", checkInYear);
  url.searchParams.set("f_tuki1", checkInMonth);
  url.searchParams.set("f_hi1", checkInDay);
  url.searchParams.set("f_nen2", checkOutYear);
  url.searchParams.set("f_tuki2", checkOutMonth);
  url.searchParams.set("f_hi2", checkOutDay);
  url.searchParams.set("f_otona_su", String(adults));
  if (!url.searchParams.has("f_heya_su")) {
    url.searchParams.set("f_heya_su", "1");
  }
}

export function createRakutenPlanDetailUrl({
  reserveUrl,
  hotelNo,
  checkInDate,
  checkOutDate,
  adults,
}: {
  reserveUrl: string;
  hotelNo: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
}): string {
  if (!reserveUrl) return "";
  try {
    const sourceUrl = new URL(reserveUrl);
    const planUrl = new URL(
      `https://hotel.travel.rakuten.co.jp/hotelinfo/plan/${hotelNo}`,
    );
    sourceUrl.searchParams.forEach((value, key) => {
      planUrl.searchParams.set(key, value);
    });
    applyStayParams(planUrl, checkInDate, checkOutDate, adults);
    return planUrl.toString();
  } catch {
    return "";
  }
}

/** 楽天トラベル画面用URLへ、指定した宿泊条件を安全に反映する。 */
export function appendRakutenTravelSearchParams(
  rawUrl: string,
  {
    checkInDate,
    checkOutDate,
    adults,
    roomNum = 1,
  }: {
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    roomNum?: number;
  },
): string {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";

    url.searchParams.set("checkinDate", checkInDate);
    url.searchParams.set("checkoutDate", checkOutDate);
    url.searchParams.set("adultNum", String(adults));
    url.searchParams.set("roomNum", String(roomNum));
    url.searchParams.set("f_checkin", checkInDate);
    url.searchParams.set("f_checkout", checkOutDate);
    url.searchParams.set("f_otona_su", String(adults));
    url.searchParams.set("f_heya_su", String(roomNum));
    applyStayParams(url, checkInDate, checkOutDate, adults);
    return url.toString();
  } catch {
    return "";
  }
}

function isNotFoundResponse(
  response: Response,
  data: RakutenResponse | null,
  body: string,
): boolean {
  const detail = `${data?.error ?? ""} ${data?.error_description ?? ""} ${body}`;
  return (
    response.status === 404 ||
    data?.error === "not_found" ||
    /not[_\s-]?found|Data Not Found/i.test(detail)
  );
}

function createNotFoundResult({
  hotelId,
  hotelNo,
  checkInDate,
  checkOutDate,
  adults,
  planListUrl = "",
  hotelInformationUrl = "",
  warnings = ["指定条件に合う空室・料金が見つかりませんでした"],
}: {
  hotelId: string;
  hotelNo: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  planListUrl?: string;
  hotelInformationUrl?: string;
  warnings?: string[];
}): RakutenDateSpecificLowestPrice {
  return {
    hotelId,
    hotelNo,
    checkInDate,
    checkOutDate,
    adults,
    price: null,
    bookingUrl: "",
    reserveUrl: "",
    planListUrl,
    hotelInformationUrl,
    sourcePriceField: "dailyCharge.total",
    matchedPlanCount: 0,
    rawPlanCount: 0,
    extractedPriceCount: 0,
    searchPatternsTried: [],
    pagesFetched: 0,
    chargeFlags: [],
    status: "not_found",
    warnings,
  };
}

export async function fetchRakutenDateSpecificLowestPrice({
  hotelId,
  checkInDate,
  checkOutDate,
  adults,
}: {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
}): Promise<RakutenDateSpecificLowestPrice> {
  const hotelNo = getRakutenHotelNo(hotelId);
  if (!hotelNo) {
    throw new Error("楽天施設番号を取得できませんでした。");
  }

  const searchPatternsTried: string[] = [];
  const warnings: string[] = [];
  const allPrices: PlanPriceCandidate[] = [];
  let pagesFetched = 0;
  let rawPlanCount = 0;
  let planListUrl = "";
  let hotelInformationUrl = "";

  const fetchPage = async (searchPattern: "0" | "1", page: number) => {
    const params = createRakutenParams(getRakutenCredentials());
    params.set("hotelNo", hotelNo);
    params.set("checkinDate", checkInDate);
    params.set("checkoutDate", checkOutDate);
    params.set("adultNum", String(adults));
    params.set("roomNum", "1");
    params.set("searchPattern", searchPattern);
    params.set("sort", "+roomCharge");
    params.set("responseType", "large");
    params.set("hits", "30");
    params.set("page", String(page));

    const { response, responseBody, requestUrl } = await fetchRakutenApi(
      VACANT_HOTEL_SEARCH_ENDPOINT,
      params,
      { next: { revalidate: 0 } },
    );
    pagesFetched += 1;
    const data = parseResponse(responseBody);
    if (isNotFoundResponse(response, data, responseBody)) return;
    if (!data || !isRecord(data) || !response.ok || data.error) {
      console.error("Rakuten date specific price request failed", {
        status: response.status,
        responseBodySnippet: getRakutenResponseBodySnippet(responseBody),
        url: maskRakutenUrl(requestUrl),
      });
      const detail = data?.error_description ?? data?.error ?? `HTTP ${response.status}`;
      throw new Error(`楽天トラベルAPIから指定日最安値を取得できませんでした: ${detail}`);
    }
    const basicInfo = findHotelBasicInfo(data.hotels);
    planListUrl ||= getString(basicInfo?.planListUrl);
    hotelInformationUrl ||= getString(basicInfo?.hotelInformationUrl);
    const extracted = collectPlanPrices(data.hotels);
    rawPlanCount += extracted.rawPlanCount;
    allPrices.push(...extracted.prices);
  };

  searchPatternsTried.push("1");
  await fetchPage("1", 1);
  if (!allPrices.some((price) => price.sourcePriceField === "dailyCharge.total")) {
    await fetchPage("1", 2);
  }
  if (!allPrices.some((price) => price.sourcePriceField === "dailyCharge.total")) {
    searchPatternsTried.push("0");
    await fetchPage("0", 1);
    if (!allPrices.some((price) => price.sourcePriceField === "dailyCharge.total")) {
      await fetchPage("0", 2);
    }
  }

  const totalPrices = allPrices
    .filter((price) => price.sourcePriceField === "dailyCharge.total")
    .sort((a, b) => a.price - b.price);
  const rakutenChargePrices = allPrices
    .filter((price) => price.sourcePriceField === "dailyCharge.rakutenCharge")
    .sort((a, b) => a.price - b.price);
  const lowestPlan = totalPrices[0] ?? rakutenChargePrices[0];

  if (!lowestPlan) {
    return {
      ...createNotFoundResult({
        hotelId,
        hotelNo,
        checkInDate,
        checkOutDate,
        adults,
        planListUrl,
        hotelInformationUrl,
        warnings: ["指定条件の料金を空室検索APIから取得できませんでした"],
      }),
      rawPlanCount,
      searchPatternsTried,
      pagesFetched,
    };
  }
  if (lowestPlan.sourcePriceField === "dailyCharge.rakutenCharge") {
    warnings.push(
      "dailyCharge.totalが取得できなかったため、rakutenChargeをfallbackとして使用しました",
    );
  }

  const bookingUrl =
    appendRakutenTravelSearchParams(lowestPlan.reserveUrl, {
      checkInDate,
      checkOutDate,
      adults,
    }) ||
    appendRakutenTravelSearchParams(planListUrl, {
      checkInDate,
      checkOutDate,
      adults,
    }) ||
    appendRakutenTravelSearchParams(hotelInformationUrl, {
      checkInDate,
      checkOutDate,
      adults,
    });

  return {
    hotelId,
    hotelNo,
    checkInDate,
    checkOutDate,
    adults,
    price: lowestPlan.price,
    bookingUrl,
    reserveUrl: lowestPlan.reserveUrl,
    planListUrl,
    hotelInformationUrl,
    planName: lowestPlan.planName,
    roomName: lowestPlan.roomName,
    sourcePriceField: lowestPlan.sourcePriceField,
    matchedPlanCount: totalPrices.length,
    rawPlanCount,
    extractedPriceCount:
      lowestPlan.sourcePriceField === "dailyCharge.total"
        ? totalPrices.length
        : rakutenChargePrices.length,
    searchPatternsTried,
    pagesFetched,
    chargeFlags: [
      ...new Set(
        allPrices
          .map((price) => price.chargeFlag)
          .filter((chargeFlag): chargeFlag is string => Boolean(chargeFlag)),
      ),
    ],
    status: "available",
    warnings,
  };
}

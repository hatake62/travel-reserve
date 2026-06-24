import type { Hotel } from "@/types/hotel";
import type { HotelSearchParams } from "@/types/search";

const JALAN_HOTEL_SEARCH_ENDPOINT =
  "http://jws.jalan.net/APIAdvance/HotelSearch/V1/";
const DEFAULT_KEYWORD = "東京";

type JalanHotel = {
  HotelID?: string | number | null;
  HotelName?: string | null;
  HotelAddress?: string | null;
  Area?:
    | string
    | {
        Region?: string | null;
        Prefecture?: string | null;
        LargeArea?: string | null;
        SmallArea?: string | null;
      }
    | null;
  HotelDetailURL?: string | null;
  PlanListURL?: string | null;
  PictureURL?: string | null;
  PictureURLM?: string | null;
  SampleRateFrom?: string | number | null;
  Rating?: string | number | null;
};

function getApiKey(): string {
  const apiKey = process.env.JALAN_API_KEY;
  if (!apiKey) {
    throw new Error(
      "JALAN_API_KEYが設定されていません。.env.localのAPIキーを確認してください。",
    );
  }
  return apiKey;
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.-]/g, "");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  }
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findHotelEntries(value: unknown): JalanHotel[] {
  if (Array.isArray(value)) {
    return value.flatMap(findHotelEntries);
  }
  if (!isRecord(value)) return [];

  if ("HotelID" in value && "HotelName" in value) {
    return [value as JalanHotel];
  }

  return Object.values(value).flatMap(findHotelEntries);
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function getXmlValue(xml: string, tag: string): string | undefined {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return undefined;
  return decodeXml(match[1].replace(/<[^>]+>/g, "").trim());
}

function parseJalanXml(xml: string): JalanHotel[] {
  const hotelBlocks = xml.match(/<Hotel(?:\s[^>]*)?>[\s\S]*?<\/Hotel>/gi) ?? [];
  return hotelBlocks.map((block) => ({
    HotelID: getXmlValue(block, "HotelID"),
    HotelName: getXmlValue(block, "HotelName"),
    HotelAddress: getXmlValue(block, "HotelAddress"),
    Area: getXmlValue(block, "SmallArea") || getXmlValue(block, "LargeArea"),
    HotelDetailURL: getXmlValue(block, "HotelDetailURL"),
    PlanListURL: getXmlValue(block, "PlanListURL"),
    PictureURL: getXmlValue(block, "PictureURL"),
    PictureURLM: getXmlValue(block, "PictureURLM"),
    SampleRateFrom: getXmlValue(block, "SampleRateFrom"),
    Rating: getXmlValue(block, "Rating"),
  }));
}

function getArea(entry: JalanHotel): string {
  if (typeof entry.Area === "string") return entry.Area;
  if (entry.Area) {
    return [
      entry.Area.Prefecture,
      entry.Area.LargeArea,
      entry.Area.SmallArea,
      entry.Area.Region,
    ]
      .filter(Boolean)
      .join("・");
  }
  return "";
}

export function mapJalanHotelToHotel(entry: JalanHotel): Hotel | null {
  if (entry.HotelID === null || entry.HotelID === undefined || !entry.HotelName) {
    return null;
  }

  const bookingUrl = entry.HotelDetailURL || entry.PlanListURL || "";
  return {
    id: `jalan-${entry.HotelID}`,
    name: entry.HotelName,
    area: entry.HotelAddress || getArea(entry) || "エリア情報なし",
    rating: Math.max(0, toFiniteNumber(entry.Rating)),
    imageUrl: entry.PictureURL || entry.PictureURLM || "",
    offers: [
      {
        site: "じゃらん",
        price: Math.max(0, toFiniteNumber(entry.SampleRateFrom)),
        bookingUrl,
        roomType: "プラン詳細は予約サイトで確認",
        hasBreakfast: false,
        cancellation: "予約サイトで確認",
      },
    ],
  };
}

async function fetchJalanHotels(params: URLSearchParams): Promise<Hotel[]> {
  const response = await fetch(
    `${JALAN_HOTEL_SEARCH_ENDPOINT}?${params.toString()}`,
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    },
  );
  const body = await response.text();
  let data: unknown = null;
  try {
    data = JSON.parse(body);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const xmlMessage = getXmlValue(body, "Message");
    throw new Error(
      `じゃらんAPIからホテル情報を取得できませんでした: ${xmlMessage || `HTTP ${response.status}`}`,
    );
  }

  if (data !== null && isRecord(data) && (data.Error || data.error)) {
    const detail = String(data.Error ?? data.error);
    throw new Error(`じゃらんAPIからホテル情報を取得できませんでした: ${detail}`);
  }

  if (data === null && /<Error(?:\s|>)/i.test(body)) {
    throw new Error(
      `じゃらんAPIからホテル情報を取得できませんでした: ${getXmlValue(body, "Message") || "APIエラー"}`,
    );
  }

  const entries = data === null ? parseJalanXml(body) : findHotelEntries(data);
  return entries
    .map(mapJalanHotelToHotel)
    .filter((hotel): hotel is Hotel => hotel !== null);
}

export async function getJalanHotels(
  { keyword }: HotelSearchParams = {},
): Promise<Hotel[]> {
  const params = new URLSearchParams({
    key: getApiKey(),
    keyword: keyword?.trim() || DEFAULT_KEYWORD,
    count: "10",
    start: "1",
    format: "json",
  });

  return fetchJalanHotels(params);
}

export async function getJalanHotelById(
  id: string | number,
): Promise<Hotel | undefined> {
  const hotelId = String(id).replace(/^jalan-/, "");
  const params = new URLSearchParams({
    key: getApiKey(),
    h_id: hotelId,
    count: "1",
    start: "1",
    format: "json",
  });

  return (await fetchJalanHotels(params))[0];
}

import type { RakutenAreaCandidate } from "@/types/rakutenArea";
import {
  createRakutenParams,
  fetchRakutenApi,
  getRakutenCredentials,
  getRakutenResponseBodySnippet,
  maskRakutenUrl,
} from "./rakutenShared";

const AREA_CLASS_ENDPOINT =
  "https://openapi.rakuten.co.jp/engine/api/Travel/GetAreaClass/20140210";
const AREA_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type UnknownRecord = Record<string, unknown>;
type RakutenAreaResponse = UnknownRecord & {
  error?: string;
  error_description?: string;
};
type AreaSearchDebug = {
  rawMiddleClassCount: number;
  flattenedCandidateCount: number;
  matchedCount: number;
  normalizedKeywords: string[];
  firstCandidateLabels: string[];
  warnings: string[];
};
type AreaCache = {
  candidates: RakutenAreaCandidate[];
  rawMiddleClassCount: number;
  cachedAt: number;
};

let areaCache: AreaCache | null = null;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) return [value];
  return [];
}

function mergeRecords(value: unknown): UnknownRecord | null {
  if (isRecord(value)) return value;
  if (!Array.isArray(value)) return null;
  return value.filter(isRecord).reduce<UnknownRecord>(
    (merged, item) => ({
      ...merged,
      ...item,
    }),
    {},
  );
}

function unwrapClassRecord(value: unknown, key: string): UnknownRecord | null {
  const record = mergeRecords(value);
  if (!record) return null;
  return mergeRecords(record[key]) ?? record;
}

function text(record: UnknownRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function parseRakutenAreaResponse(body: string): RakutenAreaResponse | null {
  if (!body) return null;
  try {
    return JSON.parse(body) as RakutenAreaResponse;
  } catch {
    return null;
  }
}

function childRecords(
  parent: UnknownRecord,
  collectionKey: string,
  itemKey: string,
): UnknownRecord[] {
  const sources = [
    ...records(parent[collectionKey]).flatMap((collection) =>
      records(collection[itemKey] ?? collection),
    ),
    ...records(parent[itemKey]),
  ];
  return sources
    .map((item) => unwrapClassRecord(item, itemKey))
    .filter((item): item is UnknownRecord => Boolean(item));
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

const PREFECTURE_ALIASES: Record<string, string[]> = {
  北海道: ["北海道"],
  青森: ["青森", "青森県"],
  岩手: ["岩手", "岩手県"],
  宮城: ["宮城", "宮城県"],
  秋田: ["秋田", "秋田県"],
  山形: ["山形", "山形県"],
  福島: ["福島", "福島県"],
  茨城: ["茨城", "茨城県"],
  栃木: ["栃木", "栃木県"],
  群馬: ["群馬", "群馬県"],
  埼玉: ["埼玉", "埼玉県"],
  千葉: ["千葉", "千葉県"],
  東京: ["東京", "東京都"],
  神奈川: ["神奈川", "神奈川県"],
  新潟: ["新潟", "新潟県"],
  富山: ["富山", "富山県"],
  石川: ["石川", "石川県"],
  福井: ["福井", "福井県"],
  山梨: ["山梨", "山梨県"],
  長野: ["長野", "長野県"],
  岐阜: ["岐阜", "岐阜県"],
  静岡: ["静岡", "静岡県"],
  愛知: ["愛知", "愛知県"],
  三重: ["三重", "三重県"],
  滋賀: ["滋賀", "滋賀県"],
  京都: ["京都", "京都府"],
  大阪: ["大阪", "大阪府"],
  兵庫: ["兵庫", "兵庫県"],
  奈良: ["奈良", "奈良県"],
  和歌山: ["和歌山", "和歌山県"],
  鳥取: ["鳥取", "鳥取県"],
  島根: ["島根", "島根県"],
  岡山: ["岡山", "岡山県"],
  広島: ["広島", "広島県"],
  山口: ["山口", "山口県"],
  徳島: ["徳島", "徳島県"],
  香川: ["香川", "香川県"],
  愛媛: ["愛媛", "愛媛県"],
  高知: ["高知", "高知県"],
  福岡: ["福岡", "福岡県"],
  佐賀: ["佐賀", "佐賀県"],
  長崎: ["長崎", "長崎県"],
  熊本: ["熊本", "熊本県"],
  大分: ["大分", "大分県"],
  宮崎: ["宮崎", "宮崎県"],
  鹿児島: ["鹿児島", "鹿児島県"],
  沖縄: ["沖縄", "沖縄県"],
};

function normalizeText(value: string): string {
  return value
    .trim()
    .replace(/\u3000/g, " ")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ja");
}

export function normalizeAreaKeyword(keyword: string): string[] {
  const normalized = normalizeText(keyword);
  if (!normalized) return [];

  const withoutSuffix =
    normalized !== "北海道" && /[都府県]$/.test(normalized)
      ? normalized.slice(0, -1)
      : normalized;
  const aliases = Object.values(PREFECTURE_ALIASES).flatMap((values) => {
    const normalizedValues = values.map(normalizeText);
    return normalizedValues.includes(normalized) || normalizedValues.includes(withoutSuffix)
      ? values
      : [];
  });

  return uniqueStrings([normalized, withoutSuffix, ...aliases.map(normalizeText)]);
}

function buildDisplayName(parts: string[]): string {
  return uniqueStrings(parts).join(" / ");
}

function makeCandidate({
  largeClassCode,
  largeClassName,
  middleClassCode,
  middleClassName,
  smallClassCode = "",
  smallClassName = "",
  detailClassCode = "",
  detailClassName = "",
}: {
  largeClassCode: string;
  largeClassName: string;
  middleClassCode: string;
  middleClassName: string;
  smallClassCode?: string;
  smallClassName?: string;
  detailClassCode?: string;
  detailClassName?: string;
}): RakutenAreaCandidate | null {
  const displayName = buildDisplayName([
    middleClassName,
    smallClassName,
    detailClassName,
  ]);
  if (!largeClassCode || !middleClassCode || !middleClassName || !displayName) {
    return null;
  }

  return {
    areaClassCode: largeClassCode,
    areaClassName: largeClassName,
    largeClassCode,
    largeClassName,
    middleClassCode,
    middleClassName,
    smallClassCode,
    smallClassName,
    detailClassCode,
    detailClassName,
    label: displayName,
    displayName,
  };
}

function dedupeCandidates(
  candidates: RakutenAreaCandidate[],
): RakutenAreaCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = [
      candidate.areaClassCode,
      candidate.middleClassCode,
      candidate.smallClassCode,
      candidate.detailClassCode,
      candidate.displayName,
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSearchText(candidate: RakutenAreaCandidate): string {
  return [
    candidate.areaClassName,
    candidate.largeClassName,
    candidate.middleClassName,
    candidate.smallClassName,
    candidate.detailClassName,
    candidate.areaClassCode,
    candidate.largeClassCode,
    candidate.middleClassCode,
    candidate.smallClassCode,
    candidate.detailClassCode,
    candidate.label,
    candidate.displayName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("ja");
}

function countMiddleClasses(response: RakutenAreaResponse): number {
  const areaRoots = records(response.areaClasses);
  const largeClasses = areaRoots.flatMap((root) =>
    childRecords(root, "largeClasses", "largeClass"),
  );
  return largeClasses.flatMap((large) =>
    childRecords(large, "middleClasses", "middleClass"),
  ).length;
}

/** 楽天の階層レスポンスを、middle/small/detail各階層の検索候補へ変換する。 */
export function flattenRakutenAreaResponse(
  response: RakutenAreaResponse,
): RakutenAreaCandidate[] {
  const areaRoots = records(response.areaClasses);
  const largeClasses = areaRoots.flatMap((root) =>
    childRecords(root, "largeClasses", "largeClass"),
  );

  const candidates = largeClasses.flatMap((large) => {
    const largeClassCode = text(large, "largeClassCode");
    const largeClassName = text(large, "largeClassName");

    return childRecords(large, "middleClasses", "middleClass").flatMap(
      (middle) => {
        const middleClassCode = text(middle, "middleClassCode");
        const middleClassName = text(middle, "middleClassName");
        const middleCandidate = makeCandidate({
          largeClassCode,
          largeClassName,
          middleClassCode,
          middleClassName,
        });

        const smallAndDetailCandidates = childRecords(
          middle,
          "smallClasses",
          "smallClass",
        ).flatMap(
          (small) => {
            const smallClassCode = text(small, "smallClassCode");
            const smallClassName = text(small, "smallClassName");
            const smallCandidate = makeCandidate({
              largeClassCode,
              largeClassName,
              middleClassCode,
              middleClassName,
              smallClassCode,
              smallClassName,
            });

            const detailCandidates = childRecords(
              small,
              "detailClasses",
              "detailClass",
            )
              .map((detail) => {
                const detailClassCode = text(detail, "detailClassCode");
                const detailClassName = text(detail, "detailClassName");
                return makeCandidate({
                  largeClassCode,
                  largeClassName,
                  middleClassCode,
                  middleClassName,
                  smallClassCode,
                  smallClassName,
                  detailClassCode,
                  detailClassName,
                });
              })
              .filter(
                (candidate): candidate is RakutenAreaCandidate =>
                  Boolean(candidate),
              );

            return [smallCandidate, ...detailCandidates].filter(
              (candidate): candidate is RakutenAreaCandidate => Boolean(candidate),
            );
          },
        );

        return [middleCandidate, ...smallAndDetailCandidates].filter(
          (candidate): candidate is RakutenAreaCandidate => Boolean(candidate),
        );
      },
    );
  });

  return dedupeCandidates(candidates);
}

async function getRakutenAreaCache(): Promise<AreaCache> {
  if (areaCache && Date.now() - areaCache.cachedAt < AREA_CACHE_TTL_MS) {
    return areaCache;
  }

  const params = createRakutenParams(getRakutenCredentials());
  const { response, responseBody, requestUrl } = await fetchRakutenApi(
    AREA_CLASS_ENDPOINT,
    params,
    {
      next: { revalidate: 86400 },
    },
  );
  const data = parseRakutenAreaResponse(responseBody);

  if (!response.ok || !data || !isRecord(data) || data.error) {
    const detail = data?.error_description ?? data?.error ?? `HTTP ${response.status}`;
    console.error("Rakuten Area API request failed", {
      status: response.status,
      responseBodySnippet: getRakutenResponseBodySnippet(responseBody),
      url: maskRakutenUrl(requestUrl),
    });
    throw new Error(`楽天地区コードAPIから取得できませんでした: ${detail}`);
  }
  if (!("areaClasses" in data)) {
    throw new Error("楽天地区コードAPIのレスポンス形式が不正です。");
  }

  const candidates = flattenRakutenAreaResponse(data);
  if (candidates.length === 0) {
    throw new Error("楽天地区コードAPIのレスポンスに地区候補がありません。");
  }
  areaCache = {
    candidates,
    rawMiddleClassCount: countMiddleClasses(data),
    cachedAt: Date.now(),
  };
  return areaCache;
}

export async function getRakutenAreaCodes(): Promise<RakutenAreaCandidate[]> {
  return (await getRakutenAreaCache()).candidates;
}

export async function findRakutenAreaCandidatesWithDebug(
  keyword: string,
): Promise<{ candidates: RakutenAreaCandidate[]; debug: AreaSearchDebug }> {
  const normalizedKeywords = normalizeAreaKeyword(keyword);
  if (normalizedKeywords.length === 0) {
    return {
      candidates: [],
      debug: {
        rawMiddleClassCount: 0,
        flattenedCandidateCount: 0,
        matchedCount: 0,
        normalizedKeywords,
        firstCandidateLabels: [],
        warnings: ["keywordが空です。"],
      },
    };
  }

  const cache = await getRakutenAreaCache();
  const candidates = cache.candidates.flatMap((candidate) => {
    const searchText = getSearchText(candidate);
    const matchedText =
      normalizedKeywords.find((value) => searchText.includes(value)) ?? "";
    return matchedText ? [{ ...candidate, matchedText }] : [];
  });

  const warnings =
    candidates.length === 0
      ? ["一致する楽天地区候補が見つかりませんでした。"]
      : [];

  return {
    candidates,
    debug: {
      rawMiddleClassCount: cache.rawMiddleClassCount,
      flattenedCandidateCount: cache.candidates.length,
      matchedCount: candidates.length,
      normalizedKeywords,
      firstCandidateLabels: cache.candidates
        .slice(0, 5)
        .map((candidate) => candidate.label ?? candidate.displayName),
      warnings,
    },
  };
}

export async function findRakutenAreaCandidates(
  keyword: string,
): Promise<RakutenAreaCandidate[]> {
  return (await findRakutenAreaCandidatesWithDebug(keyword)).candidates;
}

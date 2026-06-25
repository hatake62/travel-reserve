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

type UnknownRecord = Record<string, unknown>;
type RakutenAreaResponse = UnknownRecord & {
  error?: string;
  error_description?: string;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function records(value: unknown): UnknownRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (isRecord(value)) return [value];
  return [];
}

function unwrap(record: UnknownRecord, key: string): UnknownRecord {
  const wrapped = record[key];
  return isRecord(wrapped) ? wrapped : record;
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
  return records(parent[collectionKey]).flatMap((collection) =>
    records(collection[itemKey] ?? collection).map((item) => unwrap(item, itemKey)),
  );
}

/** 楽天の階層レスポンスを、最下層ごとの検索候補へ変換する。 */
export function flattenRakutenAreaResponse(
  response: RakutenAreaResponse,
): RakutenAreaCandidate[] {
  const areaRoots = records(response.areaClasses);
  const largeClasses = areaRoots.flatMap((root) =>
    childRecords(root, "largeClasses", "largeClass"),
  );

  return largeClasses.flatMap((large) => {
    const areaClassCode = text(large, "largeClassCode");
    const areaClassName = text(large, "largeClassName");

    return childRecords(large, "middleClasses", "middleClass").flatMap(
      (middle) => {
        const middleClassCode = text(middle, "middleClassCode");
        const middleClassName = text(middle, "middleClassName");

        return childRecords(middle, "smallClasses", "smallClass").flatMap(
          (small) => {
            const smallClassCode = text(small, "smallClassCode");
            const smallClassName = text(small, "smallClassName");

            return childRecords(small, "detailClasses", "detailClass")
              .map((detail): RakutenAreaCandidate => {
                const detailClassCode = text(detail, "detailClassCode");
                const detailClassName = text(detail, "detailClassName");
                return {
                  areaClassCode,
                  areaClassName,
                  middleClassCode,
                  middleClassName,
                  smallClassCode,
                  smallClassName,
                  detailClassCode,
                  detailClassName,
                  displayName: [
                    middleClassName,
                    smallClassName,
                    detailClassName,
                  ]
                    .filter(Boolean)
                    .join(" / "),
                };
              })
              .filter(
                (candidate) =>
                  candidate.areaClassCode &&
                  candidate.middleClassCode &&
                  candidate.smallClassCode &&
                  candidate.detailClassCode &&
                  candidate.displayName,
              );
          },
        );
      },
    );
  });
}

export async function getRakutenAreaCodes(): Promise<RakutenAreaCandidate[]> {
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
  return candidates;
}

export async function findRakutenAreaCandidates(
  keyword: string,
): Promise<RakutenAreaCandidate[]> {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("ja");
  if (!normalizedKeyword) return [];

  return (await getRakutenAreaCodes()).filter((candidate) =>
    [
      candidate.middleClassName,
      candidate.smallClassName,
      candidate.detailClassName,
      candidate.displayName,
    ].some((value) => value.toLocaleLowerCase("ja").includes(normalizedKeyword)),
  );
}

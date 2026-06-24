import { rakutenAreas } from "@/data/rakutenAreas";
import type { RakutenAreaCandidate } from "@/types/rakutenArea";

export async function findMockAreaCandidates(
  keyword: string,
): Promise<RakutenAreaCandidate[]> {
  const normalizedKeyword = keyword.trim().toLocaleLowerCase("ja");
  if (!normalizedKeyword) return [];

  return rakutenAreas.filter((candidate) =>
    [
      candidate.middleClassName,
      candidate.smallClassName,
      candidate.detailClassName,
      candidate.displayName,
    ].some((value) =>
      value.toLocaleLowerCase("ja").includes(normalizedKeyword),
    ),
  );
}

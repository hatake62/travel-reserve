/** 楽天トラベルの地区階層を表すコード一式。 */
export type RakutenAreaCode = {
  areaClassCode: string;
  largeClassCode?: string;
  middleClassCode: string;
  smallClassCode: string;
  detailClassCode: string;
};

/** 目的地検索と空室検索の橋渡しに使う、フラット化済みの地区候補。 */
export type RakutenAreaCandidate = RakutenAreaCode & {
  areaClassName: string;
  largeClassName?: string;
  middleClassName: string;
  smallClassName: string;
  detailClassName: string;
  label?: string;
  matchedText?: string;
  displayName: string;
};

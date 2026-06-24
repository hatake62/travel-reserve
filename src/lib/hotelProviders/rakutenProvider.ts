import type { Hotel } from "@/types/hotel";

function getApplicationId(): string {
  const applicationId = process.env.RAKUTEN_TRAVEL_APP_ID;

  if (!applicationId) {
    throw new Error(
      "RAKUTEN_TRAVEL_APP_IDが設定されていません。.env.localを確認してください。",
    );
  }

  return applicationId;
}

export async function getRakutenHotels(): Promise<Hotel[]> {
  const applicationId = getApplicationId();

  // TODO: 楽天トラベルAPIをfetchし、レスポンスを既存のHotel[]へ変換する。
  void applicationId;
  throw new Error("楽天トラベルAPI連携はまだ実装されていません。");
}

export async function getRakutenHotelById(
  id: string | number,
): Promise<Hotel | undefined> {
  const applicationId = getApplicationId();

  // TODO: 楽天トラベルAPIをfetchし、指定IDのレスポンスをHotelへ変換する。
  void applicationId;
  void id;
  throw new Error("楽天トラベルAPI連携はまだ実装されていません。");
}

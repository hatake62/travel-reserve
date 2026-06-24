import type { Hotel } from "@/types/hotel";

export const hotels: Hotel[] = [
  {
    id: 1,
    name: "東京ベイサイドホテル",
    area: "東京都・東京駅周辺",
    price: 12800,
    rating: 4.4,
    site: "Travel Now",
    imageUrl:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    bookingUrl: "https://example.com/hotels/tokyo-bayside",
  },
  {
    id: 2,
    name: "新宿アーバンステイ",
    area: "東京都・新宿",
    price: 9800,
    rating: 4.1,
    site: "Hotel Finder",
    imageUrl:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    bookingUrl: "https://example.com/hotels/shinjuku-urban",
  },
  {
    id: 3,
    name: "渋谷スカイホテル",
    area: "東京都・渋谷",
    price: 15400,
    rating: 4.6,
    site: "Stay Search",
    imageUrl:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80",
    bookingUrl: "https://example.com/hotels/shibuya-sky",
  },
  {
    id: 4,
    name: "横浜ハーバービューホテル",
    area: "神奈川県・横浜",
    price: 11200,
    rating: 4.3,
    site: "Travel Now",
    imageUrl:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    bookingUrl: "https://example.com/hotels/yokohama-harbor",
  },
  {
    id: 5,
    name: "浅草リバーサイドイン",
    area: "東京都・浅草",
    price: 8600,
    rating: 4.0,
    site: "Hotel Finder",
    imageUrl:
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
    bookingUrl: "https://example.com/hotels/asakusa-riverside",
  },
];

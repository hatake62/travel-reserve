import { hotels } from "@/data/hotels";
import type { Hotel } from "@/types/hotel";

export async function getMockHotels(): Promise<Hotel[]> {
  return hotels;
}

export async function getMockHotelById(
  id: string | number,
): Promise<Hotel | undefined> {
  return hotels.find((hotel) => String(hotel.id) === String(id));
}

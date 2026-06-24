import { hotels } from "@/data/hotels";
import type { Hotel } from "@/types/hotel";
import type { HotelSearchOptions } from ".";

export async function getMockHotels(
  options: HotelSearchOptions = {},
): Promise<Hotel[]> {
  const destination =
    options.rakutenAreaCandidate?.detailClassName ?? options.keyword?.trim();
  if (!destination) return hotels;

  const normalizedDestination = destination.toLocaleLowerCase("ja");
  return hotels.filter(
    (hotel) =>
      hotel.name.toLocaleLowerCase("ja").includes(normalizedDestination) ||
      hotel.area.toLocaleLowerCase("ja").includes(normalizedDestination),
  );
}

export async function getMockHotelById(
  id: string | number,
): Promise<Hotel | undefined> {
  return hotels.find((hotel) => String(hotel.id) === String(id));
}

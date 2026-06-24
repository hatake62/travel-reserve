import { hotels } from "@/data/hotels";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(hotels);
}

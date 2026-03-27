export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { fetchMarketPrices } from "@/lib/trading/exchange";

export async function GET() {
  try {
    const data = await fetchMarketPrices();

    return NextResponse.json(
      {
        success: true,
        data,
        updatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=59",
        },
      }
    );
  } catch (error: any) {
    console.error("Error fetching market prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch market data" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { USE_MOCK_DATA, getMockLiveScores } from "@/services/mock";

export async function GET() {
  if (USE_MOCK_DATA) {
    return NextResponse.json(getMockLiveScores());
  }

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": process.env.FOOTBALL_DATA_TOKEN!,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Erro ao buscar jogos ao vivo" },
      { status: 500 }
    );
  }
}

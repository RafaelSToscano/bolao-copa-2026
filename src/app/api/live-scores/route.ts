import { NextResponse } from "next/server";

export async function GET() {
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
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar jogos ao vivo" },
      { status: 500 }
    );
  }
}
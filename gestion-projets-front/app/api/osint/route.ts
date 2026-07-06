// app/api/osint/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const spaceUrl = "https://traii-socitysearch.hf.space/api/predict_full";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Si le Space est privé, définis HF_TOKEN dans .env.local ou variables d'environnement
    if (process.env.HF_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
    }

    const hfRes = await fetch(spaceUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await hfRes.text();

    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: hfRes.status });
    } catch {
      return NextResponse.json({ raw: text }, { status: hfRes.status });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erreur interne" }, { status: 500 });
  }
}

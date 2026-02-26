import { NextResponse } from "next/server";
import pdfParse from "pdf-parse";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File mancante" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const result = await pdfParse(Buffer.from(arrayBuffer));
    const text = (result.text || "").trim();
    if (!text) {
      return NextResponse.json({ error: "PDF senza testo estraibile" }, { status: 400 });
    }
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore parsing PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

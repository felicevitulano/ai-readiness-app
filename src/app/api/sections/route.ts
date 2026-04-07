import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      include: { questions: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error("GET /api/sections error:", error);
    return NextResponse.json(
      { error: "Errore nel recupero delle sezioni" },
      { status: 500 }
    );
  }
}

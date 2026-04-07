import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      include: { assessments: { orderBy: { createdAt: "desc" } } },
      orderBy: { ragioneSociale: "asc" },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json(
      { error: "Errore nel recupero delle aziende" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const company = await prisma.company.create({
      data: {
        ragioneSociale: body.ragioneSociale,
        partitaIva: body.partitaIva,
        settore: body.settore,
        sitoWeb: body.sitoWeb || null,
        numeroAddetti: body.numeroAddetti ? parseInt(body.numeroAddetti) : null,
        fatturato: body.fatturato || null,
      },
    });
    return NextResponse.json(company, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/companies error:", error);
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "Un'azienda con questa P.IVA esiste già" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Errore nella creazione dell'azienda" },
      { status: 500 }
    );
  }
}

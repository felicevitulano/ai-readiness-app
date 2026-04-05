import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const companies = await prisma.company.findMany({
    include: { assessments: { orderBy: { createdAt: "desc" } } },
    orderBy: { ragioneSociale: "asc" },
  });
  return NextResponse.json(companies);
}

export async function POST(request: Request) {
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
}

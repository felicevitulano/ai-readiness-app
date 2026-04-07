import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const assessments = await prisma.assessment.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assessments);
  } catch (error) {
    console.error("GET /api/assessments error:", error);
    return NextResponse.json(
      { error: "Errore nel recupero degli assessment" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const assessment = await prisma.assessment.create({
      data: {
        companyId: body.companyId,
        activeSections: JSON.stringify(body.activeSections || []),
        status: "draft",
      },
      include: { company: true },
    });
    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error("POST /api/assessments error:", error);
    return NextResponse.json(
      { error: "Errore nella creazione dell'assessment" },
      { status: 500 }
    );
  }
}

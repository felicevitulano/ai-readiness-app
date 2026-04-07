import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        company: true,
        answers: { include: { question: { include: { section: true } } } },
        scores: { include: { section: true } },
        comments: { include: { section: true } },
      },
    });
    if (!assessment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(assessment);
  } catch (error) {
    console.error("GET /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Errore nel recupero dell'assessment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.activeSections !== undefined)
      data.activeSections = JSON.stringify(body.activeSections);
    if (body.status !== undefined) {
      data.status = body.status;
      if (body.status === "completed") data.completedAt = new Date();
    }
    if (body.globalScorePercent !== undefined)
      data.globalScorePercent = body.globalScorePercent;
    if (body.globalMaturityLevel !== undefined)
      data.globalMaturityLevel = body.globalMaturityLevel;

    const assessment = await prisma.assessment.update({
      where: { id },
      data,
      include: { company: true },
    });
    return NextResponse.json(assessment);
  } catch (error) {
    console.error("PUT /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Errore nell'aggiornamento dell'assessment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related records first (cascade)
    await prisma.aIComment.deleteMany({ where: { assessmentId: id } });
    await prisma.assessmentScore.deleteMany({ where: { assessmentId: id } });
    await prisma.answer.deleteMany({ where: { assessmentId: id } });
    await prisma.assessment.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/assessments/[id] error:", error);
    return NextResponse.json(
      { error: "Errore nell'eliminazione dell'assessment" },
      { status: 500 }
    );
  }
}

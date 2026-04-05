import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const answers = await prisma.answer.findMany({
    where: { assessmentId: id },
    include: { question: { include: { section: true } } },
    orderBy: { question: { number: "asc" } },
  });
  return NextResponse.json(answers);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // body.answers is an array of { questionId, score, notes, respondent, source }
  const results = [];
  for (const ans of body.answers) {
    const result = await prisma.answer.upsert({
      where: {
        assessmentId_questionId: {
          assessmentId: id,
          questionId: ans.questionId,
        },
      },
      update: {
        score: ans.score,
        notes: ans.notes || null,
        respondent: ans.respondent || null,
        source: ans.source || null,
      },
      create: {
        assessmentId: id,
        questionId: ans.questionId,
        score: ans.score,
        notes: ans.notes || null,
        respondent: ans.respondent || null,
        source: ans.source || null,
      },
    });
    results.push(result);
  }
  return NextResponse.json(results);
}

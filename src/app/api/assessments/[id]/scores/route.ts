import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  computeSectionScore,
  calculateGlobalLevel,
} from "@/lib/scoring";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      answers: { include: { question: { include: { section: true } } } },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const activeSections: string[] = JSON.parse(assessment.activeSections);
  const sections = await prisma.section.findMany({
    where: { code: { in: activeSections } },
    include: { questions: true },
    orderBy: { order: "asc" },
  });

  const sectionScores = [];

  for (const section of sections) {
    const sectionAnswers = assessment.answers.filter(
      (a) => a.question.sectionId === section.id
    );
    const scores = section.questions.map((q) => {
      const answer = sectionAnswers.find((a) => a.questionId === q.id);
      return answer?.score ?? null;
    });

    const score = computeSectionScore(
      scores,
      section.id,
      section.name,
      section.code,
      section.questions.length
    );
    sectionScores.push(score);

    await prisma.assessmentScore.upsert({
      where: {
        assessmentId_sectionId: {
          assessmentId: id,
          sectionId: section.id,
        },
      },
      update: {
        averageScore: score.averageScore,
        percentScore: score.percentScore,
        maturityLevel: score.maturityLevel,
        interpretation: score.interpretation,
      },
      create: {
        assessmentId: id,
        sectionId: section.id,
        averageScore: score.averageScore,
        percentScore: score.percentScore,
        maturityLevel: score.maturityLevel,
        interpretation: score.interpretation,
      },
    });
  }

  const validScores = sectionScores.filter((s) => s.averageScore > 0);
  const globalPercent =
    validScores.length > 0
      ? validScores.reduce((sum, s) => sum + s.percentScore, 0) /
        validScores.length
      : 0;
  const globalLevel = calculateGlobalLevel(globalPercent);

  await prisma.assessment.update({
    where: { id },
    data: {
      globalScorePercent: Math.round(globalPercent * 100) / 100,
      globalMaturityLevel: globalLevel,
    },
  });

  return NextResponse.json({
    sections: sectionScores,
    global: {
      percentScore: Math.round(globalPercent * 100) / 100,
      maturityLevel: globalLevel,
    },
  });
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      company: true,
      scores: { include: { section: true } },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    try {
      const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
      const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) apiKey = match[1].trim().replace(/^["']|["']$/g, "");
    } catch { /* ignore */ }
  }
  if (!apiKey || apiKey === "your-api-key-here") {
    // Generate placeholder comments without AI
    const comments = [];
    for (const score of assessment.scores) {
      const comment = await prisma.aIComment.upsert({
        where: {
          assessmentId_sectionId: {
            assessmentId: id,
            sectionId: score.sectionId!,
          },
        },
        update: {
          commentText: `${score.section?.name}: livello ${score.maturityLevel} (${score.percentScore.toFixed(0)}%). ${score.interpretation}`,
          modelUsed: "placeholder",
          generatedAt: new Date(),
        },
        create: {
          assessmentId: id,
          sectionId: score.sectionId!,
          commentText: `${score.section?.name}: livello ${score.maturityLevel} (${score.percentScore.toFixed(0)}%). ${score.interpretation}`,
          modelUsed: "placeholder",
        },
      });
      comments.push(comment);
    }
    return NextResponse.json(comments);
  }

  const client = new Anthropic({ apiKey });

  const scoresText = assessment.scores
    .filter((s) => s.section)
    .map(
      (s) =>
        `- ${s.section!.name}: media ${s.averageScore}/5 (${s.percentScore.toFixed(0)}%), livello "${s.maturityLevel}"`
    )
    .join("\n");

  const prompt = `Sei un consulente esperto in trasformazione digitale e AI readiness. Analizza i risultati di un assessment di maturità digitale per un'azienda.

Azienda: ${assessment.company.ragioneSociale}
Settore: ${assessment.company.settore}
Addetti: ${assessment.company.numeroAddetti || "N/D"}
Fatturato: ${assessment.company.fatturato || "N/D"}

Punteggi per dimensione:
${scoresText}

Punteggio globale: ${assessment.globalScorePercent?.toFixed(0)}% - Livello: ${assessment.globalMaturityLevel}

Per OGNI dimensione elencata, scrivi un commento di ESATTAMENTE 3-4 righe che:
1. Descriva il livello attuale in modo specifico per il settore dell'azienda
2. Evidenzi il punto critico principale
3. Suggerisca l'azione prioritaria

Poi scrivi un commento GLOBALE di 3-4 righe con la sintesi complessiva.

Rispondi in formato JSON con questa struttura:
{
  "sections": {
    "nome_sezione": "commento 3-4 righe"
  },
  "global": "commento globale 3-4 righe"
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  let parsed: { sections: Record<string, string>; global: string };
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] || "{}");
  } catch {
    parsed = { sections: {}, global: responseText };
  }

  const comments = [];

  for (const score of assessment.scores) {
    if (!score.section) continue;
    const sectionComment =
      parsed.sections[score.section.name] ||
      `${score.interpretation}`;

    const comment = await prisma.aIComment.upsert({
      where: {
        assessmentId_sectionId: {
          assessmentId: id,
          sectionId: score.sectionId!,
        },
      },
      update: {
        commentText: sectionComment,
        modelUsed: "claude-sonnet-4-20250514",
        generatedAt: new Date(),
      },
      create: {
        assessmentId: id,
        sectionId: score.sectionId!,
        commentText: sectionComment,
        modelUsed: "claude-sonnet-4-20250514",
      },
    });
    comments.push(comment);
  }

  // Save global comment with null sectionId
  if (parsed.global) {
    const existing = await prisma.aIComment.findFirst({
      where: { assessmentId: id, sectionId: null },
    });
    let globalComment;
    if (existing) {
      globalComment = await prisma.aIComment.update({
        where: { id: existing.id },
        data: {
          commentText: parsed.global,
          modelUsed: "claude-sonnet-4-20250514",
          generatedAt: new Date(),
        },
      });
    } else {
      globalComment = await prisma.aIComment.create({
        data: {
          assessmentId: id,
          sectionId: null,
          commentText: parsed.global,
          modelUsed: "claude-sonnet-4-20250514",
        },
      });
    }
    comments.push(globalComment);
  }

  return NextResponse.json(comments);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const comments = await prisma.aIComment.findMany({
    where: { assessmentId: id },
    include: { section: true },
  });
  return NextResponse.json(comments);
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildReportPrompt } from "@/lib/report-prompt";
import path from "path";
import fs from "fs";

const TN_BLUE = "#1B1464";
const TN_ORANGE = "#E87511";

function getLogoBase64(): string {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const buf = fs.readFileSync(logoPath);
  return "data:image/png;base64," + buf.toString("base64");
}

function buildDocDefinition(report: any, assessment: any) {
  const logo = getLogoBase64();
  const date = new Date().toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const content: any[] = [];

  // --- COVER PAGE ---
  content.push({ image: logo, width: 200, alignment: "center", margin: [0, 80, 0, 30] });
  content.push({
    text: "AI Readiness\nAssessment Report",
    style: "coverTitle",
    alignment: "center",
    margin: [0, 20, 0, 20],
  });
  content.push({
    canvas: [{ type: "line", x1: 150, y1: 0, x2: 370, y2: 0, lineWidth: 3, lineColor: TN_ORANGE }],
    margin: [0, 10, 0, 20],
  });
  content.push({
    text: assessment.company.ragioneSociale,
    style: "coverCompany",
    alignment: "center",
    margin: [0, 10, 0, 5],
  });
  content.push({
    text: assessment.company.settore,
    style: "coverSubtitle",
    alignment: "center",
    margin: [0, 0, 0, 5],
  });
  content.push({
    text: date,
    style: "coverDate",
    alignment: "center",
    margin: [0, 10, 0, 0],
  });
  content.push({
    text: `Punteggio Globale: ${assessment.globalScorePercent?.toFixed(0)}% — Livello: ${assessment.globalMaturityLevel}`,
    style: "coverScore",
    alignment: "center",
    margin: [0, 30, 0, 0],
  });
  content.push({ text: "", pageBreak: "after" });

  // --- INDICE ---
  content.push({ text: "Indice", style: "tocTitle", margin: [0, 0, 0, 20] });
  content.push({
    ol: [
      { text: "Descrizione e Posizionamento dell'Azienda", style: "tocItem", margin: [0, 5, 0, 5] },
      { text: "Diagnosi dell'Assessment", style: "tocItem", margin: [0, 5, 0, 5] },
      { text: "Progetti di Miglioramento", style: "tocItem", margin: [0, 5, 0, 5] },
    ],
    margin: [20, 0, 0, 0],
  });
  content.push({ text: "", pageBreak: "after" });

  // --- CAPITOLO 1 ---
  const c1 = report.capitolo1;
  content.push({ text: `1. ${c1.titolo}`, style: "chapterTitle" });
  content.push({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: TN_ORANGE }],
    margin: [0, 5, 0, 15],
  });
  content.push({ text: c1.introduzione, style: "body", margin: [0, 0, 0, 12] });
  content.push({ text: "Profilo Aziendale", style: "sectionTitle" });
  content.push({ text: c1.profilo_aziendale, style: "body", margin: [0, 0, 0, 12] });

  content.push({
    table: {
      widths: ["*", "*"],
      body: [
        [
          { text: "Ragione Sociale", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4] },
          { text: "Settore", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4] },
        ],
        [
          { text: assessment.company.ragioneSociale, margin: [4, 4, 4, 4] },
          { text: assessment.company.settore, margin: [4, 4, 4, 4] },
        ],
        [
          { text: "Numero Addetti", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4] },
          { text: "Fatturato", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4] },
        ],
        [
          { text: String(assessment.company.numeroAddetti || "N/D"), margin: [4, 4, 4, 4] },
          { text: assessment.company.fatturato || "N/D", margin: [4, 4, 4, 4] },
        ],
      ],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#E0E0E0",
      vLineColor: () => "#E0E0E0",
    },
    margin: [0, 0, 0, 15],
  });

  content.push({ text: "Posizionamento Digitale", style: "sectionTitle" });
  content.push({ text: c1.posizionamento_digitale, style: "body", margin: [0, 0, 0, 12] });
  content.push({ text: "Contesto di Mercato", style: "sectionTitle" });
  content.push({ text: c1.contesto_mercato, style: "body", margin: [0, 0, 0, 12] });
  content.push({ text: "", pageBreak: "after" });

  // --- CAPITOLO 2 ---
  const c2 = report.capitolo2;
  content.push({ text: `2. ${c2.titolo}`, style: "chapterTitle" });
  content.push({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: TN_ORANGE }],
    margin: [0, 5, 0, 15],
  });
  content.push({ text: c2.introduzione, style: "body", margin: [0, 0, 0, 12] });
  content.push({ text: "Panoramica dei Risultati", style: "sectionTitle" });

  const scoresTableBody: any[][] = [
    [
      { text: "Dimensione", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4] },
      { text: "Punteggio", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4], alignment: "center" },
      { text: "%", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4], alignment: "center" },
      { text: "Livello", bold: true, fillColor: TN_BLUE, color: "white", margin: [4, 4, 4, 4], alignment: "center" },
    ],
  ];
  for (const score of assessment.scores) {
    if (!score.section) continue;
    const levelColor =
      score.maturityLevel === "Inesistente" ? "#DC2626"
      : score.maturityLevel === "Iniziale" ? TN_ORANGE
      : score.maturityLevel === "Definito" ? "#CA8A04"
      : score.maturityLevel === "Gestito" ? "#2563EB"
      : "#16A34A";
    scoresTableBody.push([
      { text: score.section.name, margin: [4, 4, 4, 4] },
      { text: `${score.averageScore}/5`, margin: [4, 4, 4, 4], alignment: "center" },
      { text: `${score.percentScore.toFixed(0)}%`, margin: [4, 4, 4, 4], alignment: "center" },
      { text: score.maturityLevel, margin: [4, 4, 4, 4], alignment: "center", color: levelColor, bold: true },
    ]);
  }
  scoresTableBody.push([
    { text: "GLOBALE", bold: true, fillColor: "#F0EDF5", margin: [4, 4, 4, 4] },
    { text: "", fillColor: "#F0EDF5", margin: [4, 4, 4, 4] },
    { text: `${assessment.globalScorePercent?.toFixed(0)}%`, bold: true, fillColor: "#F0EDF5", margin: [4, 4, 4, 4], alignment: "center" },
    { text: assessment.globalMaturityLevel || "", bold: true, fillColor: "#F0EDF5", margin: [4, 4, 4, 4], alignment: "center" },
  ]);

  content.push({
    table: { headerRows: 1, widths: ["*", 70, 50, 80], body: scoresTableBody },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#E0E0E0",
      vLineColor: () => "#E0E0E0",
    },
    margin: [0, 0, 0, 15],
  });

  content.push({ text: c2.panoramica_risultati, style: "body", margin: [0, 0, 0, 12] });
  content.push({ text: "Analisi per Dimensione", style: "sectionTitle" });

  for (const dim of c2.analisi_dimensioni || []) {
    content.push({ text: dim.nome, style: "dimTitle", margin: [0, 10, 0, 3] });
    content.push({ text: `${dim.punteggio} — ${dim.livello}`, style: "dimScore", margin: [0, 0, 0, 8] });
    content.push({ text: dim.analisi, style: "body", margin: [0, 0, 0, 8] });
    if (dim.criticita_principali?.length) {
      content.push({ text: "Criticita:", style: "labelBold", margin: [0, 0, 0, 3] });
      content.push({ ul: dim.criticita_principali.map((c: string) => ({ text: c, style: "listItem" })), margin: [15, 0, 0, 5] });
    }
    if (dim.punti_forza?.length) {
      content.push({ text: "Punti di forza:", style: "labelBoldGreen", margin: [0, 0, 0, 3] });
      content.push({ ul: dim.punti_forza.map((p: string) => ({ text: p, style: "listItem" })), margin: [15, 0, 0, 8] });
    }
  }

  content.push({ text: "Gap Analysis Trasversale", style: "sectionTitle", margin: [0, 15, 0, 8] });
  content.push({ text: c2.gap_analysis, style: "body", margin: [0, 0, 0, 12] });
  content.push({ text: "", pageBreak: "after" });

  // --- CAPITOLO 3 ---
  const c3 = report.capitolo3;
  content.push({ text: `3. ${c3.titolo}`, style: "chapterTitle" });
  content.push({
    canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: TN_ORANGE }],
    margin: [0, 5, 0, 15],
  });
  content.push({ text: c3.introduzione, style: "body", margin: [0, 0, 0, 15] });

  for (let i = 0; i < (c3.progetti || []).length; i++) {
    const proj = c3.progetti[i];
    const priorityColor =
      proj.priorita === "Alta" ? "#DC2626" : proj.priorita === "Media" ? TN_ORANGE : "#16A34A";

    content.push({
      table: {
        widths: ["*"],
        body: [[{
          stack: [
            {
              columns: [
                { text: `Progetto ${i + 1}: ${proj.titolo}`, style: "projectTitle", width: "*" },
                { text: (proj.priorita || "").toUpperCase(), style: "priorityBadge", color: priorityColor, width: "auto", alignment: "right" },
              ],
              margin: [0, 0, 0, 5],
            },
            { text: `Dimensioni: ${(proj.dimensioni_coinvolte || []).join(", ")}`, style: "projectMeta", margin: [0, 0, 0, 3] },
            { text: `Timeline: ${proj.timeline_indicativa}`, style: "projectMeta", margin: [0, 0, 0, 8] },
            { text: "Obiettivo:", style: "labelBold", margin: [0, 0, 0, 3] },
            { text: proj.obiettivo, style: "body", margin: [0, 0, 0, 8] },
            { text: "Attivita chiave:", style: "labelBold", margin: [0, 0, 0, 3] },
            { ul: (proj.attivita_chiave || []).map((a: string) => ({ text: a, style: "listItem" })), margin: [15, 0, 0, 8] },
            { text: "Benefici attesi:", style: "labelBold", margin: [0, 0, 0, 3] },
            { text: proj.benefici_attesi, style: "body" },
          ],
          margin: [10, 10, 10, 10],
        }]],
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: (col: number) => (col === 0 ? 3 : 1),
        hLineColor: () => "#E0E0E0",
        vLineColor: (col: number) => (col === 0 ? priorityColor : "#E0E0E0"),
      },
      margin: [0, 0, 0, 15],
    });
  }

  content.push({ text: "Roadmap di Sintesi", style: "sectionTitle", margin: [0, 10, 0, 8] });
  content.push({ text: c3.roadmap_sintesi, style: "body", margin: [0, 0, 0, 12] });
  content.push({ text: "Prossimi Passi", style: "sectionTitle", margin: [0, 10, 0, 8] });
  content.push({ text: c3.next_steps, style: "body", margin: [0, 0, 0, 12] });

  return {
    content,
    defaultStyle: { font: "Roboto", fontSize: 10, lineHeight: 1.4 },
    styles: {
      coverTitle: { fontSize: 28, bold: true, color: TN_BLUE },
      coverCompany: { fontSize: 18, bold: true, color: TN_BLUE },
      coverSubtitle: { fontSize: 14, color: "#666666" },
      coverDate: { fontSize: 12, color: "#999999" },
      coverScore: { fontSize: 14, bold: true, color: TN_ORANGE },
      tocTitle: { fontSize: 22, bold: true, color: TN_BLUE },
      tocItem: { fontSize: 13, color: TN_BLUE },
      chapterTitle: { fontSize: 20, bold: true, color: TN_BLUE },
      sectionTitle: { fontSize: 14, bold: true, color: TN_BLUE, margin: [0, 10, 0, 8] },
      dimTitle: { fontSize: 12, bold: true, color: TN_BLUE },
      dimScore: { fontSize: 11, color: TN_ORANGE, bold: true },
      body: { fontSize: 10, color: "#333333", lineHeight: 1.5 },
      projectTitle: { fontSize: 12, bold: true, color: TN_BLUE },
      priorityBadge: { fontSize: 10, bold: true },
      projectMeta: { fontSize: 9, color: "#666666", italics: true },
      labelBold: { fontSize: 10, bold: true, color: TN_BLUE },
      labelBoldGreen: { fontSize: 10, bold: true, color: "#16A34A" },
      listItem: { fontSize: 10, color: "#333333" },
    },
    header: (currentPage: number) => {
      if (currentPage === 1) return null;
      return {
        columns: [
          { text: "AI Readiness Assessment Report", color: "#999999", fontSize: 8, margin: [40, 15, 0, 0] },
          { text: assessment.company.ragioneSociale, color: "#999999", fontSize: 8, alignment: "right", margin: [0, 15, 40, 0] },
        ],
      };
    },
    footer: (currentPage: number, pageCount: number) => {
      if (currentPage === 1) return null;
      return {
        columns: [
          { text: "Think Next S.r.l. — innovation for business", fontSize: 7, color: "#999999", margin: [40, 0, 0, 0] },
          { text: `${currentPage}/${pageCount}`, fontSize: 8, color: "#999999", alignment: "right", margin: [0, 0, 40, 0] },
        ],
        margin: [0, 10, 0, 0],
      };
    },
    pageMargins: [40, 40, 40, 40],
  };
}

async function generatePdfBuffer(docDefinition: any): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfmake = require("pdfmake");
  const fontsDir = path.join(process.cwd(), "node_modules", "pdfmake", "build", "fonts", "Roboto") + "/";
  pdfmake.fonts = {
    Roboto: {
      normal: fontsDir + "Roboto-Regular.ttf",
      bold: fontsDir + "Roboto-Medium.ttf",
      italics: fontsDir + "Roboto-Italic.ttf",
      bolditalics: fontsDir + "Roboto-MediumItalic.ttf",
    },
  };
  const doc = pdfmake.createPdf(docDefinition);
  return doc.getBuffer();
}

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
      answers: { include: { question: { include: { section: true } } } },
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sections = assessment.scores
    .filter((s) => s.section)
    .sort((a, b) => (a.section!.order || 0) - (b.section!.order || 0))
    .map((score) => {
      const sectionAnswers = assessment.answers
        .filter((a) => a.question.sectionId === score.sectionId)
        .sort((a, b) => a.question.order - b.question.order)
        .map((a) => ({
          questionText: a.question.text,
          score: a.score,
          notes: a.notes,
        }));
      return {
        name: score.section!.name,
        averageScore: score.averageScore,
        percentScore: score.percentScore,
        maturityLevel: score.maturityLevel,
        interpretation: score.interpretation,
        answers: sectionAnswers,
      };
    });

  const prompt = buildReportPrompt({
    ragioneSociale: assessment.company.ragioneSociale,
    settore: assessment.company.settore,
    sitoWeb: assessment.company.sitoWeb,
    numeroAddetti: assessment.company.numeroAddetti,
    fatturato: assessment.company.fatturato,
    globalScorePercent: assessment.globalScorePercent || 0,
    globalMaturityLevel: assessment.globalMaturityLevel || "N/A",
    sections,
  });

  // Read API key - fallback to .env file if shell env is empty
  let apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-api-key-here") {
    try {
      const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
      const match = envContent.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) apiKey = match[1].trim().replace(/^["']|["']$/g, "");
    } catch { /* ignore */ }
  }
  if (!apiKey || apiKey === "your-api-key-here") {
    return NextResponse.json({ error: "API key Anthropic non configurata" }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  let report: any;
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    report = JSON.parse(jsonMatch?.[0] || "{}");
  } catch {
    return NextResponse.json({ error: "Errore nel parsing della risposta AI", raw: responseText }, { status: 500 });
  }

  const docDefinition = buildDocDefinition(report, assessment);

  try {
    const pdfBuffer = await generatePdfBuffer(docDefinition);
    const companyName = assessment.company.ragioneSociale.replace(/\s+/g, "_");
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Report_AI_Readiness_${companyName}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Errore generazione PDF: " + err.message }, { status: 500 });
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

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
        scores: { include: { section: true }, orderBy: { section: { order: "asc" } } },
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const wb = new ExcelJS.Workbook();
    const BLUE = "1B1464";
    const ORANGE = "E87511";

    // Sheet 1: Anagrafica
    const ws1 = wb.addWorksheet("Anagrafica");
    ws1.columns = [{ width: 25 }, { width: 40 }];
    const fields = [
      ["Ragione Sociale", assessment.company.ragioneSociale],
      ["P.IVA", assessment.company.partitaIva],
      ["Settore", assessment.company.settore],
      ["Sito Web", assessment.company.sitoWeb || ""],
      ["N. Addetti", assessment.company.numeroAddetti?.toString() || ""],
      ["Fatturato", assessment.company.fatturato || ""],
      ["Data Assessment", assessment.createdAt.toLocaleDateString("it-IT")],
      ["Stato", assessment.status],
    ];
    fields.forEach(([label, value]) => {
      const row = ws1.addRow([label, value]);
      row.getCell(1).font = { bold: true, color: { argb: BLUE } };
    });

    // Sheet 2: Risposte
    const ws2 = wb.addWorksheet("Questionario");
    const headerRow = ws2.addRow(["#", "Sezione", "Domanda", "Punteggio", "Note", "Rispondente", "Fonte"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BLUE } };
    });
    ws2.columns = [
      { width: 5 }, { width: 25 }, { width: 60 },
      { width: 12 }, { width: 30 }, { width: 20 }, { width: 20 },
    ];

    const sortedAnswers = [...assessment.answers].sort(
      (a, b) => a.question.number - b.question.number
    );
    for (const answer of sortedAnswers) {
      ws2.addRow([
        answer.question.number,
        answer.question.section.name,
        answer.question.text,
        answer.score ?? "N/A",
        answer.notes || "",
        answer.respondent || "",
        answer.source || "",
      ]);
    }

    // Sheet 3: Maturity Matrix
    const ws3 = wb.addWorksheet("Maturity Matrix");
    const mhRow = ws3.addRow(["Dimensione", "Media", "% (0-100)", "Livello", "Interpretazione"]);
    mhRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    });
    ws3.columns = [{ width: 30 }, { width: 10 }, { width: 12 }, { width: 18 }, { width: 50 }];

    for (const score of assessment.scores) {
      ws3.addRow([
        score.section?.name || "Globale",
        score.averageScore,
        score.percentScore,
        score.maturityLevel,
        score.interpretation,
      ]);
    }
    ws3.addRow([]);
    const globalRow = ws3.addRow([
      "PUNTEGGIO GLOBALE",
      "",
      assessment.globalScorePercent ?? 0,
      assessment.globalMaturityLevel ?? "N/A",
      "",
    ]);
    globalRow.getCell(1).font = { bold: true, color: { argb: ORANGE } };

    const buffer = await wb.xlsx.writeBuffer();
    const uint8 = new Uint8Array(buffer as ArrayBuffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="assessment_${assessment.company.ragioneSociale.replace(/\s+/g, "_")}_${assessment.createdAt.toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("GET /api/assessments/[id]/export/excel error:", error);
    return NextResponse.json(
      { error: "Errore nella generazione del file Excel" },
      { status: 500 }
    );
  }
}

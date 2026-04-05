export function calculateMaturityLevel(avg: number): string {
  if (avg === 0) return "N/A";
  if (avg < 1.5) return "Inesistente";
  if (avg < 2.5) return "Iniziale";
  if (avg < 3.5) return "Definito";
  if (avg < 4.5) return "Gestito";
  return "Ottimizzato";
}

export function calculateInterpretation(avg: number): string {
  if (avg === 0) return "Da compilare";
  if (avg < 2) return "Area critica: intervento prioritario necessario";
  if (avg < 3) return "Area debole: miglioramenti significativi richiesti";
  if (avg < 4) return "Area sufficiente: margini di ottimizzazione";
  if (avg < 4.5) return "Area solida: buona maturità";
  return "Eccellenza: best practice attive";
}

export function calculateGlobalLevel(percent: number): string {
  if (percent === 0) return "N/A";
  if (percent < 20) return "Critico";
  if (percent < 40) return "Basso";
  if (percent < 60) return "Medio";
  if (percent < 80) return "Buono";
  return "Eccellente";
}

export interface SectionScore {
  sectionId: string;
  sectionName: string;
  sectionCode: string;
  averageScore: number;
  percentScore: number;
  maturityLevel: string;
  interpretation: string;
  answeredCount: number;
  totalQuestions: number;
}

export function computeSectionScore(
  scores: (number | null)[],
  sectionId: string,
  sectionName: string,
  sectionCode: string,
  totalQuestions: number
): SectionScore {
  const validScores = scores.filter((s): s is number => s !== null);
  const avg = validScores.length > 0
    ? validScores.reduce((a, b) => a + b, 0) / validScores.length
    : 0;
  const percent = (avg / 5) * 100;

  return {
    sectionId,
    sectionName,
    sectionCode,
    averageScore: Math.round(avg * 100) / 100,
    percentScore: Math.round(percent * 100) / 100,
    maturityLevel: calculateMaturityLevel(avg),
    interpretation: calculateInterpretation(avg),
    answeredCount: validScores.length,
    totalQuestions,
  };
}

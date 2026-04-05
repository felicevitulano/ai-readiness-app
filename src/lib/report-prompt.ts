export function buildReportPrompt(data: {
  ragioneSociale: string;
  settore: string;
  sitoWeb?: string | null;
  numeroAddetti?: number | null;
  fatturato?: string | null;
  globalScorePercent: number;
  globalMaturityLevel: string;
  sections: {
    name: string;
    averageScore: number;
    percentScore: number;
    maturityLevel: string;
    interpretation: string;
    answers: { questionText: string; score: number | null; notes?: string | null }[];
  }[];
}): string {
  const sectionsDetail = data.sections
    .map((s) => {
      const answersDetail = s.answers
        .map(
          (a) =>
            `    - "${a.questionText}" → Punteggio: ${a.score ?? "N/A"}${a.notes ? ` | Note: ${a.notes}` : ""}`
        )
        .join("\n");
      return `### ${s.name}
  Media: ${s.averageScore}/5 (${s.percentScore.toFixed(0)}%) — Livello: ${s.maturityLevel}
  Interpretazione: ${s.interpretation}
  Risposte:
${answersDetail}`;
    })
    .join("\n\n");

  return `Sei un consulente senior di Think Next S.r.l., società di consulenza specializzata in trasformazione digitale e Intelligenza Artificiale. Devi redigere un report professionale di AI Readiness Assessment.

=== DATI AZIENDA ===
Ragione Sociale: ${data.ragioneSociale}
Settore: ${data.settore}
Sito Web: ${data.sitoWeb || "N/D"}
Numero Addetti: ${data.numeroAddetti || "N/D"}
Fatturato: ${data.fatturato || "N/D"}

=== RISULTATI ASSESSMENT ===
Punteggio Globale: ${data.globalScorePercent.toFixed(0)}% — Livello: ${data.globalMaturityLevel}

=== DETTAGLIO PER SEZIONE ===
${sectionsDetail}

=== ISTRUZIONI DI REDAZIONE ===

Scrivi il report strutturato in 3 capitoli. Rispondi ESCLUSIVAMENTE in formato JSON valido con questa struttura:

{
  "capitolo1": {
    "titolo": "Descrizione e Posizionamento dell'Azienda",
    "introduzione": "Paragrafo introduttivo di 4-6 righe che descrive l'azienda, il suo settore di appartenenza e il contesto competitivo in cui opera.",
    "profilo_aziendale": "Paragrafo di 3-5 righe con il profilo dell'azienda basato sui dati raccolti (dimensione, fatturato, settore).",
    "posizionamento_digitale": "Paragrafo di 4-6 righe che posiziona l'azienda rispetto alla maturità digitale media del suo settore. Usa il punteggio globale come riferimento.",
    "contesto_mercato": "Paragrafo di 3-5 righe sul contesto di mercato e sulle sfide digitali tipiche del settore."
  },
  "capitolo2": {
    "titolo": "Diagnosi dell'Assessment",
    "introduzione": "Paragrafo di 3-4 righe che introduce la metodologia di assessment (52 domande, 6 dimensioni, scala 1-5).",
    "panoramica_risultati": "Paragrafo di 4-6 righe con la sintesi dei risultati globali. Evidenzia punti di forza e aree critiche.",
    "analisi_dimensioni": [
      {
        "nome": "Nome Sezione",
        "livello": "Livello maturità",
        "punteggio": "X.X/5 (XX%)",
        "analisi": "Paragrafo di 5-8 righe con analisi dettagliata della dimensione. Commenta i punteggi specifici delle domande, identifica pattern, evidenzia gap critici e punti di forza relativi.",
        "criticita_principali": ["Criticità 1", "Criticità 2"],
        "punti_forza": ["Punto di forza 1"]
      }
    ],
    "gap_analysis": "Paragrafo di 4-6 righe che sintetizza i gap principali trasversali alle dimensioni."
  },
  "capitolo3": {
    "titolo": "Progetti di Miglioramento",
    "introduzione": "Paragrafo di 3-4 righe che introduce la roadmap di miglioramento proposta.",
    "progetti": [
      {
        "titolo": "Nome del progetto",
        "priorita": "Alta/Media/Bassa",
        "dimensioni_coinvolte": ["Dim1", "Dim2"],
        "obiettivo": "Descrizione dell'obiettivo in 2-3 righe",
        "attivita_chiave": ["Attività 1", "Attività 2", "Attività 3"],
        "benefici_attesi": "Descrizione dei benefici in 2-3 righe",
        "timeline_indicativa": "Breve/Medio/Lungo termine"
      }
    ],
    "roadmap_sintesi": "Paragrafo di 4-6 righe con la visione d'insieme della roadmap: priorità, sequenza logica, dipendenze tra progetti.",
    "next_steps": "Paragrafo di 3-4 righe con i prossimi passi concreti che Think Next raccomanda."
  }
}

REGOLE:
- Proponi almeno 4 e massimo 6 progetti di miglioramento, ordinati per priorità
- Ogni progetto deve essere concreto, azionabile e collegato ai gap emersi
- Il tono deve essere professionale ma accessibile, da consulente a decisore aziendale
- Personalizza tutto in base al settore specifico dell'azienda
- Non usare formule generiche: ogni paragrafo deve riferirsi ai dati reali dell'assessment
- L'analisi di ogni dimensione deve commentare i punteggi specifici delle domande
- Rispondi SOLO con il JSON, senza testo prima o dopo`;
}

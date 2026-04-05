import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sections = [
  { code: "strategy_leadership", name: "Strategia & Leadership", order: 1 },
  { code: "data_infrastructure", name: "Dati & Infrastruttura", order: 2 },
  { code: "processes_operations", name: "Processi & Operatività", order: 3 },
  { code: "skills_culture", name: "Competenze & Cultura", order: 4 },
  { code: "technology_systems", name: "Tecnologia & Sistemi", order: 5 },
  { code: "governance_compliance", name: "Governance & Compliance", order: 6 },
];

const questions: Record<string, string[]> = {
  strategy_leadership: [
    "L'AI è esplicitamente presente nella strategia aziendale o nel piano industriale?",
    "Esiste un budget dedicato (o allocabile) per iniziative di Intelligenza Artificiale?",
    "C'è uno sponsor C-Level (CEO, CDO, CTO) che guida attivamente l'agenda AI?",
    "Il management ha una visione chiara e condivisa del valore che l'AI può portare al business?",
    "Sono state identificate le aree strategiche prioritarie dove l'AI potrebbe avere il maggior impatto?",
    "Esiste un processo decisionale formalizzato per valutare e approvare nuove iniziative AI?",
    "L'organizzazione è disposta a investire in change management per accompagnare l'adozione dell'AI?",
  ],
  data_infrastructure: [
    "I dati aziendali critici (clienti, ordini, produzione, finance) sono digitalizzati e accessibili elettronicamente?",
    "Esiste un data warehouse, data lake o sistema centralizzato per la raccolta e l'analisi dei dati?",
    "La qualità dei dati viene monitorata regolarmente (completezza, accuratezza, consistenza)?",
    "Esiste un catalogo dati (data catalog) che documenta le fonti disponibili, i formati e gli owner?",
    "I dati sono strutturati in formati standard e interoperabili (non solo fogli Excel isolati)?",
    "Esiste un processo di data governance formalizzato (ownership, policy di accesso, ciclo di vita)?",
    "I dati storici disponibili sono sufficienti per addestrare o alimentare modelli AI (almeno 12-24 mesi)?",
    "L'infrastruttura IT è in grado di supportare workload di calcolo intensivo (GPU, cloud computing)?",
    "I principali sistemi aziendali espongono API per l'integrazione con strumenti esterni?",
    "Esiste un processo strutturato di backup, disaster recovery e data retention per i dati critici?",
  ],
  processes_operations: [
    "I processi aziendali principali sono documentati, aggiornati e accessibili al team?",
    "I flussi operativi critici sono digitalizzati (non cartacei o basati su email/telefonate)?",
    "Esistono KPI misurati regolarmente per i processi chiave (tempi di ciclo, errori, costi)?",
    "I processi ripetitivi e ad alto volume sono già stati identificati e catalogati?",
    "Esistono colli di bottiglia noti e documentati che rallentano l'operatività quotidiana?",
    "Le decisioni operative critiche si basano su dati strutturati o prevalentemente su esperienza/intuizione?",
    "I processi sono standardizzati tra diversi reparti, sedi o business unit?",
    "Esiste un processo di continuous improvement formalizzato (es. Lean, Six Sigma, Kaizen)?",
    "Le eccezioni, gli errori e le rilavorazioni nei processi vengono tracciati e analizzati sistematicamente?",
    "I tempi di ciclo end-to-end dei processi chiave sono noti, misurati e benchmarkati?",
  ],
  skills_culture: [
    "Il team IT ha competenze di base in data science, machine learning o analisi avanzata dei dati?",
    "I dipendenti operativi hanno familiarità con strumenti digitali avanzati (BI, automazione, cloud)?",
    "Esiste un programma di formazione continua sulle tecnologie digitali e sull'AI?",
    "L'organizzazione ha una cultura aperta all'innovazione, alla sperimentazione e al fallimento controllato?",
    "I dipendenti percepiscono l'AI prevalentemente come un'opportunità (vs. una minaccia al proprio ruolo)?",
    "Esistono figure interne con competenze specifiche in AI/ML (data scientist, ML engineer)?",
    "Il management supporta attivamente l'adozione di nuove tecnologie con tempo e risorse dedicate?",
    "L'azienda ha esperienza positiva con progetti di trasformazione digitale precedenti?",
    "Esiste un processo strutturato per il knowledge sharing interno (community, wiki, sessioni)?",
    "Il team è disposto a ridisegnare il proprio modo di lavorare per integrare strumenti AI nei flussi operativi?",
  ],
  technology_systems: [
    "Lo stack tecnologico aziendale è moderno, manutenuto e supportato dal vendor?",
    "L'azienda utilizza servizi cloud (IaaS, PaaS o SaaS) per almeno parte delle proprie operazioni?",
    "I sistemi ERP e/o CRM sono aggiornati e integrati tra loro?",
    "Esistono API documentate e manutenute per i sistemi core dell'azienda?",
    "L'infrastruttura di rete e connettività supporta trasferimenti dati ad alta velocità e bassa latenza?",
    "L'azienda utilizza strumenti di Business Intelligence (BI) per il reporting e l'analisi dei dati?",
    "Esistono ambienti di sviluppo e test separati dall'ambiente di produzione?",
    "I sistemi aziendali supportano autenticazione avanzata (SSO, MFA) e gestione granulare degli accessi?",
    "L'azienda ha già adottato strumenti di automazione (RPA, workflow automation, scripting)?",
    "Esiste un piano di evoluzione tecnologica (tech roadmap) aggiornato e condiviso con il business?",
  ],
  governance_compliance: [
    "L'azienda è conforme al GDPR per il trattamento dei dati personali (informative, consensi, registro)?",
    "Esiste una policy interna formalizzata sulla sicurezza informatica e sulla protezione dei dati?",
    "L'organizzazione ha consapevolezza del Regolamento AI Act EU e delle sue implicazioni operative?",
    "Esistono processi di audit interni periodici per verificare la compliance normativa?",
    "Esiste un DPO (Data Protection Officer) o un referente privacy formalizzato e operativo?",
  ],
};

async function main() {
  console.log("Seeding database...");

  for (const sec of sections) {
    const section = await prisma.section.upsert({
      where: { code: sec.code },
      update: { name: sec.name, order: sec.order },
      create: sec,
    });

    const sectionQuestions = questions[sec.code];
    let globalNumber = 0;
    for (let i = 0; i < sections.indexOf(sec); i++) {
      globalNumber += questions[sections[i].code].length;
    }

    for (let i = 0; i < sectionQuestions.length; i++) {
      const number = globalNumber + i + 1;
      const existing = await prisma.question.findFirst({
        where: { sectionId: section.id, order: i + 1 },
      });
      if (existing) {
        await prisma.question.update({
          where: { id: existing.id },
          data: { text: sectionQuestions[i], number },
        });
      } else {
        await prisma.question.create({
          data: {
            sectionId: section.id,
            number,
            text: sectionQuestions[i],
            order: i + 1,
          },
        });
      }
    }
  }

  console.log("Seed completed: 6 sections, 52 questions");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

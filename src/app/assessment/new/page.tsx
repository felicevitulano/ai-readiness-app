"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Section {
  id: string;
  code: string;
  name: string;
  order: number;
  questions: { id: string }[];
}

interface Company {
  id: string;
  ragioneSociale: string;
  partitaIva: string;
  settore: string;
}

const SETTORI = [
  "Manifatturiero",
  "Servizi",
  "Commercio",
  "Tecnologia / ICT",
  "Sanità",
  "Finanza / Assicurazioni",
  "Pubblica Amministrazione",
  "Energia / Utilities",
  "Trasporti / Logistica",
  "Agroalimentare",
  "Edilizia / Costruzioni",
  "Turismo / Hospitality",
  "Istruzione / Formazione",
  "Altro",
];

export default function NewAssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState<"company" | "sections">("company");
  const [sections, setSections] = useState<Section[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [activeSections, setActiveSections] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    ragioneSociale: "",
    partitaIva: "",
    settore: "",
    sitoWeb: "",
    numeroAddetti: "",
    fatturato: "",
  });

  useEffect(() => {
    fetch("/api/sections").then((r) => r.json()).then(setSections);
    fetch("/api/companies").then((r) => r.json()).then(setCompanies);
  }, []);

  useEffect(() => {
    if (sections.length > 0 && activeSections.length === 0) {
      setActiveSections(sections.map((s) => s.code));
    }
  }, [sections, activeSections.length]);

  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCompanyId) {
      setStep("sections");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const company = await res.json();
    setSelectedCompanyId(company.id);
    setSaving(false);
    setStep("sections");
  };

  const handleCreateAssessment = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: selectedCompanyId,
        activeSections,
      }),
    });
    const assessment = await res.json();
    router.push(`/assessment/${assessment.id}/questionnaire`);
  };

  const toggleSection = (code: string) => {
    setActiveSections((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  if (step === "company") {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-tn-blue mb-6">Nuovo Assessment</h1>

        {companies.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-tn-blue mb-3">
              Seleziona un&apos;azienda esistente
            </h2>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
              value={selectedCompanyId || ""}
              onChange={(e) => setSelectedCompanyId(e.target.value || null)}
            >
              <option value="">— Nuova azienda —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.ragioneSociale} ({c.partitaIva})
                </option>
              ))}
            </select>
          </div>
        )}

        {!selectedCompanyId && (
          <form onSubmit={handleCompanySubmit} className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-tn-blue mb-4">Dati Anagrafici Azienda</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ragione Sociale *
                </label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  value={form.ragioneSociale}
                  onChange={(e) => setForm({ ...form, ragioneSociale: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">P.IVA *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  value={form.partitaIva}
                  onChange={(e) => setForm({ ...form, partitaIva: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Settore *
                </label>
                <select
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  value={form.settore}
                  onChange={(e) => setForm({ ...form, settore: e.target.value })}
                >
                  <option value="">Seleziona...</option>
                  {SETTORI.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sito Web</label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  value={form.sitoWeb}
                  onChange={(e) => setForm({ ...form, sitoWeb: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Addetti
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  value={form.numeroAddetti}
                  onChange={(e) => setForm({ ...form, numeroAddetti: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fatturato</label>
                <input
                  type="text"
                  placeholder="es. 5M€"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  value={form.fatturato}
                  onChange={(e) => setForm({ ...form, fatturato: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-tn-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50"
              >
                {saving ? "Salvataggio..." : "Avanti →"}
              </button>
            </div>
          </form>
        )}

        {selectedCompanyId && (
          <div className="flex justify-end">
            <button
              onClick={() => setStep("sections")}
              className="bg-tn-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold"
            >
              Avanti →
            </button>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Section selection
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-tn-blue mb-2">Selezione Sezioni</h1>
      <p className="text-gray-500 mb-6">
        Seleziona le sezioni su cui vuoi effettuare l&apos;audit. Puoi deselezionare le aree non
        applicabili.
      </p>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
        {sections.map((section) => (
          <label
            key={section.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={activeSections.includes(section.code)}
              onChange={() => toggleSection(section.code)}
              className="w-5 h-5 rounded accent-tn-orange"
            />
            <div>
              <span className="font-semibold text-tn-blue">{section.name}</span>
              <span className="text-sm text-gray-400 ml-2">
                ({section.questions.length} domande)
              </span>
            </div>
          </label>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep("company")}
          className="text-gray-500 hover:text-gray-700 px-4 py-2"
        >
          ← Indietro
        </button>
        <button
          onClick={handleCreateAssessment}
          disabled={saving || activeSections.length === 0}
          className="bg-tn-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold disabled:opacity-50"
        >
          {saving ? "Creazione..." : "Inizia Questionario →"}
        </button>
      </div>
    </div>
  );
}

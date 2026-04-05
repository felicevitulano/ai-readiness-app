"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Company {
  id: string;
  ragioneSociale: string;
  settore: string;
}

interface Assessment {
  id: string;
  status: string;
  globalScorePercent: number | null;
  globalMaturityLevel: string | null;
  createdAt: string;
  company: Company;
}

export default function AdminPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchAssessments = () => {
    setLoading(true);
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((data) => {
        setAssessments(data);
        setSelected(new Set());
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === assessments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(assessments.map((a) => a.id)));
    }
  };

  const handleDelete = async () => {
    if (selected.size === 0) return;
    const count = selected.size;
    if (!confirm(`Sei sicuro di voler eliminare ${count} assessment? Questa azione non può essere annullata.`)) return;

    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch(`/api/assessments/${id}`, { method: "DELETE" })
        )
      );
      fetchAssessments();
    } catch (err) {
      alert("Errore durante l'eliminazione. Riprova.");
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async (id: string) => {
    const res = await fetch(`/api/assessments/${id}/export/excel`);
    if (!res.ok) {
      alert("Errore durante l'export");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const assessment = assessments.find((x) => x.id === id);
    const name = assessment?.company.ragioneSociale.replace(/\s+/g, "_") || "assessment";
    const date = assessment ? new Date(assessment.createdAt).toISOString().slice(0, 10) : "";
    a.download = `AI_Readiness_${name}_${date}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSelected = async () => {
    for (const id of selected) {
      await handleExport(id);
    }
  };

  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const handleGenerateReport = async (id: string) => {
    setGeneratingReport(id);
    try {
      const res = await fetch(`/api/assessments/${id}/report`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Errore durante la generazione del report");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const assessment = assessments.find((x) => x.id === id);
      const name = assessment?.company.ragioneSociale.replace(/\s+/g, "_") || "report";
      a.download = `Report_AI_Readiness_${name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Errore di rete durante la generazione del report");
    } finally {
      setGeneratingReport(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tn-orange" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-tn-blue">Amministrazione</h1>
        <Link href="/" className="text-tn-orange hover:underline text-sm font-medium">
          &larr; Torna alla Dashboard
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg">Nessun assessment presente</p>
        </div>
      ) : (
        <>
          {/* Action bar */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">
              {selected.size > 0
                ? `${selected.size} di ${assessments.length} selezionati`
                : `${assessments.length} assessment totali`}
            </span>
            <div className="flex-1" />
            {selected.size > 0 && (
              <>
                <button
                  onClick={handleExportSelected}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Scarica selezionati ({selected.size})
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                  Elimina selezionati ({selected.size})
                </button>
              </>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-tn-blue text-white text-sm">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === assessments.length}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left px-4 py-3">Azienda</th>
                  <th className="text-left px-4 py-3">Settore</th>
                  <th className="text-left px-4 py-3">Data</th>
                  <th className="text-left px-4 py-3">Stato</th>
                  <th className="text-left px-4 py-3">Score</th>
                  <th className="text-left px-4 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr
                    key={a.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      selected.has(a.id) ? "bg-orange-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">{a.company.ragioneSociale}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{a.company.settore}</td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(a.createdAt).toLocaleDateString("it-IT")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          a.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {a.status === "completed" ? "Completato" : "Bozza"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {a.globalScorePercent != null ? `${a.globalScorePercent.toFixed(0)}%` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleGenerateReport(a.id)}
                          disabled={generatingReport === a.id || a.status !== "completed"}
                          className="text-tn-blue hover:underline text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                          title="Genera Report PDF"
                        >
                          {generatingReport === a.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-tn-blue" />
                          ) : null}
                          Report
                        </button>
                        <button
                          onClick={() => handleExport(a.id)}
                          className="text-green-600 hover:underline text-sm font-medium"
                          title="Scarica Excel"
                        >
                          Scarica
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Eliminare l'assessment di "${a.company.ragioneSociale}"?`)) {
                              fetch(`/api/assessments/${a.id}`, { method: "DELETE" }).then(() =>
                                fetchAssessments()
                              );
                            }
                          }}
                          className="text-red-500 hover:underline text-sm font-medium"
                          title="Elimina"
                        >
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

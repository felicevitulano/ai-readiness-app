"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Company {
  id: string;
  ragioneSociale: string;
  partitaIva: string;
  settore: string;
}

interface Assessment {
  id: string;
  companyId: string;
  status: string;
  globalScorePercent: number | null;
  globalMaturityLevel: string | null;
  createdAt: string;
  company: Company;
}

function MaturityBadge({ level }: { level: string | null }) {
  if (!level || level === "N/A") return <span className="score-badge score-na">N/A</span>;
  const cls = `score-${level.toLowerCase()}`;
  return <span className={`score-badge ${cls}`}>{level}</span>;
}

export default function HomePage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.json())
      .then(setAssessments)
      .finally(() => setLoading(false));
  }, []);

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
        <h1 className="text-2xl font-bold text-tn-blue">Assessment AI Readiness</h1>
        <Link
          href="/assessment/new"
          className="bg-tn-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg transition-colors font-semibold"
        >
          + Nuovo Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg mb-4">Nessun assessment ancora creato</p>
          <Link
            href="/assessment/new"
            className="bg-tn-orange hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold inline-block"
          >
            Crea il primo assessment
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-tn-blue text-white text-sm">
                <th className="text-left px-4 py-3">Azienda</th>
                <th className="text-left px-4 py-3">Settore</th>
                <th className="text-left px-4 py-3">Data</th>
                <th className="text-left px-4 py-3">Stato</th>
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Livello</th>
                <th className="text-left px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                    <MaturityBadge level={a.globalMaturityLevel} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {a.status === "draft" ? (
                        <Link
                          href={`/assessment/${a.id}/questionnaire`}
                          className="text-tn-orange hover:underline text-sm font-medium"
                        >
                          Continua
                        </Link>
                      ) : (
                        <>
                          <Link
                            href={`/assessment/${a.id}/dashboard`}
                            className="text-tn-orange hover:underline text-sm font-medium"
                          >
                            Dashboard
                          </Link>
                          <Link
                            href={`/assessment/${a.id}/questionnaire`}
                            className="text-gray-400 hover:underline text-sm"
                          >
                            Modifica
                          </Link>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

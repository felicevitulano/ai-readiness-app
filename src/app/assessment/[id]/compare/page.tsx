"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface Score {
  section: { name: string; order: number } | null;
  averageScore: number;
}

interface Assessment {
  id: string;
  createdAt: string;
  globalScorePercent: number | null;
  globalMaturityLevel: string | null;
  scores: Score[];
  company: { id: string; ragioneSociale: string };
}

export default function ComparePage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const [current, setCurrent] = useState<Assessment | null>(null);
  const [otherAssessments, setOtherAssessments] = useState<Assessment[]>([]);
  const [compareId, setCompareId] = useState<string>("");
  const [compareData, setCompareData] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/assessments/${assessmentId}`);
      const data = await res.json();
      setCurrent(data);

      const allRes = await fetch("/api/assessments");
      const allData: Assessment[] = await allRes.json();
      const others = allData.filter(
        (a) => a.company.id === data.company.id && a.id !== assessmentId
      );
      setOtherAssessments(others);
      setLoading(false);
    };
    load();
  }, [assessmentId]);

  useEffect(() => {
    if (!compareId) { setCompareData(null); return; }
    fetch(`/api/assessments/${compareId}`)
      .then((r) => r.json())
      .then(setCompareData);
  }, [compareId]);

  if (loading || !current) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tn-orange" />
      </div>
    );
  }

  const currentScores = current.scores
    .filter((s) => s.section)
    .sort((a, b) => a.section!.order - b.section!.order);

  const radarData = currentScores.map((s) => {
    const compareScore = compareData?.scores.find(
      (cs) => cs.section?.name === s.section!.name
    );
    return {
      subject: s.section!.name.replace(" & ", "\n& "),
      current: s.averageScore,
      compare: compareScore?.averageScore ?? 0,
      fullMark: 5,
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-tn-blue">
          Confronto Assessment — {current.company.ragioneSociale}
        </h1>
        <Link
          href={`/assessment/${assessmentId}/dashboard`}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          ← Torna alla dashboard
        </Link>
      </div>

      {otherAssessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <p className="text-gray-500">
            Non ci sono altri assessment per questa azienda da confrontare.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confronta con:
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
              value={compareId}
              onChange={(e) => setCompareId(e.target.value)}
            >
              <option value="">Seleziona un assessment...</option>
              {otherAssessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {new Date(a.createdAt).toLocaleDateString("it-IT")} — Score:{" "}
                  {a.globalScorePercent?.toFixed(0) ?? "—"}% ({a.globalMaturityLevel || "N/A"})
                </option>
              ))}
            </select>
          </div>

          {compareData && (
            <>
              {/* Global comparison */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6 text-center border-2 border-tn-orange">
                  <p className="text-xs text-gray-500 mb-1">
                    Attuale ({new Date(current.createdAt).toLocaleDateString("it-IT")})
                  </p>
                  <p className="text-4xl font-bold text-tn-orange">
                    {current.globalScorePercent?.toFixed(0) ?? "—"}%
                  </p>
                  <p className="text-sm font-semibold">{current.globalMaturityLevel}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 text-center border-2 border-tn-blue">
                  <p className="text-xs text-gray-500 mb-1">
                    Precedente ({new Date(compareData.createdAt).toLocaleDateString("it-IT")})
                  </p>
                  <p className="text-4xl font-bold text-tn-blue">
                    {compareData.globalScorePercent?.toFixed(0) ?? "—"}%
                  </p>
                  <p className="text-sm font-semibold">{compareData.globalMaturityLevel}</p>
                </div>
              </div>

              {/* Overlaid radar */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-tn-blue mb-4">Radar Comparativo</h2>
                <div style={{ height: 450 }}>
                  <ResponsiveContainer>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "#1B1464" }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tickCount={6} />
                      <Tooltip />
                      <Legend />
                      <Radar
                        name={`Attuale (${new Date(current.createdAt).toLocaleDateString("it-IT")})`}
                        dataKey="current"
                        stroke="#E87511"
                        fill="#E87511"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Radar
                        name={`Precedente (${new Date(compareData.createdAt).toLocaleDateString("it-IT")})`}
                        dataKey="compare"
                        stroke="#1B1464"
                        fill="#1B1464"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

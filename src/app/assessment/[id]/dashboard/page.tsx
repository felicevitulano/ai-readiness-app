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
} from "recharts";

interface Score {
  sectionId: string;
  section: { id: string; code: string; name: string; order: number } | null;
  averageScore: number;
  percentScore: number;
  maturityLevel: string;
  interpretation: string;
}

interface Comment {
  sectionId: string | null;
  section: { name: string } | null;
  commentText: string;
}

interface Assessment {
  id: string;
  status: string;
  globalScorePercent: number | null;
  globalMaturityLevel: string | null;
  createdAt: string;
  company: {
    id: string;
    ragioneSociale: string;
    settore: string;
    numeroAddetti: number | null;
    fatturato: string | null;
  };
  scores: Score[];
  comments: Comment[];
}

function levelColor(level: string): string {
  switch (level.toLowerCase()) {
    case "inesistente": return "text-red-600";
    case "iniziale": return "text-orange-600";
    case "definito": return "text-yellow-600";
    case "gestito": return "text-blue-600";
    case "ottimizzato": return "text-green-600";
    default: return "text-gray-500";
  }
}

function globalColor(level: string): string {
  switch (level.toLowerCase()) {
    case "critico": return "text-red-600";
    case "basso": return "text-orange-600";
    case "medio": return "text-yellow-600";
    case "buono": return "text-blue-600";
    case "eccellente": return "text-green-600";
    default: return "text-gray-500";
  }
}

export default function DashboardPage() {
  const params = useParams();
  const assessmentId = params.id as string;
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const loadData = async () => {
    const res = await fetch(`/api/assessments/${assessmentId}`);
    const data = await res.json();
    setAssessment(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [assessmentId]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    await fetch(`/api/assessments/${assessmentId}/scores`);
    await fetch(`/api/assessments/${assessmentId}/comments`, { method: "POST" });
    await loadData();
    setRegenerating(false);
  };

  if (loading || !assessment) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tn-orange" />
      </div>
    );
  }

  const radarData = assessment.scores
    .filter((s) => s.section)
    .sort((a, b) => a.section!.order - b.section!.order)
    .map((s) => ({
      subject: s.section!.name.replace(" & ", "\n& "),
      score: s.averageScore,
      fullMark: 5,
    }));

  const globalComment = assessment.comments.find((c) => !c.sectionId);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-tn-blue">
            {assessment.company.ragioneSociale}
          </h1>
          <p className="text-gray-500 text-sm">
            {assessment.company.settore} — Assessment del{" "}
            {new Date(assessment.createdAt).toLocaleDateString("it-IT")}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/assessments/${assessmentId}/export/excel`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Export Excel
          </a>
          <Link
            href={`/assessment/${assessmentId}/questionnaire`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            Modifica risposte
          </Link>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="bg-tn-blue hover:bg-tn-blue-light text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {regenerating ? "Rigenerando..." : "Rigenera commenti"}
          </button>
        </div>
      </div>

      {/* Global score card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Punteggio Globale</p>
            <p className="text-5xl font-bold text-tn-blue">
              {assessment.globalScorePercent?.toFixed(0) ?? "—"}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Livello AI Readiness</p>
            <p className={`text-3xl font-bold ${globalColor(assessment.globalMaturityLevel || "")}`}>
              {assessment.globalMaturityLevel || "N/A"}
            </p>
          </div>
          <div>
            {globalComment && (
              <p className="text-sm text-gray-600 italic leading-relaxed">
                {globalComment.commentText}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Radar chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-tn-blue mb-4">Radar di Maturità</h2>
        <div className="w-full" style={{ height: 400 }}>
          <ResponsiveContainer>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: "#1B1464" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 5]}
                tick={{ fontSize: 10 }}
                tickCount={6}
              />
              <Tooltip />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#E87511"
                fill="#E87511"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Section detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {assessment.scores
          .filter((s) => s.section)
          .sort((a, b) => a.section!.order - b.section!.order)
          .map((score) => {
            const comment = assessment.comments.find(
              (c) => c.sectionId === score.sectionId
            );
            return (
              <div key={score.sectionId} className="bg-white rounded-xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-tn-blue">{score.section!.name}</h3>
                  <span className={`text-sm font-bold ${levelColor(score.maturityLevel)}`}>
                    {score.maturityLevel}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div>
                    <span className="text-2xl font-bold text-tn-blue">
                      {score.averageScore.toFixed(1)}
                    </span>
                    <span className="text-gray-400 text-sm">/5</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-tn-orange h-2 rounded-full"
                        style={{ width: `${score.percentScore}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600">
                    {score.percentScore.toFixed(0)}%
                  </span>
                </div>
                {comment && (
                  <p className="text-xs text-gray-500 leading-relaxed">{comment.commentText}</p>
                )}
              </div>
            );
          })}
      </div>

      {/* Compare link */}
      <div className="text-center mb-6">
        <Link
          href={`/assessment/${assessmentId}/compare`}
          className="text-tn-orange hover:underline text-sm font-medium"
        >
          Confronta con un altro assessment di {assessment.company.ragioneSociale} →
        </Link>
      </div>
    </div>
  );
}

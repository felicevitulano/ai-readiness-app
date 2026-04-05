"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

interface Question {
  id: string;
  number: number;
  text: string;
  order: number;
  section: { id: string; code: string; name: string; order: number };
}

interface Answer {
  questionId: string;
  score: number | null;
  notes: string;
  respondent: string;
  source: string;
}

interface Section {
  id: string;
  code: string;
  name: string;
  order: number;
  questions: Question[];
}

interface AnswerFromDB {
  questionId: string;
  score: number | null;
  notes: string | null;
  respondent: string | null;
  source: string | null;
  question: Question;
}

export default function QuestionnairePage() {
  const router = useRouter();
  const params = useParams();
  const assessmentId = params.id as string;

  const [sections, setSections] = useState<Section[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const load = async () => {
      const [assessmentRes, sectionsRes, answersRes] = await Promise.all([
        fetch(`/api/assessments/${assessmentId}`),
        fetch("/api/sections"),
        fetch(`/api/assessments/${assessmentId}/answers`),
      ]);

      const assessment = await assessmentRes.json();
      const allSections: Section[] = await sectionsRes.json();
      const existingAnswers: AnswerFromDB[] = await answersRes.json();

      const activeCodes: string[] = JSON.parse(assessment.activeSections);
      const filtered = allSections.filter((s) => activeCodes.includes(s.code));
      setSections(filtered);
      setCompanyName(assessment.company.ragioneSociale);

      const ansMap: Record<string, Answer> = {};
      for (const a of existingAnswers) {
        ansMap[a.questionId] = {
          questionId: a.questionId,
          score: a.score,
          notes: a.notes || "",
          respondent: a.respondent || "",
          source: a.source || "",
        };
      }
      setAnswers(ansMap);
      setLoading(false);
    };
    load();
  }, [assessmentId]);

  const currentSection = sections[currentSectionIndex];

  const saveCurrentSection = useCallback(async () => {
    if (!currentSection) return;
    const sectionAnswers = currentSection.questions.map((q) => ({
      questionId: q.id,
      score: answers[q.id]?.score ?? null,
      notes: answers[q.id]?.notes || "",
      respondent: answers[q.id]?.respondent || "",
      source: answers[q.id]?.source || "",
    }));

    setSaving(true);
    await fetch(`/api/assessments/${assessmentId}/answers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers: sectionAnswers }),
    });
    setSaving(false);
  }, [currentSection, answers, assessmentId]);

  const setAnswer = (questionId: string, field: keyof Answer, value: string | number | null) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        questionId,
        score: prev[questionId]?.score ?? null,
        notes: prev[questionId]?.notes || "",
        respondent: prev[questionId]?.respondent || "",
        source: prev[questionId]?.source || "",
        [field]: value,
      },
    }));
  };

  const goNext = async () => {
    await saveCurrentSection();
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex((i) => i + 1);
      window.scrollTo(0, 0);
    }
  };

  const goPrev = async () => {
    await saveCurrentSection();
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((i) => i - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleComplete = async () => {
    await saveCurrentSection();
    // Calculate scores
    await fetch(`/api/assessments/${assessmentId}/scores`);
    // Generate AI comments
    await fetch(`/api/assessments/${assessmentId}/comments`, { method: "POST" });
    // Mark as completed
    await fetch(`/api/assessments/${assessmentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    router.push(`/assessment/${assessmentId}/dashboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tn-orange" />
      </div>
    );
  }

  if (!currentSection) return null;

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredQuestions = Object.values(answers).filter((a) => a.score !== null).length;
  const progressPercent = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-tn-blue">{companyName}</h1>
          <span className="text-sm text-gray-500">
            {answeredQuestions}/{totalQuestions} risposte
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-tn-orange h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Section tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={async () => {
                await saveCurrentSection();
                setCurrentSectionIndex(i);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                i === currentSectionIndex
                  ? "bg-tn-orange text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s.order}. {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Section title */}
      <div className="bg-tn-blue text-white rounded-t-xl px-6 py-4">
        <h2 className="text-lg font-bold">
          {currentSection.order}. {currentSection.name}
        </h2>
        <p className="text-white/60 text-sm">{currentSection.questions.length} domande</p>
      </div>

      {/* Questions */}
      <div className="bg-white rounded-b-xl shadow-sm divide-y divide-gray-100">
        {currentSection.questions.map((q) => {
          const answer = answers[q.id];
          return (
            <div key={q.id} className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="bg-tn-blue text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center flex-shrink-0">
                  {q.number}
                </span>
                <p className="text-sm font-medium text-gray-800">{q.text}</p>
              </div>

              {/* Score buttons */}
              <div className="flex items-center gap-2 mb-3 ml-10">
                <span className="text-xs text-gray-400 mr-1">Punteggio:</span>
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() =>
                      setAnswer(q.id, "score", answer?.score === score ? null : score)
                    }
                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                      answer?.score === score
                        ? "bg-tn-orange text-white shadow-md scale-110"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {score}
                  </button>
                ))}
                <button
                  onClick={() => setAnswer(q.id, "score", null)}
                  className={`px-3 h-9 rounded-lg text-xs font-medium transition-all ${
                    answer?.score === null || answer?.score === undefined
                      ? "bg-gray-400 text-white"
                      : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  N/A
                </button>
              </div>

              {/* Extra fields (collapsible) */}
              <details className="ml-10">
                <summary className="text-xs text-tn-orange cursor-pointer hover:underline">
                  Note, rispondente, fonte
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Note / evidenze"
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={answer?.notes || ""}
                    onChange={(e) => setAnswer(q.id, "notes", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Rispondente"
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={answer?.respondent || ""}
                    onChange={(e) => setAnswer(q.id, "respondent", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Fonte"
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                    value={answer?.source || ""}
                    onChange={(e) => setAnswer(q.id, "source", e.target.value)}
                  />
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-6 mb-10">
        <button
          onClick={goPrev}
          disabled={currentSectionIndex === 0}
          className="text-gray-500 hover:text-gray-700 px-4 py-2 disabled:opacity-30"
        >
          ← Sezione precedente
        </button>
        <button
          onClick={saveCurrentSection}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          {saving ? "Salvataggio..." : "Salva bozza"}
        </button>
        {currentSectionIndex < sections.length - 1 ? (
          <button
            onClick={goNext}
            className="bg-tn-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            Sezione successiva →
          </button>
        ) : (
          <button
            onClick={handleComplete}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-semibold"
          >
            Completa e vedi risultati
          </button>
        )}
      </div>
    </div>
  );
}

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ragione_sociale" TEXT NOT NULL,
    "partita_iva" TEXT NOT NULL,
    "settore" TEXT NOT NULL,
    "sito_web" TEXT,
    "numero_addetti" INTEGER,
    "fatturato" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "section_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "questions_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "active_sections" TEXT NOT NULL DEFAULT '[]',
    "global_score_percent" REAL,
    "global_maturity_level" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "completed_at" DATETIME,
    CONSTRAINT "assessments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessment_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "score" INTEGER,
    "notes" TEXT,
    "respondent" TEXT,
    "source" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "answers_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessment_scores" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessment_id" TEXT NOT NULL,
    "section_id" TEXT,
    "average_score" REAL NOT NULL,
    "percent_score" REAL NOT NULL,
    "maturity_level" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "assessment_scores_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "assessment_scores_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessment_id" TEXT NOT NULL,
    "section_id" TEXT,
    "comment_text" TEXT NOT NULL,
    "model_used" TEXT NOT NULL,
    "generated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_comments_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ai_comments_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_partita_iva_key" ON "companies"("partita_iva");

-- CreateIndex
CREATE UNIQUE INDEX "sections_code_key" ON "sections"("code");

-- CreateIndex
CREATE UNIQUE INDEX "answers_assessment_id_question_id_key" ON "answers"("assessment_id", "question_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_scores_assessment_id_section_id_key" ON "assessment_scores"("assessment_id", "section_id");

-- CreateIndex
CREATE UNIQUE INDEX "ai_comments_assessment_id_section_id_key" ON "ai_comments"("assessment_id", "section_id");

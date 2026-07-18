# Resume Shapeshifter — Phase-Wise Implementation Plan

This document outlines the step-by-step roadmap for building **Resume Shapeshifter**. The plan maps directly to the system design detailed in [architecture.md](file:///Users/ansar/Documents/Certification%20in%20Data%20Science%20and%20Artificial%20Intelligence%20Program%20by%20E&ICT%20Academy,%20IIT%20Roorkee%21/Week%202%20Resume%20Shapeshifter%20%E2%80%94%20JD-to-Resume%20Tailoring%20Engine/RESUME-BUILDER-PROJECT/docs/architecture.md).

---

## Phase 1: Static UI Prototype

**Goal**: Establish the Next.js frontend structure, design tokens, responsive layout transitions, and interactive mock screens using placeholder states.

### 📋 Checklist & Tasks
* [x] **1.1. Codebase Initialization**
  * Set up a Next.js (App Router or Pages Router) workspace with React, TypeScript, and Tailwind CSS.
  * Install UI dependency base: `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`.
  * Set up Google Fonts (*Inter* or *Outfit*) in the base styles.
* [x] **1.2. Design System and Styling Setup**
  * Configure custom colors in `tailwind.config.js` (harmonious slate-zinc base, electric blue highlights, and soft amber/red for risk/gap warnings).
  * Design utility styles for glassmorphism panels, card containers, and smooth step-by-step sliding animations.
* [x] **1.3. Mock Data Setup**
  * Implement TS interfaces in `lib/schemas.ts` matching Zod profiles (Original Resume, Extracted JD, Scores, Tailored Resume, and Gaps).
  * Create mock data objects for a sample resume (e.g., Early-Career Software Engineer) and a sample job description (e.g., Senior Full-Stack Engineer) to populate views.
* [x] **1.4. Dashboard & Wizard Layout (`components/AppLayout.tsx`)**
  * Implement global header, step progress bar, and container panel.
  * Build state management transitions: Step 1 (Ingest) $\rightarrow$ Step 2 (Analysis Results) $\rightarrow$ Step 3 (Side-by-Side Review) $\rightarrow$ Step 4 (Export).
* [x] **1.5. Ingest View (`components/ResumeInput.tsx` and `components/JDInput.tsx`)**
  * Build text-area input boards for pasting resumes and JDs.
  * Create standard file upload drag-and-drop targets for PDFs/DOCX with file metadata display.
* [x] **1.6. Results & Score View (`components/ScoreCard.tsx` and `components/GapAnalysisView.tsx`)**
  * Render overall match percentage with a modern circular progress ring or colored speed gauges.
  * List sub-scores (Skills, Keywords, Seniority) and display an explainable markdown notes box.
  * List gaps sorted by importance level with visual indicators for recommended actions.
* [x] **1.7. Side-by-Side Comparative Editor (`components/SideBySideDiff.tsx`)**
  * Implement two-column viewport (left: original content; right: tailored content).
  * Implement interactive approval controls: *[Approve]* (glows green), *[Edit]* (opens textarea), and *[Reject]* (resets to original).
  * Highlight rewritten words with subtle backgrounds (green for additions, red-strike for removals).

### 📦 Phase 1 Deliverables
* Fully interactive frontend mockup with working navigation and mock data.
* Type-safe interfaces matching the schema requirements.
* Core React components ready to receive live API integrations.

---

## Phase 2: Ingestion & Parser Service

**Goal**: Implement backend parsing services that ingest raw files/text and produce typed structured JSON payloads using the LLM.

### 📋 Checklist & Tasks
* [x] **2.1. File Parsing Infrastructure**
  * Install document processing libraries: `pdf-parse` for PDFs, `mammoth` for Word documents (.docx).
  * Write a document reader utility function that extracts raw string text from files.
* [x] **2.2. Schema Validation Definitions (`lib/schemas.ts`)**
  * Implement full **Zod** schema equivalents for `ResumeProfileSchema`, `JobDescriptionProfileSchema`, and others outlined in the architecture document.
* [x] **2.3. LLM API Client (`lib/llm.ts`)**
  * Configure the Groq SDK client using `GROQ_API_KEY` as the permanent primary LLM provider.
  * Implement model fallback routing (`llama-3.3-70b-versatile` falling back to `llama-3.1-8b-instant`) to handle rate limits and service exhaustions.
  * Wrap completion methods with standardized error handling and JSON parsing layers.
* [x] **2.4. Resume Parser Engine (`prompts/resume-parser.ts`)**
  * Draft the system prompt instructing the LLM to structure incoming raw text into `ResumeProfileSchema`.
  * Define examples (few-shot prompting) demonstrating parsing of multi-column templates and non-standard sections into standard keys.
* [x] **2.5. Job Description Analyzer (`prompts/jd-extraction.ts`)**
  * Draft the system prompt instructing the LLM to extract keywords, seniority, qualifications, and core tools into `JobDescriptionProfileSchema`.
* [x] **2.6. Parser API Endpoints**
  * Build API routes: `POST /api/parse-resume` and `POST /api/analyze-jd`.
  * Validate outputs using Zod schema's `.parse()` method. Apply catch blocks to handle malformed LLM responses by triggering a simplified repair retry query.

### 📦 Phase 2 Deliverables
* Fully functioning document ingestion pipeline that extracts plain text from PDF and DOCX files.
* API endpoints returning strictly typed JSON representations of resumes and job descriptions.
* Validated LLM prompt modules for parser orchestration.

---

## Phase 3: Analysis & Rewrite Pipeline (Core Engine)

**Goal**: Implement scoring logic, gap evaluation, bullet tailoring with truthfulness guardrails, and hook the backend engines to the UI.

### 📋 Checklist & Tasks
* [x] **3.1. Scoring Engine (`lib/scoring.ts` & `prompts/match-scoring.ts`)**
  * Write the scoring module. Use a hybrid scoring mechanism:
    * *Algorithmic*: Direct string/keyword mapping for technical terms.
    * *Semantic*: LLM-driven comparison of responsibility alignment and title seniority.
  * Integrate composite scores calculation (Skill, Keyword, Responsibility, Seniority scores).
* [x] **3.2. Gap Analyzer (`prompts/gap-analysis.ts`)**
  * Draft the gap analysis prompt to identify missing mandatory credentials or tools, outputting specific actionable advice.
  * Build `POST /api/score` endpoint combining scoring and gap analysis calculations.
* [x] **3.3. Bullet-by-Bullet Tailoring Engine (`prompts/bullet-rewriter.ts`)**
  * Draft the bullet-rewriter system prompt. Embed strict constraint parameters:
    * *Rule*: No metrics addition unless present in the original bullet.
    * *Rule*: Do not assume experience in technologies not present in the user's profile.
    * *Rule*: Match verbs and phrasing syntax to target job listing style.
  * Implement an orchestrator loop that feeds experience blocks sequentially to the LLM to prevent cross-context confusion or truncation.
* [x] **3.4. Post-Parsing Truthfulness Guardrails**
  * Implement a backend checking utility: Compare technical tokens in `tailoredSkills` against the original resume.
  * Flag any new tools not present in the original resume as a warnings dictionary returned to the UI.
* [x] **3.5. Pipeline Integration**
  * Implement the route: `POST /api/tailor` orchestrating bullet tailoring and updating tailored scores.
  * Connect the frontend UI components to these endpoints, switching state from "loading" spinners to the side-by-side comparison screen once ready.

### 📦 Phase 3 Deliverables
* API route `/api/tailor` generating tailored content, risk metadata, and confidence scores.
* Scoring endpoints producing explainable percentage scores.
* Frontend dashboard showing real-time analyzed results, comparative diffs, and validation warnings.

---

## Phase 4: PDF Generator

**Goal**: Implement high-fidelity PDF output generation for both the standalone tailored resume and the comparative proof report.

### 📋 Checklist & Tasks
* [x] **4.1. Print Layout Views (`src/app/print/tailored/page.tsx` & `src/app/print/comparison/page.tsx`)**
  * Build clean HTML pages styled specifically for printing:
    * `tailored/page.tsx`: Standard resume design (clean lines, standard margins, single column, black-and-white, print-friendly).
    * `comparison/page.tsx`: Landscape layout containing two columns (original vs tailored) with green/red highlight overlays, score cards, and gap charts.
  * Use CSS rules to prevent orphaned headers (`break-inside-avoid`) and style page dimensions (`@media print { @page { size: A4 portrait; margin: 0.5in; } }`).
* [x] **4.2. Client-Side Print Architecture (Native PDF Export)**
  * Utilize browser-native `window.print()` to print directly to PDF. This guarantees 100% font rendering fidelity, retains exact layout CSS, and avoids server-side sandbox issues.
* [x] **4.3. Session Serialization**
  * Set up client-side data serialization (`localStorage`) to hydrate print views dynamically when opening in new print tabs.
* [x] **4.4. UI Integration**
  * Hook up PDF buttons on the final review stage, triggering routing to `/print/tailored` and `/print/comparison`.

### 📦 Phase 4 Deliverables
* High-fidelity print layouts styled with Tailwind print utilities.
* Interactive client-side PDF generation yielding polished resume downloads and side-by-side comparison documents.

---

## Phase 5: Verification, Guardrails & Polish

**Goal**: Validate truthfulness constraints, add session caching, resolve edge cases, and perform full testing.

### 📋 Checklist & Tasks
* [ ] **5.1. Session Caching & Local Storage**
  * Save the current `TailoringRun` payload in `localStorage` or `sessionStorage` on changes.
  * Enable page reloads without losing the tailoring session state.
* [ ] **5.2. Edge Case Diagnostics**
  * Test parsing against complex resumes (multi-column tables, headers containing graphics).
  * Validate prompt resiliency against very short or vague job descriptions.
  * Implement front-end error boundaries to intercept malformed API outcomes, directing users to paste text directly if file parsing fails.
* [ ] **5.3. E2E Validation Walkthrough**
  * Create a demo suite containing:
    * 1 Sample resume (Software Engineer).
    * 1 Target job description.
  * Run the full pipeline and verify:
    * No false technologies are added.
    * Changed bullets correctly reference JD keywords.
    * High-quality PDF layouts are produced without overflowing pages.
* [ ] **5.4. UX Optimization**
  * Add skeleton loading states during LLM calls.
  * Build a disclaimer banner reminding candidates to manually double-check all statements before submitting applications.

### 📦 Phase 5 Deliverables
* Production-ready codebase featuring validation tests.
* Complete demo scripts with verified PDFs and structured files.
* Truthfulness disclaimer and user safety guardrails.

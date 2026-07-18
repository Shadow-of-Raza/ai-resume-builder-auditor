# Resume Shapeshifter — Edge Cases & Mitigations Registry

This document serves as a developer reference during coding. It logs known edge cases, failure states, and UI/backend mitigations for each phase of the implementation plan. Refer to this during development to ensure robustness.

---

## Phase 1: Static UI Prototype Edge Cases

### 1.1. Side-by-Side Editor on Mobile Viewports
* **The Problem**: A two-column landscape layout (Left: Original, Right: Tailored) cannot fit on mobile screens (less than 1024px width). Renders text vertically squished and unreadable.
* **Mitigation**:
  * In `components/SideBySideDiff.tsx`, implement a responsive media query using Tailwind CSS. 
  * Under `lg` viewports (desktop), show two columns side-by-side.
  * On mobile/tablet (`< lg`), switch to a **tabbed view** (`Tabs` component from Radix/Shadcn):
    * Tab 1: "Original Resume"
    * Tab 2: "Tailored Preview" (with inline diff highlighting)
    * Tab 3: "Changes & Metadata"

### 1.2. Text Overflow in Input Text Areas
* **The Problem**: A user pastes a massive resume (e.g., 20 pages of academic text) or copies an entire job board page including headers/footers (100,000+ characters), causing severe browser lag or UI overflow.
* **Mitigation**:
  * Add character counter indicators under inputs in `components/ResumeInput.tsx` and `components/JDInput.tsx`.
  * Enforce maximum string lengths: 50,000 characters for resumes, 30,000 characters for job descriptions.
  * Apply `overflow-y-auto max-h-[400px]` classes to input containers to keep page heights bounded.

### 1.3. Page Navigation Without Required State
* **The Problem**: A user bookmarks the `/results` page or reloads `/editor` when the underlying resume or JD state is empty, leading to undefined variable errors and UI crashes.
* **Mitigation**:
  * Add navigation guards in React routing.
  * If state variables (`originalResume`, `jobDescription`) are null, programmatically redirect the user back to `/` (Ingestion screen) with a toast message: *"Please upload or paste your resume and job description to begin."*

---

## Phase 2: Ingestion & Parser Service Edge Cases

### 2.1. Multi-Column PDF Parsing Jumble
* **The Problem**: Standard PDF libraries extract text line-by-line from left to right. In a two-column resume template, this merges column lines:
  ```text
  [Raw Line]: Software Developer   | Contact Info:
  [Parsed]: Software Developer Contact Info:
  ```
  This scrambles job dates, company names, and bullet points.
* **Mitigation**:
  * Utilize a PDF parser that preserves text bounding boxes or parses layout columns.
  * In `/prompts/resume-parser.ts`, instruct the LLM: *"Analyze the text. Reconstruct the logical reading flow. Identify if columns were read horizontally and segment the contact info, experience entries, and dates back into their correct structured boundaries."*
  * Provide a visual alert in the UI:
    > [!TIP]
    > If your resume uses a complex multi-column grid and parses incorrectly, copy-pasting the raw text directly into our editor will yield the best results.

### 2.2. Image-Only Scanned PDFs
* **The Problem**: Users upload a PDF that is simply a scanned photograph of a paper resume. The text extraction returns an empty string or white space.
* **Mitigation**:
  * After running the parsing library, check the length of the extracted string.
  * If the file size is > 500KB but the extracted text is under 150 characters, block execution and prompt: *"It looks like your PDF is a scanned image. Please upload a text-based PDF/Word file or paste the text directly."*

### 2.3. Character Encoding Corruption
* **The Problem**: Resumes often contain copy-pasted smart quotes, em-dashes, or special bullet characters (`•`, `▪`, `➢`) which translate into raw character garbage (e.g., `` or `u2022`) depending on the system encoding.
* **Mitigation**:
  * Run a sanitization filter on the backend raw text before feeding it to Zod or the LLM:
    ```typescript
    const cleanText = rawText
      .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
      .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
      .replace(/[\u2013\u2014]/g, '-') // Em/En dashes
      .replace(/[^\x00-\x7F]/g, " ");   // Replace non-ASCII markers with spaces where appropriate
    ```

### 2.4. LLM JSON Generation Syntax Errors
* **The Problem**: Even with JSON schema output enabled, LLM completions might contain trailing commas, raw backslashes, markdown fence blocks, or text preambles ("Here is the JSON...").
* **Mitigation**:
  * Write a regex cleaning function:
    ```typescript
    export function cleanJsonString(raw: string): string {
      let clean = raw.trim();
      // Remove leading markdown code blocks
      clean = clean.replace(/^```json\s*/i, '');
      // Remove trailing code block markers
      clean = clean.replace(/\s*```$/, '');
      return clean.trim();
    }
    ```
  * Wrap parsing in a retry block. If Zod validation fails, send the schema error log back to the LLM for a single auto-correction attempt.

### 2.5. Server-Side PDF Parser Worker Failure (Setting up fake worker failed)
* **The Problem**: In Next.js App Router API routes, the compiler tries to bundle `pdf-parse` and `pdfjs-dist` into server chunks under `.next/dev/server/chunks/`. At runtime, `pdfjs-dist` tries to load the helper module `pdf.worker.mjs` relative to the chunk path instead of its actual location in `node_modules`, causing a fatal "Cannot find module" loading error and crashing the ingestion step.
* **Mitigation**:
  * Add both `pdf-parse` and `pdfjs-dist` to the `serverExternalPackages` array in `next.config.ts`. This instructs the Next.js compiler to treat them as external dependencies, resolving them dynamically from the root `node_modules` directory where all worker files are correctly located.

### 2.6. Strict Contact URL and Email Formatting Crashes
* **The Problem**: A user uploads a resume where the website is written as a simple domain (e.g. `"linkedin.com/in/username"`) or an email has special characters or atypical structures. Enforcing strict Zod `.url()` and `.email()` validators on the backend schema causes validation parsing to throw fatal errors and block parsing execution.
* **Mitigation**:
  * Relax the schema validators for email and website in `ResumeProfileSchema` to generic optional strings (`z.string().optional().or(z.literal(''))`). This handles incomplete, protocol-less, and atypically formatted details gracefully without interrupting the core wizard pipeline.

### 2.7. Non-deterministic Array Formatting Mismatches (String vs Array)
* **The Problem**: LLM models occasionally output a single comma-separated string (e.g., `"React, Webpack"`) instead of an array of strings (e.g., `["React", "Webpack"]`) for list fields like technologies, skills, or certifications. This triggers a validation mismatch in the array-expecting Zod schema.
* **Mitigation**:
  * Preprocess the incoming fields using `z.preprocess()` to check if the value is a string. If so, split it by commas, trim extra whitespace, filter empty values, and cast it to an array of strings before feeding it to Zod.

---

## Phase 3: Analysis & Rewrite Pipeline Edge Cases

### 3.1. Hallucination of Metrics or Technology Experience
* **The Problem**: The LLM changes *"Worked on React frontends"* to *"Worked on React frontends, improving efficiency by 35% using Kubernetes and AWS"* to align with a JD that mentions Docker/AWS, fabricating skills.
* **Mitigation**:
  * **System Instruction Guardrail**: Include strict negative constraints in the prompt:
    > [!IMPORTANT]
    > **Strict Rule**: You must never add metrics or quantitative claims that were not present in the original resume. 
    > **Strict Rule**: Do not add technologies, tools, or frameworks to the experience bullets if they are not mentioned in the original experience entry or overall skills list.
  * **Fuzzy Match Validation**: On `/api/tailor` return, loop over the `tailoredSkills`. Cross-reference them against the `originalResume.skills` and text body. If a technical keyword appears in the tailored output but has 0 occurrences in the original data, strip it from `tailoredSkills` and append it to the `gapAnalysis` list instead.

### 3.2. Title Seniority Mismatch
* **The Problem**: An entry-level applicant applies to a "Lead Software Architect" role. The LLM attempts to alter job titles (e.g., changing "Intern" to "Lead Developer") to match the JD, which constitutes credentials fabrication.
* **Mitigation**:
  * The `/prompts/bullet-rewriter.ts` must be locked from changing official job titles or company names.
  * Seniority alignment must be addressed exclusively via **Gap Analysis** warnings rather than renaming history: *"Warning: The job description requires Lead/Senior experience. Your resume indicates Entry/Mid level experience. Do not fabricate titles. Highlight leadership skills in your existing experience where applicable."*

### 3.3. Batch Token Limits and Output Latency
* **The Problem**: Running scoring, gap analysis, and bullet rewrites in a single API call for a large resume exceeds serverless function timeout limits (often 10–15 seconds on hosting platforms like Vercel).
* **Mitigation**:
  * Decouple the calls:
    1. Call `/api/analyze-inputs` (Returns `ResumeProfile` and `JobDescriptionProfile`).
    2. Call `/api/score` (Fast calculation + gap compile).
    3. Call `/api/tailor` chunked by experience block (e.g., one API call per company experience block).
  * Show individual progress indicators for each experience block in the UI.

### 3.4. Primary LLM API Quota Exhaustion (429 Rate Limits)
* **The Problem**: Free tier Groq API keys can trigger rate limits or request caps, causing API service crashes.
* **Mitigation**:
  * Implement a model fallback orchestrator inside `src/lib/llm.ts` with automatic fallback. If the primary Llama 3.3 model (`llama-3.3-70b-versatile`) throws a 429 or metric quota violation error, the system transparently falls back to `llama-3.1-8b-instant` (or another healthy backup model) to ensure zero service disruption.

### 3.5. System Prompt & Schema Key Inconsistencies
* **The Problem**: Natural language system instructions describing output groups (e.g., "Contact Info", "Work Experience") can conflict with Zod schema key definitions (e.g., "contact", "experience"). This causes LLM models like Llama to generate capitalized or spaced keys that fail Zod parser verification.
* **Mitigation**:
  * Align all system prompt instructions in `resume-parser.ts` and `jd-extraction.ts` to reference the exact lowercase keys defined in the Zod schemas.
  * Dynamically extract the structural outline of the Zod schemas (using `zodToDescriptor`) and stringify/inject it directly into the LLM system prompt as a `CRITICAL: You must return a JSON object matching this schema structure...` constraint instruction.

### 3.6. Zod 4 Internal API Breakage (Silent Schema Descriptor Failure)
* **The Problem**: Zod v4 changed its internal representation. `_def.typeName` (e.g., `'ZodObject'`) no longer exists — replaced by `_def.type` (e.g., `'object'`). Array element schemas moved from `_def.type` to `_def.element`. The `zodToDescriptor` helper silently fell through to its default case, outputting `"string"` as the entire schema descriptor. The LLM then received contradictory instructions ("return a JSON object matching: `string`"), causing Groq's strict JSON validator to reject malformed output with `json_validate_failed`.
* **Mitigation**:
  * Rewrite `zodToDescriptor` to check `_def.typeName`, `_def.type`, and `schema.type` in priority order, covering both Zod 3 and Zod 4 internals.
  * Handle Zod 4's `'pipe'` type (used by `z.preprocess()`) by resolving through `_def.out` to reach the underlying array/object schema.

### 3.7. Provider Rate Limit Exhaustion and Backoff
* **The Problem**: The primary Groq model (`llama-3.3-70b-versatile`) can hit rate limits due to high-frequency usage or concurrent requests. If the fallback models also fail immediately, it gives the user no recovery path.
* **Mitigation**:
  * Implement retry-with-backoff in `getStructuredCompletion`: up to 3 attempts with exponential backoff (5s → 10s → 20s), waiting for suggested rate-limit delays up to 15 seconds (using a 5-second default fallback wait if no specific retry time is parsed).
  * If the primary model exhausts all retries or hits a long delay (>15s), the system falls back to the next model in the fallback array. If all models fail, a clear user-facing message explains the situation: "LLM models are rate-limited. Please wait a few minutes and try again."

### 3.8. Null Value Validation Crashes (invalid_type/invalid_union)
* **The Problem**: When extracting resumes, LLMs often return `null` or omit optional sections (e.g. absent phone numbers, locations, website links, GPAs, education majors/degrees/dates, or work experience dates). Zod schemas configured only with `.optional()` or strict string types reject `null` and missing (`undefined`) values, throwing validation parsing errors and crashing the ingestion step.
* **Mitigation**:
  * Explicitly append `.nullable().optional()` to all optional string/number metadata schemas (e.g., `email: z.string().nullable().optional()`).
  * Relax schemas like `EducationSchema` (`degree`, `major`, `graduationDate`), `WorkExperienceSchema` (`startDate`, `endDate`), and `ResumeGapSchema` (`jdEvidence`, `resumeEvidence`, `suggestedAction`) to be `.nullable().optional()` so that the parser accepts missing, undefined, or null values gracefully.

### 3.9. Sequential LLM call Spikes and Latency under Failing Keys
* **The Problem**: When a model/key is rate-limited to 0, iterating through all fallback models before failing adds substantial sequential connection latency (8–10 seconds per LLM request). In multi-step pipelines (like sequential tailoring of multiple job entries), this freezes the frontend showing "processing" indefinitely.
* **Mitigation**:
  * **Circuit Breaker Cache**: Maintain an in-memory `Map` that flags models as unhealthy for a 2-minute cooldown when a request fails or returns a 429/403 block. Subsequent requests immediately bypass these unhealthy models, avoiding sequential timeouts and routing straight to backup Groq/Llama models instantly.

### 3.10. Groq JSON Validation Failure (`json_validate_failed`)
* **The Problem**: When generating structured output, the LLM may output raw markdown directly for long text block fields (e.g. `"explanation": ### ...`) without wrapping the content in double quotes as a standard JSON string value. This syntax error causes the Groq gateway to reject the completion with a `400 json_validate_failed` status block before the application can receive and parse the payload.
* **Mitigation**:
  * Add strict formatting constraints to the system prompt (e.g., in `match-scoring.ts`) explicitly demanding that the field value must be a valid, escaped JSON string with newlines represented as `\n` and double quotes escaped as `\"`.
  * Define the JSON type schema layout clearly with double-quoted placeholder explanations in the prompt structure block.

### 3.11. Unhealthy Model Cooldown Cache Exhaustion ("Unknown LLM error")
* **The Problem**: When consecutive calls hit rate limits or validation parsing exceptions, all available models inside the provider queue get flagged as unhealthy and put on cooldown. When a subsequent request is triggered, the orchestrator filters out all models, building an empty queue. This skips the request loop entirely and throws a generic "Unknown LLM error".
* **Mitigation**:
  * Implement a safety fallback check in the orchestrator (`llm.ts`). If the healthy model queue builder returns `0` available models, bypass the cooldown filter as a last resort and populate the queue with all standard models to attempt the request anyway.


## Phase 4: PDF Generator Edge Cases

### 4.1. The "1.1-Page" Resume Spillover
* **The Problem**: The tailored rephrases might run slightly longer than the original text. A resume that fits on exactly one page now spills 2 to 3 lines onto Page 2, looking highly unprofessional.
* **Mitigation**:
  * Implement dynamic styling rules in `pages/print/tailored.tsx`:
    * Count total bullet points. If total bullets exceed 12, reduce layout font-size from `text-base` (16px) to `text-sm` (14px) or `text-xs` (12px).
    * Reduce paragraph padding classes (`py-2` to `py-1` or `space-y-3` to `space-y-1.5`).
  * Add a page-break styling flag `break-inside-avoid` to work experience card components to prevent a single job block from splitting awkwardly across sheets.

### 4.2. Missing System Fonts in Headless Server Environment
* **The Problem**: PDF generation via server-side Puppeteer renders standard fonts like *Arial* or *Calibri*. If the layout utilizes a custom font (e.g., *Inter*), the headless browser will fallback to default Linux fonts (e.g., *DejaVu Sans*), breaking layout dimensions and page budgeting.
* **Mitigation**:
  * Explicitly import web fonts as absolute URLs (Google Web Fonts) inside the HTML print template head:
    ```html
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    ```
  * Wait for network idle (`networkidle0`) in Puppeteer before printing to ensure web fonts have loaded.

### 4.3. Print Route Hijacking/Security
* **The Problem**: If the headless printer opens `/print/tailored?id=XYZ` to print, this route must be accessible locally but blocked from unauthorized public web access.
* **Mitigation**:
  * Implement validation tokens. The print route should require a short-lived signature token in the query params.
  * Alternatively, construct the PDF by passing the compiled HTML string directly to Puppeteer using `page.setContent(htmlString)` instead of loading a public URL path.

---

## Phase 5: Verification, Guardrails & Polish Edge Cases

### 5.1. Local Storage Size Exceeded (`QuotaExceededError`)
* **The Problem**: Browser `localStorage` is capped at 5MB. Saving multiple detailed tailoring sessions (which contain large text chunks, original scores, tailored scores, and HTML logs) will crash local storage.
* **Mitigation**:
  * Wrap all local storage write operations in a try-catch block.
  * If write fails, fallback to `sessionStorage` (which is per-tab and cleared on exit).
  * Maintain a FIFO (First In, First Out) queue for stored runs, keeping only the 3 most recent sessions.

### 5.2. Network Interruption During Chunked Tailoring Runs
* **The Problem**: If tailoring is chunked by work experiences and the connection drops on chunk 2 of 4, the user's progress is lost and the page hangs.
* **Mitigation**:
  * In the UI, cache partial rewrites in session storage immediately as they return.
  * Implement a **Resume Transaction** state. If the connection fails, show a *"Retry"* button that resumes execution from the last failed experience block rather than restarting from scratch.

### 5.3. Nonsensical Input Verification
* **The Problem**: A user pastes a recipe for chocolate chip cookies into the Job Description field. The LLM attempts to tailor a software engineer resume to match chocolate chip cookies.
* **Mitigation**:
  * Run validation filters before hitting the API:
    * Job description must be at least 30 words.
    * Run a keyword validation check on the parsed JD structure. If `jobTitle` is empty or if technical keywords represent junk strings, intercept the call and return a validation message: *"The job description text does not seem to contain valid job criteria. Please verify your input and try again."*

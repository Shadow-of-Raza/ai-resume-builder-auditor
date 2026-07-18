# Resume Shapeshifter — Architecture & Design Decisions Log (ADR)

This file tracks the key architecture and design decisions made throughout the lifecycle of the project. Developers must update this log with new entries whenever an architectural or implementation decision is finalized in any phase.

---

## 1. Summary of Decisions

| ID | Decision Date | Phase | Status | Title / Summary |
|---|---|---|---|---|
| **ADR-001** | 2026-06-11 | Phase 2 | **Accepted** | Next.js and API Serverless Routes Stack |
| **ADR-002** | 2026-06-11 | Phase 2 | **Accepted** | Zod Schema Validation & LLM JSON Mode |
| **ADR-003** | 2026-06-11 | Phase 3 | **Accepted** | Chunked Bullet-by-Bullet Processing |
| **ADR-004** | 2026-06-11 | Phase 4 | **Accepted** | Headless Browser Print-to-PDF Pipeline |
| **ADR-005** | 2026-06-11 | Phase 3 | **Accepted** | Deterministic Truthfulness Guardrail |
| **ADR-006** | 2026-06-11 | Phase 3 | **Accepted** | Dual-Provider LLM Fallback (Gemini to Groq) |
| **ADR-007** | 2026-06-11 | Phase 2 | **Accepted** | Server External Configuration for PDF Parsing |
| **ADR-008** | 2026-06-11 | Phase 2 | **Accepted** | Relaxed Contact Validation Constraints |
| **ADR-009** | 2026-06-11 | Phase 2 | **Accepted** | Array Validation Preprocessing |
| **ADR-010** | 2026-06-11 | Phase 2 | **Accepted** | Zod 4 Schema Descriptor Compatibility |
| **ADR-011** | 2026-06-11 | Phase 3 | **Accepted** | Retry-with-Backoff Dual Provider Resilience |
| **ADR-012** | 2026-06-11 | Phase 2 | **Accepted** | Schema Robustness via Nullable Optional Fields |
| **ADR-013** | 2026-06-11 | Phase 3 | **Accepted** | Circuit Breaker Cooldown for Unhealthy LLM Providers |
| **ADR-014** | 2026-06-11 | Phase 2 | **Accepted** | Permanent Migration to Groq as Sole Primary LLM |

---

## 2. Decision Records

### ADR-001: Next.js and API Serverless Routes Stack
* **Status**: Accepted
* **Context**: The project requires a fast, responsive user interface combined with backend parser and API services. We need to decide whether to separate the frontend (React) and backend (FastAPI/Express) or consolidate them.
* **Decision**: We will build the application as a unified **Next.js (TypeScript)** application using Tailwind CSS and Shadcn UI.
* **Rationale**:
  * Consolidating both tiers into a single workspace keeps local development simple and fast.
  * Node.js supports robust document parsing (`pdf-parse`, `mammoth`) and handles asynchronous API orchestration cleanly.
  * Serverless API routes scale dynamically and minimize hosting setup requirements.

### ADR-002: Zod Schema Validation & LLM JSON Mode
* **Status**: Accepted
* **Context**: Large Language Model outputs are non-deterministic. We need to ensure that the backend receives clean, structured JSON conforming to strict schemas before displaying data or calculating scores.
* **Decision**: We will enforce **JSON Mode** on all LLM requests and validate all outputs using **Zod** schemas immediately upon retrieval on the backend.
* **Rationale**:
  * Ensures type-safety across components (TypeScript types generated directly from Zod schemas).
  * Prevents UI runtime errors from unexpected text prefixes, suffix garbage, or missing object keys.
  * Permits automatic retries or correction loops if schema compliance is violated.

### ADR-003: Chunked Bullet-by-Bullet Processing
* **Status**: Accepted
* **Context**: Sending an entire resume containing multiple employment histories and dozens of bullets to the LLM in a single tailoring prompt can lead to lost contexts, keyword stuffing, truncation, or server timeouts.
* **Decision**: Experience blocks will be processed in isolated sequential chunks (or parallelized API requests) rather than all at once.
* **Rationale**:
  * Keeps context windows small, resulting in higher quality, more target-specific translations.
  * Prevents server timeout constraints by keeping individual LLM calls under 2–3 seconds.
  * Allows the frontend to display incremental loading progress per experience card.

### ADR-004: Headless Browser Print-to-PDF Pipeline
* **Status**: Accepted
* **Context**: Generative HTML-to-PDF libraries (like `html2pdf.js` or standard canvas captures) often produce low-quality blurry text, break page margins unpredictably, or fail to render custom fonts correctly.
* **Decision**: The PDF generation engine will use a backend headless browser (Puppeteer or Playwright) to navigate to clean, print-targeted templates and print to standard A4 PDF files. We will provide `window.print()` as a client-side backup.
* **Rationale**:
  * Headless PDF rendering produces vector-sharp PDF text that is indexable and readable by ATS checkers.
  * Separates document layout styling (which is just CSS/HTML print styles) from server-side generation logic.
  * The native `window.print()` fallback ensures users can still export documents if the headless server fails.

### ADR-005: Deterministic Truthfulness Guardrail
* **Status**: Accepted
* **Context**: Large Language Models, when tasked with resume tailoring, have a tendency to fabricate skills, tools, or exaggerate metrics (e.g., inventing percentages or claiming experience in tools not found in the original resume) to maximize job alignment.
* **Decision**: We implemented a deterministic checking layer inside `/api/tailor` that matches any target job description skill/tool injected by the LLM in the tailored output (skills or experience/project bullets) against the lowercase text of the original resume. Unverified skills are stripped from the tailored skills grid, and unverified tools inside bullets are flagged with risk warnings returned to the frontend.
* **Rationale**:
  - Ensures absolute credibility and truthfulness of the candidate's optimized resume.
  - Prevents automated LLM hallucinations from creating false credentials.
  - Returns clear visual warnings to the candidate about potential "stretches" so they can review and verify before exporting.

### ADR-006: Dual-Provider LLM Fallback (Gemini to Groq)
* **Status**: Accepted
* **Context**: The primary LLM engine is Google Gemini (using the Google AI Studio free tier). Under high traffic or parallel request generation, rate limits (`RESOURCE_EXHAUSTED` / 429 errors) are easily triggered, causing service downtime.
* **Decision**: We implemented an automatic dual-provider fallback system in `src/lib/llm.ts`. If the primary call to Google Gemini's SDK throws a quota or connection exception, the system catches the error, registers a warning, and re-submits the exact completion query to Groq SDK (utilizing `llama-3.3-70b-versatile`).
* **Rationale**:
  - Eliminates single point of failure (SPOF) for generation requests.
  - Provides highly resilient, zero-disruption failover handling transparently to the user.
  - Maximizes the use of free tier credits across multiple providers safely.

### ADR-007: Server External Configuration for PDF Parsing
* **Status**: Accepted
* **Context**: The `pdf-parse` v2.4 package uses the legacy build of `pdfjs-dist`. In Next.js, Webpack/Turbopack tries to bundle these server dependencies into `.next/server/chunks/`. Because `pdfjs-dist` loads its helper worker `pdf.worker.mjs` dynamically using a path relative to `import.meta.url`, it evaluates to the server chunks folder where the worker isn't present, causing a `Setting up fake worker failed` 500 error on document uploads.
* **Decision**: Configure `next.config.ts` to include `pdf-parse` and `pdfjs-dist` inside `serverExternalPackages`.
* **Rationale**:
  - Directs Next.js to treat these as external packages and load them directly from local `node_modules` at runtime.
  - Resolves path evaluation issues, letting `pdfjs-dist` successfully find the worker in the native `node_modules/pdfjs-dist` directory.
  - Avoids bundling bloat and runtime worker loading issues on serverless API routes.

### ADR-008: Relaxed Contact Validation Constraints
* **Status**: Accepted
* **Context**: Strict Zod URL and email validation rules (e.g. `.url()` and `.email()`) on resume contact details caused the parsing parser pipeline to crash at runtime when the LLM extracted incomplete, protocol-less, or atypical patterns (like `"linkedin.com/in/username"` or `"john.doe at email.com"`).
* **Decision**: Relax the Zod email and website validation rules on `ResumeProfileSchema` to generic strings with optional bounds.
* **Rationale**:
  - Eliminates parser crashes on dirty or non-standard resume inputs.
  - Retains raw data structure while shifting verification to downstream formatting rather than breaking the core ingestion wizard.

### ADR-009: Array Validation Preprocessing
* **Status**: Accepted
* **Context**: LLM output formatting is non-deterministic. When asked to return an array of strings (such as `technologies`, `skills`, or `certifications`), models sometimes generate a single comma-separated string (e.g., `"React, Webpack"` instead of `["React", "Webpack"]`), causing Zod array validation to fail.
* **Decision**: Wrap all array-of-string validators in `z.preprocess()`. If a string value is received, the preprocessor splits it by comma, trims whitespace, and filters empty entries before running the standard array validation.
* **Rationale**:
  - Handles parsing variations gracefully without breaking the ingestion thread.
  - Minimizes validation fragility and increases pipeline stability.

### ADR-010: Zod 4 Schema Descriptor Compatibility
* **Status**: Accepted
* **Context**: The project uses Zod v4 (`^4.4.3`), which changed internal schema representation from Zod v3. The `zodToDescriptor` function in `llm.ts` relied on Zod 3's `_def.typeName` property (e.g., `'ZodObject'`, `'ZodArray'`), which no longer exists in Zod 4. Zod 4 uses `_def.type` (lowercase strings like `'object'`, `'array'`) and moves array element schemas to `_def.element` instead of `_def.type`. This caused the descriptor to output a flat `"string"` instead of the full schema structure, confusing the LLM and causing Groq's JSON validator to reject malformed output.
* **Decision**: Rewrite `zodToDescriptor` to be dual-compatible with both Zod 3 and Zod 4, checking `_def.typeName`, `_def.type`, and `schema.type` in priority order.
* **Rationale**:
  - Ensures the correct full JSON schema outline is injected into LLM system prompts regardless of Zod version.
  - Prevents silent degradation where the LLM receives no structural guidance and generates invalid JSON.

### ADR-011: Retry-with-Backoff Dual Provider Resilience
* **Status**: Accepted
* **Context**: Both free-tier LLM providers (Gemini AI Studio and Groq) have aggressive rate limits. Gemini has per-minute token quotas; Groq has a 100k tokens-per-day limit. The original implementation was one-shot-per-provider: if Gemini failed, it tried Groq once and gave up. When both providers hit rate limits simultaneously, the entire pipeline crashed with no recovery path.
* **Decision**: Rewrite `getStructuredCompletion` with a retry loop (up to 3 attempts per provider) with exponential backoff on 429 rate-limit errors. The system extracts the suggested retry delay from the error message (e.g., "retry in 43s") and waits accordingly, capped between 5–60 seconds. If a provider exhausts all retries, it falls back to the next provider. If all providers fail, it surfaces a clear user-facing error.
* **Rationale**:
  - Free-tier rate limits are temporary (seconds to minutes), not permanent — retrying is the correct strategy.
  - Maximizes usage of both free-tier providers without requiring paid upgrades.
  - Eliminates hard crashes from transient quota exhaustion during multi-step pipeline execution.

### ADR-012: Schema Robustness via Nullable Optional Fields
* **Status**: Accepted
* **Context**: LLM parser output often represents missing or empty document sections (e.g. absent phone number, location, GPA, or company fields) as `null` values in JSON. The original Zod schema validators defined these optional fields as `.optional()`, which allows `undefined` but crashes on `null` values.
* **Decision**: Update all optional properties inside `ResumeProfileSchema`, `JobDescriptionProfileSchema`, and sub-schemas to use `.nullable().optional()`.
* **Rationale**:
  - Handles variations in LLM metadata extraction styles gracefully.
  - Resolves parser schema validation crashes on incomplete user documents.

### ADR-013: Circuit Breaker Cooldown for Unhealthy LLM Providers
* **Status**: Accepted
* **Context**: When a user key (e.g. AI Studio Gemini key) is invalid, restricted, or rate-limited to 0, every model request triggers a 429 or 403 error. Waiting for all Gemini models to fail sequentially adds significant latency (8–10 seconds) on every single request, causing the frontend wizard to appear frozen/stuck.
* **Decision**: Implement an in-memory unhealthy provider cache (`Map`) with a 2-minute cooldown. If a provider's model fails once, it is marked unhealthy. Subsequent requests will immediately bypass this provider and route straight to alternative active models (like Groq) without executing failing requests.
* **Rationale**:
  - Reduces multi-step pipeline latencies from 30+ seconds down to under 1.5 seconds under failing/rate-limited keys.
  - Provides instant failover resilience, keeping the user interface extremely fast and responsive.

### ADR-014: Permanent Migration to Groq as Sole Primary LLM
* **Status**: Accepted
* **Context**: The primary Google Gemini API integration suffered from persistent rate limiting, quota blocks, and restricted/invalid credentials in the user environment. Bypassing Gemini to use Groq as the primary engine is preferred to guarantee consistent generation performance and remove dual-provider latency overhead completely.
* **Decision**: Remove Google Gemini SDK integration, imports, and credentials configuration entirely. Establish Groq (`llama-3.3-70b-versatile` and `llama-3.1-8b-instant`) as the permanent sole primary LLM provider.
* **Rationale**:
  - Eliminates startup and parsing latency caused by waiting for failing/rate-limited Gemini models.
  - Streamlines backend code and dependencies, reducing bundle size and API configuration complexity.
  - Groq's high-speed Llama models provide excellent structured output performance matching the MVP scope.




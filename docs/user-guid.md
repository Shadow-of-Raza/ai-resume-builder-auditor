# Resume Shapeshifter — End-User Guide

This document defines the step-by-step user journey and interface guidelines for **Resume Shapeshifter**. This file is a living document and must be updated parllerly at the end of each implementation phase to reflect new screens, interactions, and features.

---

## 1. System Overview

**Resume Shapeshifter** is an interactive web tool that tailors your resume for specific job applications. The system evaluates how well your resume matches a target job description, highlights critical gaps (like missing keywords or skills), and generates a tailored resume rewrite that aligns with the target role while strictly preserving the integrity of your actual experience.

---

## 2. Step-by-Step User Flow

The application follows a linear 4-step wizard interface designed to guide you from input to PDF download:

```
┌───────────────────────┐       ┌───────────────────────┐
│     Step 1: Ingest    │ ────► │   Step 2: Analysis    │
│  Upload Resume & JD   │       │ View Scores & Gaps    │
└───────────────────────┘       └───────────┬───────────┘
                                            │
                                            ▼
┌───────────────────────┐       ┌───────────────────────┐
│     Step 4: Export    │ ◄──── │    Step 3: Review     │
│ Download Tailored PDFs│       │ Approve/Edit Bullets  │
└───────────────────────┘       └───────────────────────┘
```

### Step 1: Input Ingestion (Upload & Paste)
1. **Upload Resume**:
   * Drag and drop your existing resume (PDF or DOCX format) into the upload card, or click to browse files.
   * Alternatively, click the "Paste Raw Text" button to paste your resume content directly into a text area.
2. **Add Job Description**:
   * Paste the text of the job description you are targeting into the designated input field.
   * *Optional*: Paste the job posting link (if the URL crawler feature is enabled) and click "Import".
3. **Trigger Analysis**:
   * Click the **"Analyze Resume"** button. The interface will display a loader animation as the engine parses the inputs.

### Step 2: Analysis Results (Scores & Gaps)
1. **Review Overall Match Score**:
   * Inspect the circular Match Score gauge (0–100%).
   * Read the summary explanation explaining what factors impacted your score.
2. **Examine Score Details**:
   * Review individual score bars: *Skills Coverage*, *Keyword Frequency*, and *Seniority Alignment*.
3. **Inspect Gap Analysis**:
   * Review the list of missing skills or qualifications flagged by the system.
   * Actionable recommendation labels will show:
     * `Add if true`: Suggests including this tool if you have used it.
     * `Address in Interview`: Important JD requirements to prepare to discuss.
4. **Trigger Resume Tailoring**:
   * Click **"Tailor My Resume"** to begin rewriting experience bullets.

### Step 3: Side-by-Side Review & Editing
1. **Interactive Comparison Column**:
   * **Left Column**: Displays your original resume sections and experience bullet points.
   * **Right Column**: Displays the proposed tailored rewrites with changes highlighted (green for added context, red-strikethrough for deleted text).
2. **Verify Change Metadata & Integrity Warnings**:
   * Inspect each rewritten bullet point. The card will show:
     * The reason for the change.
     * Specific JD keywords that were addressed.
     * Confidence rating (High, Medium, Low).
     * **Integrity Warning Alert**: If the tailoring engine detects a technology or skill in the tailored bullet that was not present anywhere in your original profile, it will highlight a warning (e.g., `Warning: Bullet mentions technology/skill [Kubernetes] not found in original profile`). You should check if you have experience with this tech before accepting the bullet.
3. **Take Action on Edits**:
   * Click **[Approve]** to accept the rewrite draft.
   * Click **[Reject]** to discard the rewrite and revert to your original text.
   * Click **[Edit]** to modify the rephrased bullet manually in an inline text area.

### Step 4: Export Documents
1. **Final Preview**:
   * Review the layout of the tailored resume to check for spacing and design constraints.
2. **Download Options**:
   * **Download Tailored Resume PDF**: Generates a clean, modern, single-page or two-page resume optimized for submission.
   * **Download Comparison Proof PDF**: Downloads a landscape PDF document comparing your original and tailored resumes side-by-side (ideal for personal records or coaching reviews).

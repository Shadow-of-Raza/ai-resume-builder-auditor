import { z } from 'zod';

// Preprocessing helper to robustly convert comma-separated string lists from the LLM into proper arrays
const commaSeparatedStringToArray = z.preprocess((val) => {
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return val;
}, z.array(z.string()));

// ==========================================
// 1. Resume Profile Schema
// ==========================================
export const WorkExperienceSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  location: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional().describe("Date or 'Present'"),
  bullets: z.array(z.string()).describe("Chronological list of achievements and duties"),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  bullets: z.array(z.string()),
  technologies: commaSeparatedStringToArray,
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string().nullable().optional(),
  major: z.string().nullable().optional(),
  graduationDate: z.string().nullable().optional(),
  gpa: z.string().nullable().optional(),
});

export const ResumeProfileSchema = z.object({
  contact: z.object({
    fullName: z.string(),
    email: z.string().nullable().optional().or(z.literal('')),
    phone: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    website: z.string().nullable().optional().or(z.literal('')),
  }),
  summary: z.string().nullable().optional().describe("Professional summary paragraph"),
  skills: commaSeparatedStringToArray.describe("List of technical tools, frameworks, and core skills"),
  experience: z.array(WorkExperienceSchema),
  projects: z.array(ProjectSchema).default([]),
  education: z.array(EducationSchema).default([]),
  certifications: commaSeparatedStringToArray.default([]),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

// ==========================================
// 2. Job Description (JD) Profile Schema
// ==========================================
export const JobDescriptionProfileSchema = z.object({
  jobTitle: z.string(),
  company: z.string().nullable().optional().describe("Name of hiring company if visible"),
  requiredSkills: commaSeparatedStringToArray.describe("Core non-negotiable hard skills"),
  preferredSkills: commaSeparatedStringToArray.describe("Bonus / nice-to-have skills"),
  responsibilities: z.array(z.string()).describe("Key duties described in JD"),
  qualifications: z.array(z.string()).describe("Education level or experience years requested"),
  tools: commaSeparatedStringToArray.describe("Specific software, libraries, and hardware platforms"),
  keywords: commaSeparatedStringToArray.describe("Domain-specific terminology found in the text"),
  seniorityLevel: z.preprocess((val) => {
    if (typeof val === 'string') {
      const cleaned = val.trim().toLowerCase();
      if (cleaned.includes('entry')) return 'Entry';
      if (cleaned.includes('mid')) return 'Mid';
      if (cleaned.includes('senior')) return 'Senior';
      if (cleaned.includes('lead')) return 'Lead';
      if (cleaned.includes('exec') || cleaned.includes('director') || cleaned.includes('vp') || cleaned.includes('chief')) return 'Executive';
      
      const seniorityEnum = ["Entry", "Mid", "Senior", "Lead", "Executive", "Unknown"] as const;
      const matched = seniorityEnum.find(e => e.toLowerCase() === cleaned);
      if (matched) return matched;
    }
    return 'Unknown';
  }, z.enum(["Entry", "Mid", "Senior", "Lead", "Executive", "Unknown"])).default('Unknown'),
  domainSignals: commaSeparatedStringToArray.describe("Industry focus keywords (e.g. Fintech, Healthcare)"),
});

export type JobDescriptionProfile = z.infer<typeof JobDescriptionProfileSchema>;

// ==========================================
// 3. Match Score Schema
// ==========================================
export const MatchScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  skillCoverageScore: z.number().min(0).max(100),
  responsibilityAlignmentScore: z.number().min(0).max(100),
  keywordScore: z.number().min(0).max(100),
  seniorityScore: z.number().min(0).max(100),
  criticalMissingRequirements: z.array(z.string()),
  explanation: z.string().describe("A markdown bullet list explaining details for each score category"),
});

export type MatchScore = z.infer<typeof MatchScoreSchema>;

// ==========================================
// 4. Tailored Resume & Rewrite Metadata Schema
// ==========================================
export const RewrittenBulletSchema = z.object({
  original: z.string(),
  tailored: z.string(),
  changeReason: z.string().describe("Explanation of why the bullet was rephrased and how it aligns with the JD"),
  keywordsAddressed: commaSeparatedStringToArray.describe("Specific JD keywords injected into the rephrase"),
  confidence: z.preprocess((val) => {
    if (typeof val === 'string') {
      const cleaned = val.trim().toLowerCase();
      if (cleaned === 'high' || cleaned === 'medium' || cleaned === 'low') {
        return cleaned;
      }
    }
    return 'medium';
  }, z.enum(["high", "medium", "low"])).describe("High if straightforward, Low if context was sparse"),
  riskFlag: z.string().nullable().optional().describe("Warning warning the user if the rephrase potentially stretches their experience"),
});

export const TailoredExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  bullets: z.array(RewrittenBulletSchema),
});

export const TailoredResumeSchema = z.object({
  tailoredSummary: z.string(),
  tailoredSkills: commaSeparatedStringToArray.describe("Skills list, reordered or slightly rephrased based on JD"),
  tailoredExperience: z.array(TailoredExperienceSchema),
  tailoredProjects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    bullets: z.array(RewrittenBulletSchema),
  })).default([]),
});

export type TailoredResume = z.infer<typeof TailoredResumeSchema>;

// ==========================================
// 5. Gap Analysis Schema
// ==========================================
export const ResumeGapSchema = z.object({
  name: z.string().describe("The missing skill or qualification (e.g. 'Kubernetes', '5+ Years in FinTech')"),
  importance: z.preprocess((val) => {
    if (typeof val === 'string') {
      const cleaned = val.trim().toLowerCase();
      if (cleaned === 'high' || cleaned === 'medium' || cleaned === 'low') {
        return cleaned;
      }
    }
    return 'medium';
  }, z.enum(["high", "medium", "low"])),
  jdEvidence: z.string().nullable().optional().describe("Excerpt from the JD referencing this requirement"),
  resumeEvidence: z.string().nullable().optional().describe("How the resume currently addresses this (or 'Not Mentioned')"),
  suggestedAction: z.string().nullable().optional().describe("Actionable instructions for the candidate to address the gap"),
  canSafelyAdd: z.boolean().describe("True if it's a minor tooling item, False if it is a major credential gap"),
});

export const GapAnalysisSchema = z.object({
  gaps: z.array(ResumeGapSchema),
});

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

// ==========================================
// 6. Complete Tailoring Run (Session Store)
// ==========================================
export const TailoringRunSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string(),
  originalResume: ResumeProfileSchema,
  jobDescription: JobDescriptionProfileSchema,
  originalScore: MatchScoreSchema,
  tailoredResume: TailoredResumeSchema.optional(),
  tailoredScore: MatchScoreSchema.optional(),
  gapAnalysis: GapAnalysisSchema,
});

export type TailoringRun = z.infer<typeof TailoringRunSchema>;

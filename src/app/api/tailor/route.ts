import { NextRequest, NextResponse } from 'next/server';
import { getStructuredCompletion } from '../../../lib/llm';
import { 
  experienceBulletRewriterPrompt, 
  summaryAndSkillsRewriterPrompt 
} from '../../../prompts/bullet-rewriter';
import { matchScoringPrompt } from '../../../prompts/match-scoring';
import { 
  TailoredResumeSchema, 
  MatchScoreSchema, 
  ResumeProfileSchema, 
  ResumeProfile
} from '../../../lib/schemas';
import { z } from 'zod';

// Zod schemas for partial outputs
const SummaryAndSkillsOutputSchema = z.object({
  tailoredSummary: z.string(),
  tailoredSkills: z.array(z.string()),
});

const BulletsOutputSchema = z.object({
  bullets: z.array(z.object({
    original: z.string(),
    tailored: z.string(),
    changeReason: z.string(),
    keywordsAddressed: z.array(z.string()),
    confidence: z.enum(["high", "medium", "low"]),
    riskFlag: z.string().nullable().optional(),
  }))
});

// Helper: check if a text contains a technology keyword
function containsTech(fullText: string, tech: string): boolean {
  const escaped = tech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const boundaryBefore = /^[a-zA-Z0-9]/.test(tech) ? '\\b' : '';
  const boundaryAfter = /[a-zA-Z0-9]$/.test(tech) ? '\\b' : '';
  const regex = new RegExp(`${boundaryBefore}${escaped}${boundaryAfter}`, 'i');
  return regex.test(fullText);
}

// Helper: convert tailored resume structure into ResumeProfile structure for scoring
function convertTailoredToResumeProfile(tailored: any, original: ResumeProfile): ResumeProfile {
  return {
    contact: original.contact,
    summary: tailored.tailoredSummary,
    skills: tailored.tailoredSkills,
    experience: tailored.tailoredExperience.map((exp: any, index: number) => {
      const origExp = original.experience[index] || {};
      return {
        company: exp.company,
        title: exp.title,
        location: origExp.location,
        startDate: origExp.startDate,
        endDate: origExp.endDate,
        bullets: exp.bullets.map((b: any) => b.tailored),
      };
    }),
    projects: (tailored.tailoredProjects || []).map((proj: any, index: number) => {
      const origProj = original.projects?.[index] || {};
      return {
        name: proj.name,
        description: proj.description,
        bullets: proj.bullets.map((b: any) => b.tailored),
        technologies: origProj.technologies || [],
      };
    }),
    education: original.education || [],
    certifications: original.certifications || [],
  };
}

export async function POST(request: NextRequest) {
  try {
    const { originalResume, jobDescription } = await request.json();

    if (!originalResume || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing originalResume or jobDescription in request body.' },
        { status: 400 }
      );
    }

    // 1. Gather all technology keywords from the job description for the truthfulness check
    const jdSkills = Array.from(new Set([
      ...(jobDescription.requiredSkills || []),
      ...(jobDescription.preferredSkills || []),
      ...(jobDescription.tools || []),
      ...(jobDescription.keywords || [])
    ].map(s => s.toLowerCase().trim())));

    // Gather all text from original resume for verification
    const originalResumeText = [
      originalResume.summary || '',
      ...(originalResume.skills || []),
      ...(originalResume.experience || []).flatMap((e: any) => [e.company, e.title, ...(e.bullets || [])]),
      ...(originalResume.projects || []).flatMap((p: any) => [p.name, p.description, ...(p.bullets || []), ...(p.technologies || [])]),
      ...(originalResume.education || []).flatMap((ed: any) => [ed.institution, ed.degree, ed.major]),
      ...(originalResume.certifications || []),
    ].join(' ').toLowerCase();

    // Helper to check if a skill is verified in the original resume
    const isSkillVerified = (skill: string): boolean => {
      return containsTech(originalResumeText, skill.toLowerCase().trim());
    };

    // 2. Step 1: Tailor Summary & Skills
    const summaryAndSkillsInput = JSON.stringify({
      resume: originalResume,
      jobDescription: jobDescription
    }, null, 2);

    const tailoredSummaryAndSkills = await getStructuredCompletion(
      summaryAndSkillsInput,
      summaryAndSkillsPromptText(),
      SummaryAndSkillsOutputSchema
    );

    // Guardrail: Filter tailoredSkills to only include verified ones
    const filteredTailoredSkills = tailoredSummaryAndSkills.tailoredSkills.filter(skill => {
      const verified = isSkillVerified(skill);
      if (!verified) {
        console.warn(`Guardrail: Stripped unverified skill '${skill}' from tailored skills list.`);
      }
      return verified;
    });

    // 3. Step 2: Tailor Experience bullets sequentially
    const tailoredExperience: any[] = [];
    for (const exp of originalResume.experience) {
      const expInput = JSON.stringify({
        jobDescription: jobDescription,
        experienceEntry: {
          company: exp.company,
          title: exp.title,
          bullets: exp.bullets
        }
      }, null, 2);

      const result = await getStructuredCompletion(
        expInput,
        experienceBulletRewriterPrompt,
        BulletsOutputSchema
      );

      // Verify each tailored bullet against the original resume
      const verifiedBullets = result.bullets.map(b => {
        const unverifiedInBullet: string[] = [];
        b.keywordsAddressed.forEach(kw => {
          if (!isSkillVerified(kw) && containsTech(b.tailored, kw)) {
            unverifiedInBullet.push(kw);
          }
        });

        let riskFlag = b.riskFlag || null;
        if (unverifiedInBullet.length > 0) {
          const warning = `Warning: Bullet mentions technology/skill [${unverifiedInBullet.join(', ')}] not found in original profile. Verify your experience before submitting.`;
          riskFlag = riskFlag ? `${riskFlag}. ${warning}` : warning;
        }

        return {
          ...b,
          riskFlag
        };
      });

      tailoredExperience.push({
        company: exp.company,
        title: exp.title,
        bullets: verifiedBullets
      });
    }

    // Step 3: Tailor Projects bullets sequentially (if any)
    const tailoredProjects: any[] = [];
    for (const proj of (originalResume.projects || [])) {
      const projInput = JSON.stringify({
        jobDescription: jobDescription,
        experienceEntry: {
          company: 'Personal Project',
          title: proj.name,
          bullets: proj.bullets
        }
      }, null, 2);

      const result = await getStructuredCompletion(
        projInput,
        experienceBulletRewriterPrompt,
        BulletsOutputSchema
      );

      // Verify each tailored bullet
      const verifiedBullets = result.bullets.map(b => {
        const unverifiedInBullet: string[] = [];
        b.keywordsAddressed.forEach(kw => {
          if (!isSkillVerified(kw) && containsTech(b.tailored, kw)) {
            unverifiedInBullet.push(kw);
          }
        });

        let riskFlag = b.riskFlag || null;
        if (unverifiedInBullet.length > 0) {
          const warning = `Warning: Bullet mentions technology/skill [${unverifiedInBullet.join(', ')}] not found in original profile. Verify your experience before submitting.`;
          riskFlag = riskFlag ? `${riskFlag}. ${warning}` : warning;
        }

        return {
          ...b,
          riskFlag
        };
      });

      tailoredProjects.push({
        name: proj.name,
        description: proj.description,
        bullets: verifiedBullets
      });
    }

    // 4. Construct the complete TailoredResume object
    const tailoredResume = {
      tailoredSummary: tailoredSummaryAndSkills.tailoredSummary,
      tailoredSkills: filteredTailoredSkills,
      tailoredExperience,
      tailoredProjects
    };

    // Validate the generated tailoredResume using our Zod schema
    const validatedTailoredResume = TailoredResumeSchema.parse(tailoredResume);

    // 5. Calculate the Tailored Resume Match Score
    const tailoredProfileForScore = convertTailoredToResumeProfile(validatedTailoredResume, originalResume);
    const scoreInput = JSON.stringify({
      resume: tailoredProfileForScore,
      jobDescription: jobDescription
    }, null, 2);

    const tailoredScore = await getStructuredCompletion(
      scoreInput,
      matchScoringPrompt,
      MatchScoreSchema
    );

    return NextResponse.json({
      tailoredResume: validatedTailoredResume,
      tailoredScore
    });
  } catch (err: any) {
    console.error('Error in /api/tailor:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to tailor resume.' },
      { status: 500 }
    );
  }
}

// Wrapper function to return the summary & skills prompt to avoid compile ordering issues
function summaryAndSkillsPromptText(): string {
  return summaryAndSkillsRewriterPrompt;
}

export const dynamic = 'force-dynamic';

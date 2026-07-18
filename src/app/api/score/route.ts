import { NextRequest, NextResponse } from 'next/server';
import { getStructuredCompletion } from '../../../lib/llm';
import { matchScoringPrompt } from '../../../prompts/match-scoring';
import { gapAnalysisPrompt } from '../../../prompts/gap-analysis';
import { MatchScoreSchema, GapAnalysisSchema } from '../../../lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const { originalResume, jobDescription } = await request.json();

    if (!originalResume || !jobDescription) {
      return NextResponse.json(
        { error: 'Missing originalResume or jobDescription in request body.' },
        { status: 400 }
      );
    }

    const promptInput = JSON.stringify({
      resume: originalResume,
      jobDescription: jobDescription
    }, null, 2);

    // Call LLM for scoring and gap analysis in parallel
    const [originalScore, gapAnalysis] = await Promise.all([
      getStructuredCompletion(
        promptInput,
        matchScoringPrompt,
        MatchScoreSchema
      ),
      getStructuredCompletion(
        promptInput,
        gapAnalysisPrompt,
        GapAnalysisSchema
      )
    ]);

    return NextResponse.json({
      originalScore,
      gapAnalysis
    });
  } catch (err: any) {
    console.error('Error in /api/score:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to analyze match and identify gaps.' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

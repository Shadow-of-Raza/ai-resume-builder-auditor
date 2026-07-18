import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { getStructuredCompletion } from '../../../lib/llm';
import { resumeParserPrompt } from '../../../prompts/resume-parser';
import { ResumeProfileSchema } from '../../../lib/schemas';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawText = formData.get('text') as string | null;

    let textToParse = '';

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (file.name.endsWith('.pdf')) {
        const parser = new PDFParse({ data: new Uint8Array(buffer) });
        const data = await parser.getText();
        textToParse = data.text;
      } else if (file.name.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        textToParse = result.value;
      } else {
        textToParse = buffer.toString('utf-8');
      }
    } else if (rawText) {
      textToParse = rawText;
    } else {
      return NextResponse.json(
        { error: 'No resume file or raw text provided.' },
        { status: 400 }
      );
    }

    if (!textToParse.trim()) {
      return NextResponse.json(
        { error: 'Extracted resume text is empty.' },
        { status: 400 }
      );
    }

    // Call LLM parsing service using schemas
    const structuredResume = await getStructuredCompletion(
      textToParse,
      resumeParserPrompt,
      ResumeProfileSchema
    );

    return NextResponse.json(structuredResume);
  } catch (err: any) {
    console.error('Error in /api/parse-resume:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to parse resume.' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';

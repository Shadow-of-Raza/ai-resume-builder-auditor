import { NextRequest, NextResponse } from 'next/server';
import { getStructuredCompletion } from '../../../lib/llm';
import { jdExtractionPrompt } from '../../../prompts/jd-extraction';
import { JobDescriptionProfileSchema } from '../../../lib/schemas';

function stripHtml(html: string): string {
  let text = html;
  // Strip head, script, and style blocks completely
  text = text.replace(/<head[^>]*>([\s\S]*?)<\/head>/gi, '');
  text = text.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
  text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  // Collapse whitespace
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const { text, url } = await request.json();

    let textToParse = '';

    if (url) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
          },
          next: { revalidate: 0 }
        });

        if (!response.ok) {
          throw new Error(`Hiring board page returned HTTP status ${response.status}`);
        }

        const html = await response.text();
        textToParse = stripHtml(html);

        if (textToParse.length < 100) {
          throw new Error('Scraped text is too short. The site may be protected by anti-bot measures.');
        }
      } catch (err: any) {
        console.error('Scraping Failed:', err);
        return NextResponse.json(
          { error: `Could not crawl job URL: ${err?.message || err}. Please copy and paste the job description text directly instead.` },
          { status: 422 }
        );
      }
    } else if (text) {
      textToParse = text;
    } else {
      return NextResponse.json(
        { error: 'No job description text or URL provided.' },
        { status: 400 }
      );
    }

    if (!textToParse.trim()) {
      return NextResponse.json(
        { error: 'Job description content is empty.' },
        { status: 400 }
      );
    }

    // Call LLM structured extraction service
    const structuredJD = await getStructuredCompletion(
      textToParse,
      jdExtractionPrompt,
      JobDescriptionProfileSchema
    );

    return NextResponse.json(structuredJD);
  } catch (err: any) {
    console.error('Error in /api/analyze-jd:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to extract job description.' },
      { status: 500 }
    );
  }
}
export const dynamic = 'force-dynamic';

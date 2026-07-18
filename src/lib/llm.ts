import { z } from 'zod';
import Groq from 'groq-sdk';

// Convert Zod schema into a readable outline descriptor for the LLM (compatible with Zod 3 and Zod 4)
function zodToDescriptor(schema: any): any {
  if (!schema) return 'any';
  
  let type = '';
  if (schema._def) {
    type = schema._def.typeName || schema._def.type || '';
  }
  if (!type && schema.type) {
    type = schema.type;
  }
  
  const lowerType = type.toLowerCase();
  
  if (lowerType === 'zodobject' || lowerType === 'object') {
    const shape = schema.shape || schema._def?.shape || schema.def?.shape;
    const desc: any = {};
    if (shape) {
      for (const key in shape) {
        desc[key] = zodToDescriptor(shape[key]);
      }
    }
    return desc;
  }
  
  if (lowerType === 'zodarray' || lowerType === 'array') {
    // In Zod 4, element schema is in _def.element. In Zod 3, it is in _def.type.
    let innerType = schema._def?.element || schema.def?.element || schema.element;
    if (!innerType) {
      const typeProp = schema._def?.type;
      if (typeProp && typeof typeProp !== 'string') {
        innerType = typeProp;
      }
    }
    return [zodToDescriptor(innerType)];
  }
  
  if (lowerType === 'zodstring' || lowerType === 'string') {
    return 'string';
  }
  
  if (lowerType === 'zodnumber' || lowerType === 'number') {
    return 'number';
  }
  
  if (lowerType === 'zodboolean' || lowerType === 'boolean') {
    return 'boolean';
  }
  
  if (lowerType === 'zodenum' || lowerType === 'enum') {
    const values = schema._def?.values || schema.def?.values || [];
    return `enum(${values.join(' | ')})`;
  }
  
  if (lowerType === 'zodoptional' || lowerType === 'optional' ||
      lowerType === 'zodnullable' || lowerType === 'nullable' ||
      lowerType === 'zoddefault' || lowerType === 'default') {
    const innerType = schema._def?.innerType || schema.def?.innerType;
    return zodToDescriptor(innerType);
  }
  
  if (lowerType === 'zodeffects' || lowerType === 'effects' ||
      lowerType === 'preprocess' || lowerType === 'transform' ||
      lowerType === 'pipe') {
    const innerType = schema._def?.schema || schema._def?.out || schema.def?.out || schema._def?.in || schema.def?.in;
    return zodToDescriptor(innerType);
  }
  
  return 'string';
}

// Clean JSON response helper to strip markdown code fences if present
export function cleanJsonString(raw: string): string {
  let clean = raw.trim();
  // Remove markdown code fences if present
  clean = clean.replace(/^```json\s*/i, '');
  clean = clean.replace(/^```\s*/, '');
  clean = clean.replace(/\s*```$/, '');
  return clean.trim();
}

// Circuit Breaker: In-memory registry to temporarily track failed or rate-limited models
const unhealthyProviders = new Map<string, number>();
const UNHEALTHY_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes cooldown

function markProviderUnhealthy(name: string) {
  console.warn(`[LLM] Marking ${name} as unhealthy/offline for 2 minutes.`);
  unhealthyProviders.set(name, Date.now() + UNHEALTHY_COOLDOWN_MS);
}

function isProviderHealthy(name: string): boolean {
  const expiry = unhealthyProviders.get(name);
  if (expiry) {
    if (Date.now() > expiry) {
      unhealthyProviders.delete(name);
      return true;
    }
    return false;
  }
  return true;
}

export async function getStructuredCompletion<T>(
  prompt: string,
  systemPrompt: string,
  schema: z.ZodType<T>
): Promise<T> {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    throw new Error('No API key found. Please configure GROQ_API_KEY in environment variables.');
  }

  const descriptor = zodToDescriptor(schema);
  const enhancedSystemPrompt = `${systemPrompt}\n\nCRITICAL: You must return a JSON object that matches this schema structure:\n${JSON.stringify(descriptor, null, 2)}`;

  const MAX_RETRIES = 3;
  const INITIAL_BACKOFF_MS = 5000; // 5 seconds

  // Helper: check if an error is a rate limit (429) error
  function isRateLimitError(err: any): boolean {
    if (err?.status === 429) return true;
    const msg = (err?.message || '').toLowerCase();
    return msg.includes('429') || msg.includes('rate limit') || msg.includes('resource_exhausted') || msg.includes('quota');
  }

  // Helper: extract retry delay from error message (e.g. "retry in 43s")
  function extractRetryDelay(err: any): number {
    const msg = err?.message || '';
    // Match patterns like "retry in 43.8s", "11m5.28s", "retryDelay: 43s"
    const secondsMatch = msg.match(/retry\s*(?:in|delay[\":]?\s*[\":]?)\s*(\d+(?:\.\d+)?)\s*s/i);
    if (secondsMatch) {
      return Math.ceil(parseFloat(secondsMatch[1]) * 1000);
    }
    const minutesMatch = msg.match(/(\d+)m(\d+(?:\.\d+)?)\s*s/i);
    if (minutesMatch) {
      return Math.ceil((parseInt(minutesMatch[1]) * 60 + parseFloat(minutesMatch[2])) * 1000);
    }
    return 0;
  }

  // Helper: sleep for a given number of milliseconds
  function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Provider: Groq (tries multiple models — each has separate quota)
  const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];

  async function callGroq(model: string): Promise<string> {
    const groq = new Groq({ apiKey: groqKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: enhancedSystemPrompt },
        { role: 'user', content: prompt }
      ],
      model,
      response_format: { type: 'json_object' }
    });
    const choiceText = chatCompletion.choices[0]?.message?.content;
    if (!choiceText) {
      throw new Error('Empty response received from Groq.');
    }
    return choiceText;
  }

  // Build ordered provider list: each model is its own provider entry
  type Provider = { name: string; call: () => Promise<string> };
  let providers: Provider[] = [];
  
  for (const model of GROQ_MODELS) {
    const name = `Groq/${model}`;
    if (isProviderHealthy(name)) {
      providers.push({ name, call: () => callGroq(model) });
    } else {
      console.log(`[LLM] Skipping ${name} (marked as unhealthy/offline)`);
    }
  }

  // Last resort: if all providers are marked unhealthy/cooling down, try them anyway
  if (providers.length === 0) {
    console.warn('[LLM] All models are currently marked unhealthy/cooling down. Retrying all models as last resort.');
    for (const model of GROQ_MODELS) {
      const name = `Groq/${model}`;
      providers.push({ name, call: () => callGroq(model) });
    }
  }

  let jsonText = '';
  let lastError: any = null;

  // Try each provider/model with retries
  for (const provider of providers) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`[LLM] Calling ${provider.name} (attempt ${attempt + 1}/${MAX_RETRIES})...`);
        jsonText = await provider.call();

        // Success — parse and return
        try {
          const cleaned = cleanJsonString(jsonText);
          const parsedObj = JSON.parse(cleaned);
          return schema.parse(parsedObj);
        } catch (parseErr: any) {
          console.error(`[LLM] ${provider.name} returned invalid JSON/schema. Trying next model...`, parseErr?.message);
          lastError = parseErr;
          // Don't retry parse errors on the same model — fall through to next model
          break;
        }
      } catch (err: any) {
        lastError = err;
        markProviderUnhealthy(provider.name);

        if (isRateLimitError(err)) {
          const delay = extractRetryDelay(err);
          const delayWithFallback = delay > 0 ? delay : 5000;
          // Only sleep and retry if the rate limit delay is under 15 seconds
          if (delayWithFallback < 15000) {
            console.warn(`[LLM] ${provider.name} rate limited (429). Waiting ${Math.round(delayWithFallback)}ms before retry...`);
            await sleep(delayWithFallback);
            continue; // retry the same model
          } else {
            console.warn(`[LLM] ${provider.name} rate limited (429) with long delay (${Math.round(delayWithFallback)}ms). Trying next model immediately...`);
            break; // fall back to next model
          }
        } else {
          // Non-rate-limit error — fall through to next provider immediately
          console.warn(`[LLM] ${provider.name} failed:`, err?.message || err);
          break;
        }
      }
    }
  }

  // All providers exhausted
  const errorMsg = lastError?.message || 'Unknown LLM error';
  if (isRateLimitError(lastError)) {
    throw new Error(
      `All LLM models are rate-limited. ` +
      `Please wait a few minutes and try again. Details: ${errorMsg}`
    );
  }
  throw new Error(`LLM completion failed after trying all providers: ${errorMsg}`);
}

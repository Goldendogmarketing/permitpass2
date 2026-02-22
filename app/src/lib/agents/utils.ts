/**
 * Shared utilities for multi-agent pipeline
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Parse JSON from Claude's text output with repair for truncated responses.
 * Extracted from the original route.ts to share across all agents.
 */
export function parseModelJSON(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in model response');
  }

  let jsonStr = jsonMatch[0];

  // Direct parse
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.log('[JSON Repair] Attempting to fix truncated JSON...');

    // Remove trailing incomplete string or key
    jsonStr = jsonStr.replace(/,\s*"[^"]*$/, '');
    jsonStr = jsonStr.replace(/,\s*$/, '');

    // Count unclosed brackets/braces
    let braces = 0;
    let brackets = 0;
    let inString = false;
    let escape = false;

    for (const ch of jsonStr) {
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') braces++;
      if (ch === '}') braces--;
      if (ch === '[') brackets++;
      if (ch === ']') brackets--;
    }

    while (brackets > 0) { jsonStr += ']'; brackets--; }
    while (braces > 0) { jsonStr += '}'; braces--; }

    try {
      return JSON.parse(jsonStr);
    } catch (e2) {
      // Last resort: remove trailing commas before closing brackets
      jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
      try {
        return JSON.parse(jsonStr);
      } catch {
        throw new Error(`JSON repair failed: ${(e2 as Error).message}`);
      }
    }
  }
}

/**
 * Call Claude with a PDF document and a text prompt.
 */
export async function callClaudeWithPdf(params: {
  pdfBase64: string;
  prompt: string;
  maxTokens: number;
  model?: string;
}): Promise<{ parsed: any; rawText: string; usage: { input_tokens: number; output_tokens: number } }> {
  const { pdfBase64, prompt, maxTokens, model = 'claude-sonnet-4-5-20250929' } = params;

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64,
          },
        } as any,
        { type: 'text', text: prompt },
      ],
    }],
  });

  const response = await stream.finalMessage();
  const textBlock = response.content.find((c: any) => c.type === 'text') as any;
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return {
    parsed: parseModelJSON(textBlock.text),
    rawText: textBlock.text,
    usage: {
      input_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
    },
  };
}

/**
 * Call Claude with text-only prompt (no PDF).
 */
export async function callClaudeTextOnly(params: {
  prompt: string;
  maxTokens: number;
  model?: string;
}): Promise<{ parsed: any; rawText: string; usage: { input_tokens: number; output_tokens: number } }> {
  const { prompt, maxTokens, model = 'claude-sonnet-4-5-20250929' } = params;

  const stream = anthropic.messages.stream({
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });

  const response = await stream.finalMessage();
  const textBlock = response.content.find((c: any) => c.type === 'text') as any;
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  return {
    parsed: parseModelJSON(textBlock.text),
    rawText: textBlock.text,
    usage: {
      input_tokens: response.usage?.input_tokens || 0,
      output_tokens: response.usage?.output_tokens || 0,
    },
  };
}

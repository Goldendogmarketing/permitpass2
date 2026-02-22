/**
 * Sub-Agent Prompt Templates — builds focused prompts
 * with only the checks assigned to each sub-agent.
 */

import type { SubAgentTask } from './types';

export function getSubAgentPrompt(task: SubAgentTask): string {
  const checksText = task.checks
    .map((c) => {
      let entry = `- [${c.id}] ${c.desc} (${c.code})`;
      if (c.specificCriteria?.length) {
        entry += '\n    Pass/fail criteria:';
        entry += c.specificCriteria.map((sc) => `\n    * ${sc}`).join('');
      }
      if (c.commonFailures?.length) {
        entry += '\n    Common failures:';
        entry += c.commonFailures.map((cf) => `\n    ! ${cf}`).join('');
      }
      if (c.countyContext) {
        entry += `\n    County note: ${c.countyContext}`;
      }
      return entry;
    })
    .join('\n\n');

  const pageInfo = task.relevantPages.length > 0
    ? `You are viewing page(s) ${task.relevantPages.join(', ')} extracted from the construction plans. These pages were selected because they contain elements relevant to your assigned checks.`
    : `You are viewing the full construction plans. No specific pages were pre-identified for your checks — scan all pages for relevant information.`;

  return `You are an expert Florida Building Code (FBC) 8th Edition (2023) compliance reviewer specializing in residential plan review for permitting.

${pageInfo}

Your task: analyze ONLY the following FBC compliance checks against what you can see on these plan pages. Read every label, dimension, note, schedule, and callout carefully.

## CHECKS TO EVALUATE

${checksText}

## HOW TO EVALUATE

For each check, determine ONE of these statuses:

**PASS** — The plans clearly show the requirement is met.
- State the specific value, dimension, or detail you found that satisfies the requirement.

**FAIL** — The plans clearly show the requirement is NOT met.
- State what the FBC code requires.
- State what the plans actually show.
- State how to fix it (specific corrective action).

**VERIFY** — Not enough information on these pages to determine compliance.
- State specifically what is missing or needs field verification.
- If another sheet might have this info, say so.

**N/A** — This check does not apply to these plans (e.g., no garage, no gas appliances, no townhouse units, no fireplace).

## RESPONSE FORMAT

Return JSON with this exact structure. Use the category keys that match the checks assigned to you:
{
  "categories": [
    {
      "category": "<category_key>",
      "name": "<category display name>",
      "codeReference": "<primary code reference>",
      "overallStatus": "PASS|FAIL|VERIFY|N/A",
      "checks": [
        {
          "id": "<check id e.g. FND-01>",
          "description": "<check description>",
          "codeReference": "<code reference>",
          "status": "PASS|FAIL|VERIFY|N/A",
          "finding": "<concise finding — one sentence with specific measurements/details. If FAIL, include the fix.>"
        }
      ]
    }
  ]
}

## RULES
- Include EVERY check listed above — do not skip any.
- Reference specific measurements, dimensions, or details from the plans.
- When FAIL: the finding MUST include what the code requires, what the plans show, AND the fix.
- When VERIFY: state exactly what information is missing.
- overallStatus per category: FAIL if any check fails, VERIFY if any needs verification (and none fail), PASS if all pass, N/A if all N/A.
- Read ALL text: title blocks, general notes, schedules, legends, callouts, details.
- Return valid JSON only.`;
}

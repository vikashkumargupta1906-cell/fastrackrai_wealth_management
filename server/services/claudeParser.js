const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const expectedSchema = {
  households: [
    {
      name: "String (Required. Make a logical guess if missing, e.g., 'The [Last Name] Household')",
      annualIncome: "Number or null",
      netWorth: "Number or null",
      liquidNetWorth: "Number or null",
      expenseRange: "String or null",
      taxBracket: "String or null",
      riskTolerance: "String or null",
      timeHorizon: "String or null",
      audioNotes: "String or null",
      members: [
        {
          firstName: "String (Required)",
          lastName: "String (Required)",
          dob: "String YYYY-MM-DD format or null",
          email: "String or null",
          phone: "String or null",
          relationship: "String or null (e.g., Primary, Spouse, Child)",
          street: "String or null",
          city: "String or null",
          state: "String or null",
          zip: "String or null"
        }
      ],
      accounts: [
        {
          accountNumber: "String or null",
          custodian: "String or null",
          accountType: "String or null",
          value: "Number (default 0.00)",
          ownershipPercent: "Number (default 100.00)"
        }
      ],
      bankDetails: [
        {
          bankName: "String or null",
          accountNumber: "Number or null",
          routingNumber: "Number or null"
        }
      ]
    }
  ]
};

const systemPrompt = `
  You are an expert financial data extraction system.
  Your job is to take raw, messy JSON parsed from an Excel file uploaded by a wealth manager,
  and map it perfectly to a strictly typed database schema.

  Rules:
  1. Output ONLY valid JSON. No markdown, no explanations, no code fences, no preamble.
  2. Follow the exact keys and nesting structure provided in the Expected Schema.
  3. Make logical inferences (e.g., if a column is "Wife's Name", map it to a Member with relationship "Spouse").
  4. Group members, accounts, and bank details under the correct Household based on the data provided.
  5. Use ONLY double quotes for all JSON keys and string values.
  6. Do NOT include trailing commas anywhere in the JSON.
  7. Ensure the JSON is complete and all brackets/braces are properly closed.
  8. Never truncate the output — always return complete, valid JSON.
`;

// ─── Main Export ───────────────────────────────────────────────────────────────

const standardizeExcelWithClaude = async (rawExcelJson) => {
  const rows = Array.isArray(rawExcelJson) ? rawExcelJson : [rawExcelJson];
  const CHUNK_SIZE = 20;
  const chunks = chunkArray(rows, CHUNK_SIZE);

  console.log(`Processing ${rows.length} rows in ${chunks.length} chunk(s) of up to ${CHUNK_SIZE} rows each.`);

  const allHouseholds = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
    const result = await processChunk(chunks[i], i + 1, chunks.length);
    if (result?.households?.length) {
      allHouseholds.push(...result.households);
    }
  }

  const merged = mergeHouseholds(allHouseholds);
  console.log(`Done. Total households extracted: ${merged.length}`);
  return { households: merged };
};

// ─── Process a Single Chunk ────────────────────────────────────────────────────

const processChunk = async (chunkRows, chunkIndex, totalChunks) => {
  const userPrompt = `
    Here is the Expected Schema:
    ${JSON.stringify(expectedSchema, null, 2)}

    Here is the Raw Excel Data (chunk ${chunkIndex} of ${totalChunks}):
    ${JSON.stringify(chunkRows)}

    IMPORTANT:
    - Return ONLY a valid, complete JSON object matching the schema.
    - No text before or after the JSON.
    - All brackets and braces must be properly closed.
  `;

  let response;

  try {
    response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8192,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    });
  } catch (apiError) {
    console.error(`Claude API call failed for chunk ${chunkIndex}:`, apiError);
    throw new Error(`Claude API error on chunk ${chunkIndex}: ${apiError.message}`);
  }

  // ── Guard: validate response structure ──
  console.log(`Chunk ${chunkIndex} raw response:`, JSON.stringify({
    id: response?.id,
    stop_reason: response?.stop_reason,
    content_length: response?.content?.length,
    usage: response?.usage,
  }, null, 2));

  if (!response) {
    throw new Error(`Chunk ${chunkIndex}: Claude returned no response.`);
  }

  if (!response.content) {
    throw new Error(`Chunk ${chunkIndex}: Claude response missing 'content'. Full response: ${JSON.stringify(response)}`);
  }

  if (!Array.isArray(response.content) || response.content.length === 0) {
    throw new Error(`Chunk ${chunkIndex}: Claude 'content' is empty or not an array. content: ${JSON.stringify(response.content)}`);
  }

  const firstBlock = response.content[0];

  if (!firstBlock) {
    throw new Error(`Chunk ${chunkIndex}: First content block is undefined.`);
  }

  if (firstBlock.type !== 'text') {
    throw new Error(`Chunk ${chunkIndex}: Expected content type 'text' but got '${firstBlock.type}'. Block: ${JSON.stringify(firstBlock)}`);
  }

  if (!firstBlock.text || firstBlock.text.trim() === '') {
    throw new Error(`Chunk ${chunkIndex}: Claude returned an empty text response.`);
  }

  // ── Warn if output was cut off ──
  if (response.stop_reason === 'max_tokens') {
    console.warn(`⚠️  Chunk ${chunkIndex} hit max_tokens — output may be truncated. Reduce CHUNK_SIZE.`);
  }

  const rawText = firstBlock.text;
  return parseClaudeJson(rawText, chunkIndex);
};

// ─── Merge Duplicate Households ────────────────────────────────────────────────

const mergeHouseholds = (households) => {
  const map = new Map();

  for (const household of households) {
    const key = household.name?.trim().toLowerCase() || `household_${map.size}`;

    if (map.has(key)) {
      const existing = map.get(key);

      existing.members = mergeByKey(
        existing.members || [],
        household.members || [],
        (m) => `${m.firstName}_${m.lastName}`.toLowerCase()
      );
      existing.accounts = mergeByKey(
        existing.accounts || [],
        household.accounts || [],
        (a) => a.accountNumber || Math.random()
      );
      existing.bankDetails = mergeByKey(
        existing.bankDetails || [],
        household.bankDetails || [],
        (b) => b.accountNumber || Math.random()
      );

      for (const field of ['annualIncome', 'netWorth', 'liquidNetWorth', 'expenseRange', 'taxBracket', 'riskTolerance', 'timeHorizon']) {
        if (existing[field] == null && household[field] != null) {
          existing[field] = household[field];
        }
      }
    } else {
      map.set(key, { ...household });
    }
  }

  return Array.from(map.values());
};

const mergeByKey = (existing, incoming, keyFn) => {
  const seen = new Set(existing.map(keyFn));
  return [...existing, ...incoming.filter((item) => !seen.has(keyFn(item)))];
};

// ─── JSON Parsing with Fallbacks ───────────────────────────────────────────────

const parseClaudeJson = (rawText, chunkIndex = '?') => {
  // Step 1: Strip markdown code fences
  let cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // Step 2: Direct parse
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Step 3: Extract JSON object/array via regex
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (_) {}
  }

  // Step 4: Fix common formatting issues
  try {
    const fixed = cleaned
      .replace(/,\s*}/g, '}')
      .replace(/,\s*\]/g, ']')
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      .replace(/(['"])?([a-zA-Z_][a-zA-Z0-9_]*)(['"])?\s*:/g, '"$2":');
    return JSON.parse(fixed);
  } catch (_) {}

  // Step 5: Recover truncated JSON
  try {
    const recovered = recoverTruncatedJson(cleaned);
    return JSON.parse(recovered);
  } catch (_) {}

  console.error(`Chunk ${chunkIndex} — all parse attempts failed. First 500 chars:\n`, rawText.substring(0, 500));
  throw new Error(`Failed to parse Claude response for chunk ${chunkIndex}`);
};

const recoverTruncatedJson = (text) => {
  const stack = [];
  let inString = false;
  let escape = false;

  for (const char of text) {
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '{') stack.push('}');
    else if (char === '[') stack.push(']');
    else if (char === '}' || char === ']') stack.pop();
  }

  return text.trimEnd().replace(/,\s*$/, '') + stack.reverse().join('');
};

// ─── Utility ───────────────────────────────────────────────────────────────────

const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

module.exports = { standardizeExcelWithClaude };

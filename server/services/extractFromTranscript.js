const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for Claude
const SYSTEM_PROMPT = `You are a financial data extraction assistant. Your task is to analyze audio transcripts and extract structured financial information.

IMPORTANT: You must respond with ONLY valid JSON. No additional text, explanations, or formatting outside the JSON object.

Extract the following information from the transcript:

1. householdName - The primary household/family name mentioned
2. updates - Object containing any of these fields if mentioned:
   - income: annual income information
   - netWorth: net worth figures
   - goals: financial goals mentioned
   - preferences: investment preferences or risk tolerance
   - corrections: any corrections to previous data
3. memberUpdates - Array of member objects with:
   - name: member's full name
   - field: what information was updated (e.g., "email", "phone", "relationship")
   - value: the new value
4. newAccounts - Array of new account objects with:
   - type: account type (e.g., "IRA", "401k", "Checking", "Savings")
   - custodian: financial institution
   - value: account value/balance
   - ownership: ownership percentage

If a field is not mentioned in the transcript, omit it from the JSON. Do not include null or empty values.

Example response format:
{
  "householdName": "Smith Family",
  "updates": {
    "income": "$150,000 annually",
    "netWorth": "$2.5 million",
    "goals": "Retirement in 10 years",
    "preferences": "Moderate risk tolerance"
  },
  "memberUpdates": [
    {
      "name": "John Smith",
      "field": "email",
      "value": "john.smith@email.com"
    }
  ],
  "newAccounts": [
    {
      "type": "IRA",
      "custodian": "Vanguard",
      "value": "$500,000",
      "ownership": "100%"
    }
  ]
}`;

/**
 * Extract structured data from transcript using Claude
 * @param {string} transcript - Raw transcript text
 * @returns {Promise<Object>} - Extracted structured data
 */
const extractFromTranscript = async (transcript) => {
  try {
    if (!transcript || typeof transcript !== 'string') {
      throw new Error('Invalid transcript provided');
    }

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please extract the financial information from this transcript:\n\n${transcript}`
        }
      ]
    });

    // Get the response content
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format from Claude');
    }

    // Parse JSON response
    let extractedData;
    try {
      // Clean up the response to ensure it's valid JSON
      let jsonText = content.text.trim();
      
      // Remove any potential markdown code blocks
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/, '').replace(/```\n?$/, '');
      }
      
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', content.text);
      throw new Error('Failed to parse Claude response as valid JSON');
    }

    // Validate the extracted data structure
    const validatedData = {
      householdName: extractedData.householdName || null,
      updates: extractedData.updates || {},
      memberUpdates: Array.isArray(extractedData.memberUpdates) ? extractedData.memberUpdates : [],
      newAccounts: Array.isArray(extractedData.newAccounts) ? extractedData.newAccounts : []
    };

    return {
      success: true,
      data: validatedData,
      rawResponse: content.text
    };

  } catch (error) {
    console.error('Claude extraction error:', error);
    
    // Handle specific Anthropic errors
    if (error.status === 401) {
      throw new Error('Invalid Anthropic API key. Please check your environment variables.');
    } else if (error.status === 429) {
      throw new Error('Anthropic API rate limit exceeded. Please try again later.');
    } else if (error.status === 400) {
      throw new Error(`Invalid request to Anthropic API: ${error.message}`);
    } else {
      throw new Error(`Extraction failed: ${error.message}`);
    }
  }
};

/**
 * Extract data with additional metadata
 * @param {string} transcript - Raw transcript text
 * @param {string} fileName - Original audio filename
 * @returns {Promise<Object>} - Extracted data with metadata
 */
const extractFromTranscriptWithMetadata = async (transcript, fileName) => {
  try {
    const result = await extractFromTranscript(transcript);
    
    return {
      ...result,
      fileName,
      timestamp: new Date().toISOString(),
      model: 'claude-3-sonnet-20240229'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fileName,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  extractFromTranscript,
  extractFromTranscriptWithMetadata
};

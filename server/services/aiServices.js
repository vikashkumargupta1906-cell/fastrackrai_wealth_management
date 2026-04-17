const fs = require('fs');
const { OpenAI, toFile } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 1. Transcribe the audio using Whisper
const transcribeAudio = async (audioBuffer, filename) => {
  try {
    // Convert the memory buffer into a File object that OpenAI can read
    const file = await toFile(audioBuffer, filename || 'audio.mp3');

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });
    return transcription.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio file.");
  }
};

// 2. Enrich the existing data using Claude
const enrichHouseholdData = async (currentDbData, transcript) => {
  const systemPrompt = `
    You are an expert wealth management AI assistant. 
    Your goal is to update a client's financial database record based on a recent conversation transcript.
    
    Rules:
    1. The transcript contains the most recent and accurate information. If it conflicts with the current database, the transcript wins.
    2. Incorporate all new details (goals, missing data, corrections) into the existing data structure.
    3. Make logical inferences (e.g., if a client mentions opening a new "Chase checking", add it to bankDetails).
    4. Write a brief summary of the conversation's key updates and store it in the "audioNotes" field of the household.
    5. Output ONLY valid JSON matching the exact schema of the provided Current Database State. Do not drop any existing data unless the transcript explicitly invalidates it.
  `;

  const userPrompt = `
    CURRENT DATABASE STATE:
    ${JSON.stringify(currentDbData, null, 2)}

    NEW CONVERSATION TRANSCRIPT:
    "${transcript}"

    Return the updated JSON object.
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    temperature: 0, 
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });

  let responseText = response.content[0].text.trim();
  if (responseText.startsWith("```json")) {
    responseText = responseText.replace(/^```json\n/, "").replace(/\n```$/, "");
  }

  return JSON.parse(responseText);
};


const identifyHouseholdFromTranscript = async (transcript) => {
  const systemPrompt = `
    You are an assistant routing audio files for a wealth manager.
    Read the following transcript and identify the client being discussed.
    Extract ONLY their last name, as it will be used as a database search query.
    For example, if the transcript mentions "Benjamin Walter", return "Walter". 
    If it mentions "The Smith Family", return "Smith".
    Do not return punctuation, periods, or any other words. Just the core search string.
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5", // Haiku is perfect (and very fast) for a simple extraction
    max_tokens: 50,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: "user", content: transcript }]
  });

  return response.content[0].text.trim();
};

module.exports = { 
  transcribeAudio, 
  enrichHouseholdData, 
  identifyHouseholdFromTranscript // export the new function
};


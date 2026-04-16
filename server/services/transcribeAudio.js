const fs = require('fs');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Transcribe audio file using OpenAI Whisper model
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Raw transcript string
 */
const transcribeAudio = async (filePath) => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Audio file not found');
    }

    // Create file stream for the audio file
    const audioFile = fs.createReadStream(filePath);

    // Call OpenAI Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Optional: specify language
      response_format: 'text', // Get raw text response
    });

    return transcription;

  } catch (error) {
    console.error('Transcription error:', error);
    
    // Handle specific OpenAI errors
    if (error.code === 'insufficient_quota') {
      throw new Error('OpenAI API quota exceeded. Please check your billing.');
    } else if (error.code === 'invalid_api_key') {
      throw new Error('Invalid OpenAI API key. Please check your environment variables.');
    } else if (error.type === 'invalid_request_error') {
      throw new Error(`Invalid request: ${error.message}`);
    } else {
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }
};

/**
 * Transcribe audio file with metadata
 * @param {string} filePath - Path to the audio file
 * @param {string} fileName - Original filename
 * @returns {Promise<Object>} - Transcript with metadata
 */
const transcribeAudioWithMetadata = async (filePath, fileName) => {
  try {
    const transcript = await transcribeAudio(filePath);
    
    return {
      success: true,
      transcript,
      fileName,
      filePath,
      timestamp: new Date().toISOString(),
      model: 'whisper-1'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      fileName,
      filePath
    };
  }
};

module.exports = {
  transcribeAudio,
  transcribeAudioWithMetadata
};

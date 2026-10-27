// FinSync Vernacular AI API Server
// Express server with Gemini AI integration for multilingual financial explanations

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'FinSync Vernacular AI API',
    timestamp: new Date().toISOString()
  });
});

// Main endpoint: Explain financial concepts in vernacular languages
app.post('/api/explain-vernacular', async (req, res) => {
  try {
    // Debug: Log the entire request body
    console.log(`[${new Date().toISOString()}] Received request body:`, req.body);

    const { textQuery, userLanguage } = req.body || {};

    // Validation
    if (!textQuery) {
      console.error('Missing textQuery in request');
      return res.status(400).json({
        error: 'textQuery is required',
        message: 'Please provide a financial question or concept to explain',
        receivedBody: req.body
      });
    }

    if (!userLanguage) {
      console.error('Missing userLanguage in request');
      return res.status(400).json({
        error: 'userLanguage is required',
        message: 'Please provide a language code (e.g., "hi", "kn", "te", "en")',
        receivedBody: req.body
      });
    }

    console.log(`[${new Date().toISOString()}] Processing query in language: ${userLanguage}`);
    console.log(`Query: ${textQuery}`);

    // Map language codes to full names for better context
    const languageMap = {
      'hi': 'Hindi',
      'kn': 'Kannada',
      'te': 'Telugu',
      'ta': 'Tamil',
      'mr': 'Marathi',
      'bn': 'Bengali',
      'en': 'English'
    };

    // Default to Kannada if not specified
    const finalLanguage = userLanguage || 'kn';
    const targetLanguage = languageMap[finalLanguage] || finalLanguage;

    // Initialize Gemini model with dynamic system instruction
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-09-2025',
      systemInstruction: 'You are a highly empathetic financial assistant. Explain the financial concept in ' + targetLanguage + ' (language code: ' + finalLanguage + '). Use a simple, culturally relevant analogy for a speaker from Karnataka/India. Respond ONLY with the purified analogy text in ' + targetLanguage + '.'
    });

    // Construct the user prompt with Kannada emphasis
    const prompt = `Financial concept/question: "${textQuery}"\n\nExplain this in ${targetLanguage} (${finalLanguage}) using a simple, culturally relevant analogy that an elderly person from rural Karnataka/India would understand. Use everyday examples from Kannada culture, agriculture, or local traditions. For example, explain "credit score" as "ಹಳ್ಳಿಯ ಹಿರಿಯರು ಇಟ್ಟುಕೊಂಡಿರುವ ಖ್ಯಾತಿ ದಾಖಲೆ" (reputation record kept by village elders) in Kannada.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analogy = response.text();

    console.log(`[${new Date().toISOString()}] Successfully generated analogy`);
    console.log(`Response length: ${analogy.length} characters`);

    // Return the analogy
    res.json({
      success: true,
      analogy: analogy.trim(),
      language: targetLanguage,
      languageCode: userLanguage,
      query: textQuery
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing request:`, error);
    
    // Detailed error logging
    if (error.message) {
      console.error('Error message:', error.message);
    }
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }

    res.status(500).json({
      error: 'Failed to generate explanation',
      message: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Legacy endpoint for audio-based queries (backward compatibility)
app.post('/api/explain-voice', async (req, res) => {
  try {
    const { audioBase64, userLanguage } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    if (!userLanguage) {
      return res.status(400).json({ error: 'userLanguage is required' });
    }

    const languageMap = {
      'hi': 'Hindi',
      'kn': 'Kannada',
      'te': 'Telugu',
      'ta': 'Tamil',
      'mr': 'Marathi',
      'bn': 'Bengali',
      'en': 'English'
    };

    const targetLanguage = languageMap[userLanguage] || 'English';
    console.log(`[${new Date().toISOString()}] Processing audio for language: ${targetLanguage} (${userLanguage})`);

    // Initialize Gemini model with multimodal support
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-preview-09-2025',
      systemInstruction: 'You are a highly empathetic financial assistant. Explain the financial concept in the language code specified: ' + userLanguage + '. Use a simple, culturally relevant analogy for a speaker from Karnataka/India. Respond ONLY with the purified analogy text.'
    });

    // Dynamic prompt construction based on userLanguage
    const prompt = `The attached audio file contains a financial question. Transcribe the audio, and then explain the concept using a highly simplified, culturally relevant analogy in the exact language specified: ${targetLanguage}. For example, if explaining 'credit score' in Hindi, use an analogy like 'गाँव के बुजुर्ग द्वारा रखा गया प्रतिष्ठा रिकॉर्ड' (a reputation record kept by the village elder). Respond only with the simplified, translated analogy text in ${targetLanguage}.`;

    // Prepare the audio data for Gemini
    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: 'audio/wav'
      }
    };

    // Make the multimodal request
    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const explanation = response.text();

    console.log(`[${new Date().toISOString()}] Successfully processed audio`);

    // Return the purified explanation text
    res.json({
      success: true,
      language: targetLanguage,
      languageCode: userLanguage,
      explanation: explanation.trim()
    });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error processing voice request:`, error);
    res.status(500).json({
      error: 'Failed to process audio',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      'GET /health',
      'POST /api/explain-vernacular',
      'POST /api/explain-voice'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 FinSync Vernacular AI API Server');
  console.log('='.repeat(50));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Main endpoint: POST http://localhost:${PORT}/api/explain-vernacular`);
  console.log(`🎙️ Voice endpoint: POST http://localhost:${PORT}/api/explain-voice`);
  console.log('='.repeat(50));
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  
  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not found in environment variables!');
    console.warn('   Please create a .env file with your API key.');
  } else {
    console.log('✅ Gemini API key loaded successfully');
  }
  
  console.log('='.repeat(50));
});

module.exports = app;


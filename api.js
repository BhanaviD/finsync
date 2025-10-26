// FinSync Vernacular AI API Server
// Express server with Gemini AI integration for multilingual financial explanations
// Enhanced with language detection and TTS support

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

// Map language codes to full names
const languageMap = {
    'hi': 'Hindi',
    'kn': 'Kannada',
    'te': 'Telugu',
    'ta': 'Tamil',
    'mr': 'Marathi',
    'bn': 'Bengali',
    'en': 'English'
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'FinSync Vernacular AI API (Enhanced)',
        timestamp: new Date().toISOString()
    });
});

// Text query endpoint
app.post('/api/explain-vernacular', async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Received request body:`, req.body);

        const { textQuery, userLanguage } = req.body || {};
        
        if (!textQuery) {
            return res.status(400).json({ error: 'textQuery is required' });
        }
        if (!userLanguage) {
            return res.status(400).json({ error: 'userLanguage is required' });
        }

        console.log(`[${new Date().toISOString()}] Processing TEXT query in language: ${userLanguage}`);
        
        const targetLanguage = languageMap[userLanguage] || userLanguage;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            systemInstruction: 'You are a highly empathetic financial assistant. Explain the financial concept in ' + targetLanguage + '. Use a simple, culturally relevant analogy for a speaker from Karnataka/India. Respond ONLY with the purified analogy text in ' + targetLanguage + '.'
        });

        const prompt = `Financial concept/question: "${textQuery}"\n\nExplain this in ${targetLanguage} using a simple, culturally relevant analogy.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analogy = response.text();

        console.log(`[${new Date().toISOString()}] Successfully generated text analogy`);

        res.json({
            success: true,
            analogy: analogy.trim(),
            language: targetLanguage,
            languageCode: userLanguage,
            query: textQuery
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing TEXT request:`, error); 
        res.status(500).json({
            error: 'Failed to generate explanation',
            message: error.message || 'Internal server error',
        });
    }
});

// Voice query endpoint with language detection
app.post('/api/explain-voice', async (req, res) => {
    try {
        const { audioBase64, userLanguage } = req.body;

        if (!audioBase64) {
            return res.status(400).json({ error: 'audioBase64 is required' });
        }
        
        console.log(`[${new Date().toISOString()}] Received audio. Base64 length: ${audioBase64.length}`);
        console.log(`[${new Date().toISOString()}] Processing VOICE query with language detection`);

        // STEP 1: Detect language and transcribe
        const detectModel = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-exp',
            systemInstruction: 'You are a language detection and transcription assistant. Listen to the audio and: 1) Detect the language spoken, 2) Transcribe the exact words spoken in that language. Respond in this EXACT format:\nLANGUAGE: [language name]\nTRANSCRIPTION: [exact transcribed text in original language]'
        });

        const detectPrompt = `Listen to this audio and detect the language spoken, then transcribe the exact words in that original language.`;

        const audioPart = {
            inlineData: {
                data: audioBase64,
                mimeType: 'audio/webm'
            }
        };

        const detectResult = await detectModel.generateContent([detectPrompt, audioPart]);
        const detectResponse = await detectResult.response;
        const detectText = detectResponse.text();

        console.log(`[${new Date().toISOString()}] Detection result:`, detectText);

        // Parse the response
        const languageMatch = detectText.match(/LANGUAGE:\s*(.+)/i);
        const transcriptionMatch = detectText.match(/TRANSCRIPTION:\s*(.+)/i);

        const detectedLanguage = languageMatch ? languageMatch[1].trim() : 'Kannada';
        const transcription = transcriptionMatch ? transcriptionMatch[1].trim() : '';

        console.log(`[${new Date().toISOString()}] Detected language: ${detectedLanguage}`);
        console.log(`[${new Date().toISOString()}] Transcription: ${transcription}`);

        // STEP 2: Generate explanation in the SAME language
        const explainModel = genAI.getGenerativeModel({ 
            model: 'gemini-2.0-flash-exp',
            systemInstruction: `You are a highly empathetic financial assistant. The user asked a question in ${detectedLanguage}. Explain the financial concept using a simple, culturally relevant analogy in the SAME language: ${detectedLanguage}. Respond ONLY with the analogy text in ${detectedLanguage}.`
        });

        const explainPrompt = `The user asked in ${detectedLanguage}: "${transcription}"\n\nExplain this financial concept using a simple, culturally relevant analogy in ${detectedLanguage}.`;

        const explainResult = await explainModel.generateContent(explainPrompt);
        const explainResponse = await explainResult.response;
        const explanation = explainResponse.text();

        console.log(`[${new Date().toISOString()}] Successfully generated explanation in ${detectedLanguage}`);

        res.json({
            success: true,
            detectedLanguage: detectedLanguage,
            transcription: transcription,
            explanation: explanation.trim(),
            audioBase64: null, // Browser TTS will be used on frontend
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing VOICE request:`, error);
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
            'POST /api/explain-vernacular (text)',
            'POST /api/explain-voice (audio)',
        ]
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 FinSync Vernacular AI API Server (Enhanced)');
    console.log('='.repeat(50));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🎯 Endpoints: /api/explain-vernacular, /api/explain-voice`);
    if (!process.env.GEMINI_API_KEY) {
        console.warn('⚠️ WARNING: GEMINI_API_KEY not found in environment variables!');
    } else {
        console.log('✅ GEMINI_API_KEY loaded successfully.');
    }
    console.log('='.repeat(50));
});

module.exports = app;
// FinSync Vernacular AI API Server
// Express server with Gemini AI integration for multilingual financial explanations
// Enhanced with language detection and TTS support

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const textToSpeech = require('@google-cloud/text-to-speech');

// Safety net for a live demo: some Google client libraries (notably
// google-auth-library's ADC metadata-server probe when no credentials are
// configured at all) throw async errors that bypass normal try/catch and
// would otherwise take the whole process down. One bad TTS request should
// never kill the server.
process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught exception (server stays up):', err.message);
});
process.on('unhandledRejection', (err) => {
    console.error('⚠️ Unhandled rejection (server stays up):', err?.message || err);
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Only attempt Cloud TTS if credentials are actually configured — trying it
// without them doesn't just fail cleanly, it can crash the process (see
// note above), so skip straight to the free fallback when unset.
const cloudTtsConfigured = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
let ttsClient = null;
if (cloudTtsConfigured) {
    try {
        ttsClient = new textToSpeech.TextToSpeechClient();
    } catch (err) {
        console.warn('⚠️ Cloud Text-to-Speech client could not be created:', err.message);
    }
}

// Map language codes to full names (for Gemini prompts)
const languageMap = {
    'hi': 'Hindi',
    'kn': 'Kannada',
    'te': 'Telugu',
    'ta': 'Tamil',
    'mr': 'Marathi',
    'bn': 'Bengali',
    'en': 'English'
};

// Map language codes to Cloud TTS locale codes
const ttsLocaleMap = {
    'hi': 'hi-IN',
    'kn': 'kn-IN',
    'te': 'te-IN',
    'ta': 'ta-IN',
    'mr': 'mr-IN',
    'bn': 'bn-IN',
    'en': 'en-IN',
};

// Google Translate's unofficial (no API key, no billing) TTS endpoint. It's
// undocumented and capped at a couple hundred characters per request, so we
// chunk the text at sentence boundaries and stitch the resulting MP3s
// together. Good enough for a hackathon demo; not something to depend on
// for production traffic.
function splitIntoChunks(text, maxLen) {
    const sentences = text.split(/(?<=[।.!?॥])\s+/);
    const chunks = [];
    let current = '';
    for (const sentence of sentences) {
        const candidate = current ? `${current} ${sentence}` : sentence;
        if (candidate.length > maxLen && current) {
            chunks.push(current.trim());
            current = sentence;
        } else {
            current = candidate;
        }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [text.slice(0, maxLen)];
}

async function synthesizeWithGoogleTranslate(text, languageCode) {
    const chunks = splitIntoChunks(text, 180);
    const buffers = [];
    for (const chunk of chunks) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${languageCode}&client=tw-ob`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            },
        });
        if (!response.ok) throw new Error(`Google Translate TTS returned ${response.status}`);
        buffers.push(Buffer.from(await response.arrayBuffer()));
    }
    return Buffer.concat(buffers).toString('base64');
}

// Returns base64 MP3 audio, or null if nothing worked — callers should fall
// back to the browser's own speechSynthesis in that case. Tries Cloud TTS
// first (best quality, needs GOOGLE_APPLICATION_CREDENTIALS), then the free
// Google Translate fallback.
async function synthesizeSpeech(text, languageCode) {
    if (ttsClient) {
        try {
            const [response] = await ttsClient.synthesizeSpeech({
                input: { text },
                voice: { languageCode: ttsLocaleMap[languageCode] || 'en-IN', ssmlGender: 'FEMALE' },
                audioConfig: { audioEncoding: 'MP3' },
            });
            return response.audioContent.toString('base64');
        } catch (err) {
            console.warn(`⚠️ Cloud TTS synthesis failed for ${languageCode}, trying free fallback:`, err.message);
        }
    }

    try {
        return await synthesizeWithGoogleTranslate(text, languageCode);
    } catch (err) {
        console.warn(`⚠️ Fallback TTS failed for ${languageCode}:`, err.message);
        return null;
    }
}

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
            model: 'gemini-3.6-flash',
            systemInstruction: 'You are a highly empathetic financial assistant. Explain the financial concept in ' + targetLanguage + '. Use a simple, culturally relevant analogy for a speaker from Karnataka/India. Respond ONLY with the purified analogy text in ' + targetLanguage + '.'
        });

        const prompt = `Financial concept/question: "${textQuery}"\n\nExplain this in ${targetLanguage} using a simple, culturally relevant analogy.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analogy = response.text().trim();

        console.log(`[${new Date().toISOString()}] Successfully generated text analogy`);

        const audioBase64 = await synthesizeSpeech(analogy, userLanguage);

        res.json({
            success: true,
            analogy,
            audioBase64,
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

// Voice query endpoint. The learner already picked their language on the
// language-picker screen, so we tell Gemini what language the audio is in
// instead of asking it to guess — guessing from a few seconds of audio is
// unreliable for lower-resource languages and can misfire badly (e.g.
// mistaking Kannada for an unrelated language).
app.post('/api/explain-voice', async (req, res) => {
    try {
        const { audioBase64, userLanguage } = req.body;

        if (!audioBase64) {
            return res.status(400).json({ error: 'audioBase64 is required' });
        }
        if (!userLanguage) {
            return res.status(400).json({ error: 'userLanguage is required' });
        }

        const targetLanguage = languageMap[userLanguage] || userLanguage;

        console.log(`[${new Date().toISOString()}] Received audio. Base64 length: ${audioBase64.length}`);
        console.log(`[${new Date().toISOString()}] Processing VOICE query in language: ${targetLanguage}`);

        // STEP 1: Transcribe, told in advance which language to expect.
        const transcribeModel = genAI.getGenerativeModel({
            model: 'gemini-3.6-flash',
            systemInstruction: `You are a transcription assistant. The audio is a financial question spoken in ${targetLanguage}. Transcribe exactly what is said, in ${targetLanguage} script. Respond ONLY with the transcription text, nothing else.`
        });

        const transcribePrompt = `Transcribe this audio. The speaker is speaking in ${targetLanguage}.`;

        const audioPart = {
            inlineData: {
                data: audioBase64,
                mimeType: 'audio/webm'
            }
        };

        const transcribeResult = await transcribeModel.generateContent([transcribePrompt, audioPart]);
        const transcribeResponse = await transcribeResult.response;
        const transcription = transcribeResponse.text().trim();

        console.log(`[${new Date().toISOString()}] Transcription: ${transcription}`);

        // STEP 2: Generate the explanation in that same known language.
        const explainModel = genAI.getGenerativeModel({
            model: 'gemini-3.6-flash',
            systemInstruction: `You are a highly empathetic financial assistant. The user asked a question in ${targetLanguage}. Explain the financial concept using a simple, culturally relevant analogy in ${targetLanguage}. Respond ONLY with the analogy text in ${targetLanguage}.`
        });

        const explainPrompt = `The user asked in ${targetLanguage}: "${transcription}"\n\nExplain this financial concept using a simple, culturally relevant analogy in ${targetLanguage}.`;

        const explainResult = await explainModel.generateContent(explainPrompt);
        const explainResponse = await explainResult.response;
        const explanation = explainResponse.text().trim();

        console.log(`[${new Date().toISOString()}] Successfully generated explanation in ${targetLanguage}`);

        const responseAudioBase64 = await synthesizeSpeech(explanation, userLanguage);

        res.json({
            success: true,
            detectedLanguage: targetLanguage,
            transcription: transcription,
            explanation,
            audioBase64: responseAudioBase64, // null falls back to browser speechSynthesis
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
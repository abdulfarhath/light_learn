const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const storageDir = path.join(__dirname, '../../storage/recordings');

/**
 * Convert audio file to base64 for Gemini API
 */
const audioToBase64 = (filePath) => {
    const audioBuffer = fs.readFileSync(filePath);
    return audioBuffer.toString('base64');
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.webm': 'audio/webm',
        '.mp3': 'audio/mp3',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg',
        '.m4a': 'audio/mp4'
    };
    return mimeTypes[ext] || 'audio/webm';
};

/**
 * Transcribe audio using Gemini's multimodal capabilities
 */
const transcribeAudio = async (sessionId) => {
    const audioPath = path.join(storageDir, `${sessionId}.webm`);
    
    if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
    }

    const fileStats = fs.statSync(audioPath);
    if (fileStats.size < 1000) {
        throw new Error('Audio file is too small or empty');
    }

    if (!genAI) {
        // Return mock transcription if no API key
        return {
            transcription: `[Mock Transcription for session ${sessionId}]\n\nThis is a simulated transcription. Configure GEMINI_API_KEY in .env to enable real transcription.\n\nThe session covered various educational topics discussed during the live class.`,
            success: true,
            mock: true
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        
        const audioBase64 = audioToBase64(audioPath);
        const mimeType = getMimeType(audioPath);

        const prompt = `You are a transcription assistant. Listen to this audio from an educational live session and provide an accurate, detailed transcription. 
        
Instructions:
- Transcribe all spoken words accurately
- Include speaker changes if detectable (mark as "Teacher:" or "Student:")  
- Preserve important pauses with "..."
- Format the transcription with proper paragraphs for readability
- If audio quality is poor in sections, note it as [inaudible]

Provide ONLY the transcription, no additional commentary.`;

        const result = await model.generateContent([
            { text: prompt },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: audioBase64
                }
            }
        ]);

        const response = await result.response;
        const transcription = response.text();

        return {
            transcription,
            success: true,
            mock: false
        };

    } catch (error) {
        console.error("Transcription error:", error.message);
        throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
};

/**
 * Generate summary from transcription using Gemini
 */
const generateSummary = async (transcription) => {
    if (!genAI) {
        return {
            summary: `[Mock Summary]\n\nKey Points:\n• Topic 1 discussed\n• Topic 2 covered\n• Q&A session\n\nConfigure GEMINI_API_KEY for real summaries.`,
            success: true,
            mock: true
        };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `You are an educational content summarizer. Based on this transcription from a live class session, create a concise but comprehensive summary.

Transcription:
${transcription}

Create a summary with:
1. **Session Overview** (2-3 sentences about main topic)
2. **Key Points** (bullet points of main concepts covered)
3. **Important Definitions** (if any technical terms were explained)
4. **Action Items** (any homework, assignments, or follow-up mentioned)

Keep the summary clear and student-friendly.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        return {
            summary,
            success: true,
            mock: false
        };

    } catch (error) {
        console.error("Summary generation error:", error.message);
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
};

/**
 * Process session: transcribe and summarize
 */
const processSession = async (sessionId) => {
    console.log(`Processing session: ${sessionId}`);
    
    // Step 1: Transcribe audio
    const transcriptionResult = await transcribeAudio(sessionId);
    
    // Step 2: Generate summary
    const summaryResult = await generateSummary(transcriptionResult.transcription);
    
    // Step 3: Save results to files
    const outputDir = path.join(storageDir, 'processed');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const transcriptionPath = path.join(outputDir, `${sessionId}_transcription.txt`);
    const summaryPath = path.join(outputDir, `${sessionId}_summary.txt`);

    fs.writeFileSync(transcriptionPath, transcriptionResult.transcription);
    fs.writeFileSync(summaryPath, summaryResult.summary);

    console.log(`Session ${sessionId} processed successfully`);

    return {
        sessionId,
        transcription: transcriptionResult.transcription,
        summary: summaryResult.summary,
        transcriptionFile: transcriptionPath,
        summaryFile: summaryPath,
        mock: transcriptionResult.mock
    };
};

/**
 * Get processed session data
 */
const getSessionData = async (sessionId) => {
    const outputDir = path.join(storageDir, 'processed');
    const transcriptionPath = path.join(outputDir, `${sessionId}_transcription.txt`);
    const summaryPath = path.join(outputDir, `${sessionId}_summary.txt`);

    if (!fs.existsSync(transcriptionPath) || !fs.existsSync(summaryPath)) {
        return null;
    }

    return {
        sessionId,
        transcription: fs.readFileSync(transcriptionPath, 'utf8'),
        summary: fs.readFileSync(summaryPath, 'utf8')
    };
};

module.exports = {
    transcribeAudio,
    generateSummary,
    processSession,
    getSessionData,
    storageDir
};


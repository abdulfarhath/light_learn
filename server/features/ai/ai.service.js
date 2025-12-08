const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../../config/database');

// Initialize Gemini if key is present
const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

const generateAnswer = async (doubtId, title, description) => {
    try {
        let answerContent = '';

        if (genAI) {
            try {
                // Use gemini-flash-latest as it is reliable and free-tier friendly
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest"});
                const prompt = `You are a helpful teacher's assistant. Answer the student's doubt clearly and concisely.
                
                Student's Doubt:
                Title: ${title}
                Description: ${description}`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                answerContent = response.text();
            } catch (apiError) {
                console.error("Gemini API Error:", apiError.message);
                answerContent = "I'm sorry, I couldn't generate an answer at this time due to a connection issue.";
            }
        } else {
            // Mock response if no API key
            answerContent = `[AI Auto-Reply] This is an automated response. 
            
Based on your question about "${title}", here are some general pointers:
1. Review the course material related to this topic.
2. Check the examples provided in the previous class.
3. If you need more specific help, please wait for the teacher to review your doubt.

(Note: Configure GEMINI_API_KEY in .env to get real AI answers)`;
        }

        // Get AI Bot User ID
        const botUser = await db.query("SELECT id FROM users WHERE role = 'bot' LIMIT 1");
        if (botUser.rows.length === 0) {
            console.error("AI Bot user not found");
            return;
        }
        const botId = botUser.rows[0].id;

        // Save answer
        await db.query(`
            INSERT INTO doubt_answers (doubt_id, author_id, content)
            VALUES ($1, $2, $3)
        `, [doubtId, botId, answerContent]);

        console.log(`AI Answer generated for doubt ${doubtId}`);

    } catch (error) {
        console.error("Error generating AI answer:", error);
    }
};

module.exports = {
    generateAnswer
};

require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
    const key = process.env.GEMINI_API_KEY;
    console.log("Testing Gemini API with key:", key ? key.substring(0, 10) + "..." : "No key found");

    if (!key) {
        console.error("Error: GEMINI_API_KEY is missing in .env");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest"});
        
        console.log("Sending request to Gemini (gemini-flash-latest)...");
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        const text = response.text();
        
        console.log("Success! Response:", text);
    } catch (error) {
        console.error("Gemini API Failed!");
        console.error("Error Message:", error.message);
        if (error.response) {
            console.error("Error Details:", JSON.stringify(error.response, null, 2));
        }
    }
}

testGemini();

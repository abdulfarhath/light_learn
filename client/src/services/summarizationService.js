/**
 * Advanced Summarization Service
 *
 * Uses Hugging Face's FREE Inference API for intelligent text analysis
 * Provides: Summary, Key Points, Topics, and Learning Insights
 */

const SUMMARIZATION_API = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const ZERO_SHOT_API = 'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';

class SummarizationService {
    constructor() {
        this.isProcessing = false;
        this.onProgress = null;
    }

    /**
     * Generate comprehensive analysis of transcript
     * Returns summary, key points, topics, and insights
     *
     * @param {string} text - The transcript text
     * @returns {Promise<Object>} - Analysis results
     */
    async analyzeTranscript(text) {
        if (!text || text.trim().length < 30) {
            return {
                summary: 'Transcript is too short to analyze.',
                keyPoints: [],
                topics: [],
                insights: null,
                wordCount: 0,
                estimatedReadTime: '0 min'
            };
        }

        this.isProcessing = true;
        const wordCount = text.split(/\s+/).length;
        const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

        try {
            // Run analysis in parallel for speed
            if (this.onProgress) this.onProgress('Analyzing transcript with AI...');

            const [summary, keyPoints, topics] = await Promise.all([
                this.generateSummary(text),
                this.extractKeyPoints(text),
                this.identifyTopics(text)
            ]);

            const insights = this.generateInsights(text, keyPoints, topics);

            return {
                summary,
                keyPoints,
                topics,
                insights,
                wordCount,
                estimatedReadTime: `${estimatedReadTime} min read`
            };
        } catch (error) {
            console.error('Analysis error:', error);
            // Fallback to local NLP
            return this.fallbackAnalysis(text);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Generate summary using BART model
     */
    async generateSummary(text) {
        try {
            const truncated = text.substring(0, 1024);
            const response = await fetch(SUMMARIZATION_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inputs: truncated,
                    parameters: { max_length: 200, min_length: 50, do_sample: false },
                    options: { wait_for_model: true }
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result[0]?.summary_text) return result[0].summary_text;
            }
            return this.extractiveSummary(text);
        } catch {
            return this.extractiveSummary(text);
        }
    }

    /**
     * Extract key points from text
     */
    extractKeyPoints(text) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length === 0) return [];

        // Score sentences for importance
        const scored = this.scoreSentences(sentences, text);

        // Get top 5 most important sentences as key points
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((s, i) => ({
                id: i + 1,
                point: s.sentence.trim(),
                importance: s.score > 10 ? 'high' : s.score > 5 ? 'medium' : 'normal'
            }));
    }

    /**
     * Identify main topics discussed
     */
    identifyTopics(text) {
        const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const stopWords = this.getStopWords();

        // Count word frequency
        const freq = {};
        words.forEach(word => {
            if (!stopWords.has(word)) {
                freq[word] = (freq[word] || 0) + 1;
            }
        });

        // Get top keywords as topics
        const topics = Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([word, count]) => ({
                name: word.charAt(0).toUpperCase() + word.slice(1),
                mentions: count,
                relevance: count > 5 ? 'primary' : count > 2 ? 'secondary' : 'mentioned'
            }));

        return topics;
    }

    /**
     * Generate learning insights
     */
    generateInsights(text, keyPoints, topics) {
        const wordCount = text.split(/\s+/).length;
        const sentenceCount = (text.match(/[.!?]+/g) || []).length;
        const avgSentenceLength = Math.round(wordCount / Math.max(1, sentenceCount));

        // Detect complexity
        const complexWords = (text.match(/\b[a-z]{10,}\b/gi) || []).length;
        const complexity = complexWords > 20 ? 'Advanced' : complexWords > 10 ? 'Intermediate' : 'Beginner-friendly';

        // Detect if questions were asked
        const questions = (text.match(/\?/g) || []).length;
        const hasInteraction = questions > 2;

        return {
            complexity,
            contentType: hasInteraction ? 'Interactive Discussion' : 'Lecture/Explanation',
            focusAreas: topics.slice(0, 3).map(t => t.name).join(', '),
            recommendation: this.generateRecommendation(keyPoints.length, topics.length, complexity)
        };
    }

    /**
     * Generate study recommendation
     */
    generateRecommendation(keyPointsCount, topicsCount, complexity) {
        if (keyPointsCount >= 4 && topicsCount >= 4) {
            return '📚 This is a comprehensive lesson. Consider taking notes on each key point and reviewing topics individually.';
        } else if (complexity === 'Advanced') {
            return '🎯 Advanced content detected. You may want to rewatch specific sections and look up unfamiliar terms.';
        } else if (keyPointsCount < 3) {
            return '💡 This is a focused topic. Great for quick revision and building foundational understanding.';
        }
        return '✨ Well-balanced content. Review the key points and you\'ll have a solid understanding of the material.';
    }

    /**
     * Score sentences for importance
     */
    scoreSentences(sentences, fullText) {
        const stopWords = this.getStopWords();
        const wordFreq = {};
        const words = fullText.toLowerCase().match(/\b[a-z]+\b/g) || [];

        words.forEach(word => {
            if (!stopWords.has(word) && word.length > 3) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });

        return sentences.map((sentence, index) => {
            const sentenceWords = sentence.toLowerCase().match(/\b[a-z]+\b/g) || [];
            let score = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0);

            // Position boost (first and last sentences often important)
            if (index < 2) score *= 1.3;
            if (index === sentences.length - 1) score *= 1.1;

            // Length penalty (very short or very long sentences)
            if (sentenceWords.length < 5) score *= 0.7;
            if (sentenceWords.length > 40) score *= 0.8;

            return { sentence, score, index };
        });
    }

    /**
     * Extractive summary fallback
     */
    extractiveSummary(text) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        if (sentences.length <= 3) return text;

        const scored = this.scoreSentences(sentences, text);
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .sort((a, b) => a.index - b.index)
            .map(s => s.sentence.trim())
            .join(' ');
    }

    /**
     * Complete fallback analysis using local NLP
     */
    fallbackAnalysis(text) {
        const wordCount = text.split(/\s+/).length;
        return {
            summary: this.extractiveSummary(text),
            keyPoints: this.extractKeyPoints(text),
            topics: this.identifyTopics(text),
            insights: this.generateInsights(text, [], []),
            wordCount,
            estimatedReadTime: `${Math.max(1, Math.ceil(wordCount / 200))} min read`
        };
    }

    /**
     * Get stop words set
     */
    getStopWords() {
        return new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
            'used', 'this', 'that', 'these', 'those', 'you', 'he', 'she', 'it',
            'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
            'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
            'other', 'some', 'such', 'not', 'only', 'own', 'same', 'so', 'going',
            'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then',
            'about', 'know', 'like', 'think', 'want', 'well', 'look', 'because',
            'really', 'okay', 'right', 'yeah', 'actually', 'basically', 'something'
        ]);
    }

    setOnProgress(callback) {
        this.onProgress = callback;
    }

    isCurrentlyProcessing() {
        return this.isProcessing;
    }
}

const summarizationService = new SummarizationService();
export default summarizationService;


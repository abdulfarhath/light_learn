const doubtService = require('./doubts.service');

const getDoubts = async (req, res) => {
    try {
        console.log('📥 GET /doubts - Fetching all doubts');
        const doubts = await doubtService.getAllDoubts();
        console.log(`✅ Found ${doubts.length} doubts`);
        res.json({ doubts });
    } catch (error) {
        console.error('❌ Error fetching doubts:', error);
        res.status(500).json({ error: error.message });
    }
};

const createDoubt = async (req, res) => {
    try {
        console.log('📤 POST /doubts - Creating new doubt');
        console.log('  User ID:', req.user.id);
        console.log('  Doubt data:', req.body);
        const doubt = await doubtService.createDoubt(req.user.id, req.body);
        console.log(`✅ Doubt created with ID: ${doubt.id}`);
        res.status(201).json(doubt);
    } catch (error) {
        console.error("❌ Error creating doubt:", error);
        res.status(500).json({ error: error.message });
    }
};

const addAnswer = async (req, res) => {
    try {
        // Currently restricting answers to teachers only
        if (req.user.role !== 'teacher') {
            return res.status(403).json({ error: "Only teachers can answer doubts." });
        }
        const answer = await doubtService.addAnswer(req.params.id, req.user.id, req.body.content);
        res.status(201).json(answer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const toggleStatus = async (req, res) => {
    try {
        const doubtId = req.params.id;
        const userId = req.user.id;
        const { status } = req.body;

        // Verify ownership
        const doubt = await doubtService.getDoubtById(doubtId);
        if (!doubt) {
            return res.status(404).json({ error: "Doubt not found" });
        }

        if (doubt.student_id !== userId) {
            return res.status(403).json({ error: "Only the student who asked the doubt can change its status." });
        }

        const updatedDoubt = await doubtService.updateStatus(doubtId, status);
        res.json(updatedDoubt);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { getDoubts, createDoubt, addAnswer, toggleStatus };
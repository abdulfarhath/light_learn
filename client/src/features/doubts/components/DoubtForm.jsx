import React, { useState } from 'react';

const DoubtForm = ({ onSubmit, onCancel, courseId, availableClasses = [] }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedClassId, setSelectedClassId] = useState(courseId || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            classId: selectedClassId
        });
        setTitle('');
        setDescription('');
        setSelectedClassId('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Title</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief summary of your question"
                    required
                    className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                />
            </div>
            
            {/* Class selection removed for testing/automation phase */}
            {/* {!courseId && (
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Select Class/Subject</label>
                    <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        required
                        className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                    >
                        <option value="">-- Select a Class --</option>
                        {availableClasses.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.class_name} ({cls.class_code}) - {cls.teacher_name}
                            </option>
                        ))}
                    </select>
                </div>
            )} */}

            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your doubt in detail..."
                    required
                    rows="4"
                    className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary resize-none"
                ></textarea>
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-text-secondary hover:text-text-main transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    Post Doubt
                </button>
            </div>
        </form>
    );
};

export default DoubtForm;

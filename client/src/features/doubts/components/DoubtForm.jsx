import React, { useState } from 'react';

const DoubtForm = ({ onSubmit, onCancel, courseId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [course, setCourse] = useState(courseId || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({
            title,
            description,
            course: course || 'General', // In a real app, this would be a course ID
        });
        setTitle('');
        setDescription('');
        setCourse('');
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
            
            {!courseId && (
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">Course/Subject</label>
                    <input
                        type="text"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        placeholder="e.g. React, Database, Math"
                        className="w-full bg-bg-dark border border-border rounded-lg p-3 text-text-main focus:outline-none focus:border-primary"
                    />
                </div>
            )}

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

import React, { useState } from 'react';
import Button from '../shared/components/Button';
import Card from '../shared/components/Card';

const AssignmentModal = ({ assignment, onClose }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const questions = [
        {
            id: 1,
            type: 'mcq',
            question: 'What is the time complexity of binary search?',
            options: ['O(n)', 'O(log n)', 'O(n²)', 'O(2^n)'],
            correctAnswer: 'O(log n)'
        },
        {
            id: 2,
            type: 'mcq',
            question: 'Which data structure uses LIFO principle?',
            options: ['Queue', 'Stack', 'Array', 'Linked List'],
            correctAnswer: 'Stack'
        },
        {
            id: 3,
            type: 'theory',
            question: 'Explain the difference between abstract class and interface in Java.',
            hint: 'Consider inheritance, fields, methods, and access modifiers'
        },
        {
            id: 4,
            type: 'mcq',
            question: 'What does SQL JOIN do?',
            options: ['Combines rows from two tables', 'Deletes duplicate rows', 'Sorts data alphabetically', 'Encrypts data'],
            correctAnswer: 'Combines rows from two tables'
        },
        {
            id: 5,
            type: 'theory',
            question: 'What are the SOLID principles in software design? Briefly explain each.',
            hint: 'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion'
        }
    ];

    const question = questions[currentQuestion];

    const handleAnswerChange = (value) => {
        setAnswers({
            ...answers,
            [question.id]: value
        });
    };

    const handleSubmit = () => {
        let score = 0;
        questions.forEach(q => {
            if (q.type === 'mcq' && answers[q.id] === q.correctAnswer) {
                score++;
            }
        });
        setSubmitted(true);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    if (submitted) {
        const mcqCount = questions.filter(q => q.type === 'mcq').length;
        let correctCount = 0;
        questions.forEach(q => {
            if (q.type === 'mcq' && answers[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });

        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="max-w-2xl w-full">
                    <div className="text-center py-8">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-3xl font-bold text-text-main mb-4">Assignment Submitted!</h2>
                        
                        <div className="bg-bg-dark rounded-lg p-6 mb-6">
                            <div className="text-4xl font-bold text-primary mb-2">
                                {correctCount}/{mcqCount}
                            </div>
                            <p className="text-text-muted mb-4">
                                MCQ Score: {correctCount} correct answers
                            </p>
                            <p className="text-sm text-text-secondary">
                                Theory questions will be reviewed by your instructor
                            </p>
                        </div>

                        <p className="text-text-muted mb-6">
                            Thank you for completing the assignment. Your responses have been recorded.
                        </p>

                        <Button
                            variant="primary"
                            onClick={onClose}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">{assignment.title}</h2>
                        <p className="text-text-muted text-sm mt-1">
                            Question {currentQuestion + 1} of {questions.length}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-text-main text-2xl"
                    >
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-bg-dark rounded-full h-2 mb-6">
                    <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>

                {/* Question */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-text-main mb-4">
                        {question.question}
                    </h3>

                    {question.type === 'mcq' ? (
                        <div className="space-y-3">
                            {question.options.map((option, idx) => (
                                <label
                                    key={idx}
                                    className="flex items-center p-3 rounded-lg border-2 border-border cursor-pointer hover:border-primary/50 transition-colors"
                                >
                                    <input
                                        type="radio"
                                        name={`question-${question.id}`}
                                        value={option}
                                        checked={answers[question.id] === option}
                                        onChange={(e) => handleAnswerChange(e.target.value)}
                                        className="w-4 h-4 text-primary"
                                    />
                                    <span className="ml-3 text-text-main">{option}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div>
                            {question.hint && (
                                <p className="text-sm text-text-muted bg-bg-dark p-3 rounded mb-4">
                                    💡 Hint: {question.hint}
                                </p>
                            )}
                            <textarea
                                value={answers[question.id] || ''}
                                onChange={(e) => handleAnswerChange(e.target.value)}
                                placeholder="Write your answer here..."
                                className="w-full h-32 p-3 bg-bg-dark border border-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                            />
                            <p className="text-xs text-text-muted mt-2">
                                Min 50 characters recommended
                            </p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 justify-between">
                    <Button
                        variant="ghost"
                        onClick={handlePrev}
                        disabled={currentQuestion === 0}
                        className="disabled:opacity-50"
                    >
                        ← Previous
                    </Button>

                    <div className="flex gap-3">
                        {currentQuestion === questions.length - 1 ? (
                            <Button
                                variant="success"
                                onClick={handleSubmit}
                                disabled={Object.keys(answers).length === 0}
                                className="disabled:opacity-50"
                            >
                                Submit Assignment ✅
                            </Button>
                        ) : (
                            <Button
                                variant="primary"
                                onClick={handleNext}
                            >
                                Next →
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AssignmentModal;

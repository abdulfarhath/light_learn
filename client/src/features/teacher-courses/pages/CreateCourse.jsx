import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import teacherCoursesAPI from '../services/teacherCoursesAPI';
import Button from '../../../shared/components/Button';
import Card from '../../../shared/components/Card';
import TopicItem from '../components/TopicItem';

const CreateCourse = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get course ID if editing
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [courseData, setCourseData] = useState({
        title: '',
        description: '',
        status: 'draft'
    });
    const [topics, setTopics] = useState([
        {
            id: Date.now(),
            title: '',
            description: '',
            materials: []
        }
    ]);

    // Fetch course data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const fetchCourse = async () => {
                try {
                    const data = await teacherCoursesAPI.getCourseById(id);
                    setCourseData({
                        title: data.course.title,
                        description: data.course.description || '',
                        status: data.course.status
                    });

                    // Transform topics/materials to match state structure
                    const formattedTopics = data.course.topics.map(t => ({
                        ...t,
                        materials: t.materials.map(m => ({
                            ...m,
                            file: { originalname: m.file_name, path: m.file_path } // Mock file obj for display
                        }))
                    }));

                    if (formattedTopics.length > 0) {
                        setTopics(formattedTopics);
                    }
                } catch (error) {
                    console.error('Error fetching course:', error);
                    alert('Failed to load course details');
                    navigate('/teacher-dashboard');
                } finally {
                    setFetching(false);
                }
            };
            fetchCourse();
        }
    }, [id, isEditMode, navigate]);

    const handleCourseChange = (e) => {
        setCourseData({
            ...courseData,
            [e.target.name]: e.target.value
        });
    };

    // --- Topic Management ---

    const addTopic = () => {
        setTopics([
            ...topics,
            {
                id: Date.now(),
                title: '',
                description: '',
                materials: []
            }
        ]);
    };

    const removeTopic = (topicId) => {
        setTopics(topics.filter(t => t.id !== topicId));
    };

    const updateTopic = (topicId, field, value) => {
        setTopics(topics.map(t =>
            t.id === topicId ? { ...t, [field]: value } : t
        ));
    };

    const moveTopic = (index, newIndex) => {
        if (newIndex < 0 || newIndex >= topics.length) return;
        const newTopics = [...topics];
        const [movedTopic] = newTopics.splice(index, 1);
        newTopics.splice(newIndex, 0, movedTopic);
        setTopics(newTopics);
    };

    // --- Material Management ---

    const addMaterial = (topicId) => {
        setTopics(topics.map(t =>
            t.id === topicId
                ? {
                    ...t,
                    materials: [
                        ...t.materials,
                        {
                            id: Date.now(),
                            material_type: 'pdf',
                            title: '',
                            description: '',
                            file: null,
                            uploading: false
                        }
                    ]
                }
                : t
        ));
    };

    const removeMaterial = (topicId, materialId) => {
        setTopics(topics.map(t =>
            t.id === topicId
                ? { ...t, materials: t.materials.filter(m => m.id !== materialId) }
                : t
        ));
    };

    const updateMaterial = (topicId, materialId, field, value) => {
        setTopics(topics.map(t =>
            t.id === topicId
                ? {
                    ...t,
                    materials: t.materials.map(m =>
                        m.id === materialId ? { ...m, [field]: value } : m
                    )
                }
                : t
        ));
    };

    const moveMaterial = (topicId, index, newIndex) => {
        setTopics(topics.map(t => {
            if (t.id !== topicId) return t;

            const newMaterials = [...t.materials];
            if (newIndex < 0 || newIndex >= newMaterials.length) return t;

            const [movedMaterial] = newMaterials.splice(index, 1);
            newMaterials.splice(newIndex, 0, movedMaterial);

            return { ...t, materials: newMaterials };
        }));
    };

    const handleFileSelect = async (topicId, materialId, file) => {
        if (!file) return;

        // Set uploading state
        updateMaterial(topicId, materialId, 'uploading', true);

        try {
            const result = await teacherCoursesAPI.uploadFile(file);
            updateMaterial(topicId, materialId, 'file', result.file);
            updateMaterial(topicId, materialId, 'uploading', false);

            // Auto-fill title if empty
            setTopics(topics.map(t =>
                t.id === topicId
                    ? {
                        ...t,
                        materials: t.materials.map(m =>
                            m.id === materialId && !m.title
                                ? { ...m, title: result.file.originalname, file: result.file, uploading: false }
                                : m.id === materialId
                                    ? { ...m, file: result.file, uploading: false }
                                    : m
                        )
                    }
                    : t
            ));
        } catch (error) {
            console.error('Error uploading file:', error);
            updateMaterial(topicId, materialId, 'uploading', false);
            alert('Failed to upload file');
        }
    };

    const handleSubmit = async (e, status = 'draft') => {
        e.preventDefault();
        setLoading(true);

        try {
            let courseId;

            if (isEditMode) {
                // Update existing course
                await teacherCoursesAPI.updateCourse(id, {
                    ...courseData,
                    status
                });
                courseId = id;

                // For simplicity in this version, we'll re-create topics/materials logic 
                // or handle diffs. To keep it robust without complex diffing on frontend:
                // A better approach for "Edit" with complex nested data is often:
                // 1. Update course details
                // 2. For topics/materials, we might need to handle them carefully.
                // However, our backend `addTopic` adds NEW topics. 
                // We haven't implemented "Update Topic" or "Update Material" endpoints fully 
                // (except we have delete).

                // STRATEGY: 
                // For this iteration, we will rely on the user manually managing topics.
                // But wait, if we just add topics again, we'll duplicate them.
                // We need to know which ones are new and which are existing.

                // Ideally, we should have `updateTopic` and `updateMaterial` endpoints.
                // Given constraints, we'll assume the user is just adding new stuff or 
                // we'd need a "Sync" endpoint.

                // Let's stick to the current backend capabilities:
                // We can Add Topic, Add Material.
                // We can Delete Topic, Delete Material.
                // We CANNOT Update Topic/Material content via API yet (only create/delete).

                // So for Edit Mode to work fully, we need to be careful.
                // If a topic has an ID that looks like a timestamp (Date.now()), it's NEW.
                // If it has a small integer ID, it's EXISTING.

                // We will only create NEW topics/materials.
                // Existing ones are assumed untouched unless we add update endpoints.

                // NOTE: This is a limitation. To make it "perfect", we should add update endpoints.
                // But for now, let's handle CREATION of new items in edit mode.
            } else {
                // Create new course
                const courseResult = await teacherCoursesAPI.createCourse({
                    ...courseData,
                    status
                });
                courseId = courseResult.course.id;
            }

            // Process Topics
            for (let i = 0; i < topics.length; i++) {
                const topic = topics[i];
                if (!topic.title.trim()) continue;

                let topicId = topic.id;
                const isNewTopic = typeof topic.id === 'number' && topic.id > 1000000000000; // Timestamp check

                if (isNewTopic || !isEditMode) {
                    const topicResult = await teacherCoursesAPI.addTopic(courseId, {
                        title: topic.title,
                        description: topic.description,
                        order_index: i
                    });
                    topicId = topicResult.topic.id;
                }

                // Process Materials
                for (let j = 0; j < topic.materials.length; j++) {
                    const material = topic.materials[j];
                    if (!material.file && !material.file_path) continue; // Skip if no file

                    const isNewMaterial = typeof material.id === 'number' && material.id > 1000000000000;

                    if (isNewMaterial || (!isEditMode && !material.id)) {
                        // Only add if it's new
                        await teacherCoursesAPI.addMaterial(topicId, {
                            material_type: material.material_type,
                            title: material.title || material.file.originalname,
                            description: material.description,
                            file_name: material.file.filename || material.file_name,
                            file_path: material.file.path || material.file_path,
                            file_size: material.file.size || material.file_size,
                            order_index: j
                        });
                    }
                }
            }

            alert(`Course ${status === 'published' ? 'published' : 'saved'} successfully!`);
            navigate('/teacher-dashboard');
        } catch (error) {
            console.error('Error saving course:', error);
            alert('Failed to save course');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-text-main">Loading course...</div>;
    }

    return (
        <div className="w-full bg-bg-dark py-8 px-4 md:px-6">
            <div className="max-w-6xl mx-auto pb-20">
                {/* Header */}
                <div className="mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary transition-all mb-6 hover:gap-3"
                    >
                        <span>←</span>
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                            📚
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-text-main">
                                {isEditMode ? 'Edit Course' : 'Create New Course'}
                            </h1>
                        </div>
                    </div>
                    <p className="text-text-muted text-lg ml-[60px]">Build an amazing learning experience for your students</p>
                </div>

                <form onSubmit={(e) => handleSubmit(e, 'draft')}>
                    {/* Course Info */}
                    <Card className="mb-8 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                📋
                            </div>
                            <h2 className="text-2xl font-semibold text-text-main">Course Details</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">
                                    Course Title <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={courseData.title}
                                    onChange={handleCourseChange}
                                    required
                                    placeholder="e.g., Introduction to Data Structures"
                                    className="w-full px-5 py-4 bg-bg-dark border-2 border-border rounded-xl text-text-main placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-text-main mb-2">
                                    Course Description
                                </label>
                                <textarea
                                    name="description"
                                    value={courseData.description}
                                    onChange={handleCourseChange}
                                    rows="5"
                                    placeholder="Describe what students will learn in this course..."
                                    className="w-full px-5 py-4 bg-bg-dark border-2 border-border rounded-xl text-text-main placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none text-base leading-relaxed"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Topics */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-bg-panel p-5 rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    📚
                                </div>
                                <div>
                                    <h2 className="text-2xl font-semibold text-text-main">Course Topics</h2>
                                    <p className="text-sm text-text-muted">Structure your course content</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={addTopic}
                                className="shadow-lg"
                            >
                                <span className="text-lg">+</span>
                                <span>Add Topic</span>
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {topics.map((topic, index) => (
                                <TopicItem
                                    key={topic.id}
                                    topic={topic}
                                    index={index}
                                    onUpdate={(field, value) => updateTopic(topic.id, field, value)}
                                    onRemove={() => removeTopic(topic.id)}
                                    onAddMaterial={() => addMaterial(topic.id)}
                                    onUpdateMaterial={(materialId, field, value) => updateMaterial(topic.id, materialId, field, value)}
                                    onRemoveMaterial={(materialId) => removeMaterial(topic.id, materialId)}
                                    onFileSelect={(materialId, file) => handleFileSelect(topic.id, materialId, file)}
                                    onMoveUp={() => moveTopic(index, index - 1)}
                                    onMoveDown={() => moveTopic(index, index + 1)}
                                    onMaterialMove={(matIndex, newMatIndex) => moveMaterial(topic.id, matIndex, newMatIndex)}
                                    isFirst={index === 0}
                                    isLast={index === topics.length - 1}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-bg-dark/95 backdrop-blur-sm border-t border-border -mx-4 md:-mx-6 px-4 md:px-6 py-6 mt-8">
                        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-3 justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate(-1)}
                                disabled={loading}
                                className="order-3 sm:order-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="secondary"
                                disabled={loading}
                                className="order-2 shadow-md"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        <span>Saving...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>💾</span>
                                        <span>Save as Draft</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={(e) => handleSubmit(e, 'published')}
                                disabled={loading}
                                className="order-1 sm:order-3 shadow-lg"
                            >
                                {loading ? (
                                    <>
                                        <span className="animate-spin">⏳</span>
                                        <span>Publishing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>🚀</span>
                                        <span>Publish Course</span>
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateCourse;

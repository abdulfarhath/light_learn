import React from 'react';
import Card from '../../../shared/components/Card';
import MaterialItem from './MaterialItem';

const TopicItem = ({
    topic,
    index,
    onUpdate,
    onRemove,
    onAddMaterial,
    onUpdateMaterial,
    onRemoveMaterial,
    onFileSelect,
    onMoveUp,
    onMoveDown,
    onMaterialMove,
    isFirst,
    isLast
}) => {
    return (
        <Card className="border-l-4 border-primary transition-all hover:shadow-xl shadow-md mb-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-primary text-lg">
                        {index + 1}
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-text-main">
                            Topic #{index + 1}
                        </h3>
                        <div className="flex gap-2 mt-1">
                            <button
                                type="button"
                                onClick={onMoveUp}
                                disabled={isFirst}
                                className="px-2 py-1 text-xs bg-bg-hover hover:bg-bg-dark rounded disabled:opacity-30 disabled:cursor-not-allowed text-text-muted transition-colors"
                                title="Move Up"
                            >
                                ↑ Up
                            </button>
                            <button
                                type="button"
                                onClick={onMoveDown}
                                disabled={isLast}
                                className="px-2 py-1 text-xs bg-bg-hover hover:bg-bg-dark rounded disabled:opacity-30 disabled:cursor-not-allowed text-text-muted transition-colors"
                                title="Move Down"
                            >
                                ↓ Down
                            </button>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Are you sure you want to remove this topic and all its materials?')) {
                            onRemove();
                        }
                    }}
                    className="text-danger hover:text-danger/80 transition-colors flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-danger/10"
                >
                    <span>🗑️</span>
                    <span className="text-sm font-medium">Remove</span>
                </button>
            </div>

            {/* Form Inputs */}
            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-text-main mb-2">
                        Topic Title <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => onUpdate('title', e.target.value)}
                        placeholder="e.g., Arrays and Linked Lists"
                        className="w-full px-4 py-3 bg-bg-dark border-2 border-border rounded-lg text-text-main placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-text-main mb-2">
                        Topic Description
                    </label>
                    <textarea
                        value={topic.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        rows="2"
                        placeholder="Brief description of this topic..."
                        className="w-full px-4 py-3 bg-bg-dark border-2 border-border rounded-lg text-text-main placeholder:text-text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none"
                    />
                </div>

                {/* Materials Section */}
                <div className="mt-6 pt-6 border-t-2 border-border">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📎</span>
                            <h4 className="text-base font-semibold text-text-main">Learning Materials</h4>
                            <span className="text-xs bg-bg-hover px-2 py-1 rounded-full text-text-muted">
                                {topic.materials.length} items
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onAddMaterial}
                            className="text-sm text-primary hover:text-primary/80 transition-colors font-medium px-3 py-2 rounded-lg hover:bg-primary/10 flex items-center gap-1"
                        >
                            <span className="text-base">+</span>
                            <span>Add Material</span>
                        </button>
                    </div>

                    {/* SCROLL FIX: Added max-height and overflow-y-auto here */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {topic.materials.map((material, matIndex) => (
                            <MaterialItem
                                key={material.id}
                                material={material}
                                index={matIndex}
                                onUpdate={(field, value) => onUpdateMaterial(material.id, field, value)}
                                onRemove={() => onRemoveMaterial(material.id)}
                                onFileSelect={(file) => onFileSelect(material.id, file)}
                                onMoveUp={() => onMaterialMove(matIndex, matIndex - 1)}
                                onMoveDown={() => onMaterialMove(matIndex, matIndex + 1)}
                                isFirst={matIndex === 0}
                                isLast={matIndex === topic.materials.length - 1}
                            />
                        ))}

                        {topic.materials.length === 0 && (
                            <div className="text-center py-8 text-sm text-text-muted bg-bg-dark/50 rounded-xl border-2 border-dashed border-border">
                                <div className="text-3xl mb-2">📚</div>
                                <p>No materials added yet</p>
                                <p className="text-xs mt-1">Click "Add Material" to upload files</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default TopicItem;
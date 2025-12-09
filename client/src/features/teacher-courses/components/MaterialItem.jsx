import React from 'react';

const MaterialItem = ({
    material,
    index,
    onUpdate,
    onRemove,
    onFileSelect,
    onMoveUp,
    onMoveDown,
    isFirst,
    isLast
}) => {
    return (
        <div className="p-4 bg-bg-panel rounded-xl border-2 border-border hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                        {index + 1}
                    </div>
                    <span className="text-sm font-medium text-text-main">
                        Material #{index + 1}
                    </span>
                    <div className="flex gap-1">
                        <button
                            type="button"
                            onClick={onMoveUp}
                            disabled={isFirst}
                            className="px-2 py-1 text-xs bg-bg-dark hover:bg-bg-hover rounded disabled:opacity-20 disabled:cursor-not-allowed text-text-muted transition-colors"
                            title="Move Up"
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            onClick={onMoveDown}
                            disabled={isLast}
                            className="px-2 py-1 text-xs bg-bg-dark hover:bg-bg-hover rounded disabled:opacity-20 disabled:cursor-not-allowed text-text-muted transition-colors"
                            title="Move Down"
                        >
                            ↓
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        if (window.confirm('Are you sure you want to remove this material?')) {
                            onRemove();
                        }
                    }}
                    className="text-xs text-danger hover:text-danger/80 px-2 py-1 rounded hover:bg-danger/10 transition-all"
                >
                    Remove
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5">Material Type</label>
                    <select
                        value={material.material_type}
                        onChange={(e) => onUpdate('material_type', e.target.value)}
                        className="w-full px-3 py-2.5 bg-bg-dark border-2 border-border rounded-lg text-sm text-text-main focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    >
                        <option value="pdf">📄 PDF Document</option>
                        <option value="ppt">📊 PowerPoint (PPT/PPTX)</option>
                        <option value="video">🎥 Video File</option>
                        <option value="document">📝 Document (Word/Text)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5">Upload File</label>
                    <input
                        type="file"
                        accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.avi"
                        onChange={(e) => onFileSelect(e.target.files[0])}
                        className="w-full px-3 py-2 bg-bg-dark border-2 border-border rounded-lg text-sm text-text-main file:mr-2 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-primary file:text-white file:cursor-pointer file:font-medium hover:file:bg-primary-dark transition-all"
                    />
                </div>
            </div>

            {material.uploading && (
                <div className="mt-3 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-xs text-primary flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span className="font-medium">Uploading file...</span>
                </div>
            )}

            {material.file && !material.uploading && (
                <div className="mt-3 px-3 py-2 bg-success/10 border border-success/20 rounded-lg text-xs text-success flex items-center gap-2">
                    <span>✓</span>
                    <span className="font-medium truncate">{material.file.originalname || material.file_name}</span>
                    <span className="text-text-muted ml-auto">Uploaded</span>
                </div>
            )}

            <div className="mt-4 space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5">Material Title</label>
                    <input
                        type="text"
                        value={material.title}
                        onChange={(e) => onUpdate('title', e.target.value)}
                        placeholder="e.g., Chapter 1 - Introduction"
                        className="w-full px-3 py-2.5 bg-bg-dark border-2 border-border rounded-lg text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-text-main mb-1.5">Description (Optional)</label>
                    <textarea
                        value={material.description}
                        onChange={(e) => onUpdate('description', e.target.value)}
                        rows="2"
                        placeholder="Brief description of this material..."
                        className="w-full px-3 py-2.5 bg-bg-dark border-2 border-border rounded-lg text-sm text-text-main placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all resize-none"
                    />
                </div>
            </div>
        </div>
    );
};

export default MaterialItem;

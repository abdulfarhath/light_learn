import React, { useState, useEffect } from 'react';

const BandwidthMonitor = ({ socket }) => {
    const [bandwidth, setBandwidth] = useState({ sent: 0, received: 0 });
    const [quality, setQuality] = useState('excellent');
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (!socket) return;

        let sentBytes = 0;
        let receivedBytes = 0;
        let lastUpdate = Date.now();

        // Monitor outgoing data
        const originalEmit = socket.emit.bind(socket);
        socket.emit = function(...args) {
            const data = JSON.stringify(args);
            sentBytes += data.length;
            return originalEmit(...args);
        };

        // Monitor incoming data
        socket.onAny((event, data) => {
            const dataStr = JSON.stringify(data);
            receivedBytes += dataStr.length;
        });

        // Update bandwidth stats every second
        const interval = setInterval(() => {
            const now = Date.now();
            const timeDiff = (now - lastUpdate) / 1000; // seconds
            
            const sentKbps = (sentBytes * 8) / (timeDiff * 1000); // kbps
            const receivedKbps = (receivedBytes * 8) / (timeDiff * 1000); // kbps
            
            setBandwidth({
                sent: sentKbps.toFixed(1),
                received: receivedKbps.toFixed(1)
            });

            // Determine quality
            const totalKbps = sentKbps + receivedKbps;
            if (totalKbps < 50) setQuality('excellent');
            else if (totalKbps < 100) setQuality('good');
            else if (totalKbps < 200) setQuality('fair');
            else setQuality('poor');

            // Reset counters
            sentBytes = 0;
            receivedBytes = 0;
            lastUpdate = now;
        }, 1000);

        return () => clearInterval(interval);
    }, [socket]);

    const getQualityColor = () => {
        switch(quality) {
            case 'excellent': return 'text-success';
            case 'good': return 'text-primary';
            case 'fair': return 'text-warning';
            case 'poor': return 'text-danger';
            default: return 'text-text-muted';
        }
    };

    const getQualityIcon = () => {
        switch(quality) {
            case 'excellent': return '📶';
            case 'good': return '📡';
            case 'fair': return '📊';
            case 'poor': return '⚠️';
            default: return '📶';
        }
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 left-6 md:left-72 z-40 bg-bg-panel/95 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg hover:scale-110 transition-transform"
                title="Show Bandwidth Monitor"
            >
                <span className="text-2xl">{getQualityIcon()}</span>
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 md:left-72 z-40 bg-bg-panel/95 backdrop-blur-sm border border-border rounded-2xl shadow-2xl p-4 min-w-[220px]">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{getQualityIcon()}</span>
                    <span className="text-xs font-medium text-text-muted">Bandwidth</span>
                </div>
                <button
                    onClick={() => setIsMinimized(true)}
                    className="text-text-muted hover:text-text-main text-xs"
                >
                    ─
                </button>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">↑ Upload</span>
                    <span className="text-sm font-bold text-primary">{bandwidth.sent} kbps</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs text-text-muted">↓ Download</span>
                    <span className="text-sm font-bold text-success">{bandwidth.received} kbps</span>
                </div>
                <div className="pt-2 border-t border-border">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-text-muted">Quality</span>
                        <span className={`text-sm font-bold ${getQualityColor()} capitalize`}>
                            {quality}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-text-muted">
                    <span className="text-success">●</span>
                    <span>Optimized for low bandwidth</span>
                </div>
            </div>
        </div>
    );
};

export default BandwidthMonitor;


import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useProject } from '../context/ProjectContext';

export default function TemporalControl() {
    const { state, actions } = useProject();
    const [localRange, setLocalRange] = useState(state.timeRange);
    const [selectedPreset, setSelectedPreset] = useState('12min');
    const [localTrajSec, setLocalTrajSec] = useState(state.trajectorySeconds ?? 3);



    const WINDOW_SIZE = 3;
    const MAX_TIME = localRange.end || 5400; // 90 mins in seconds
    const presets = [
        { label: '12 min', start: 720, id: '12min' },
        { label: '24 min', start: 1440, id: '24min' },
        { label: 'Half-time', start: 45 * 60, id: 'halftime' },
        { label: '65 min', start: 65 * 60, id: '65min' },
        { label: '78 min', start: 78 * 60, id: '78min' },
        { label: 'Final Push', start: 80 * 60, id: 'finalpush' },
        { label: 'Last Chance', start: 89 * 60, id: 'lastchance' },
    ];
    const topKvalues = [
        { id: 'topK1', label: 'Top-1', value: 1 },
        { id: 'topK3', label: 'Top-3', value: 3 },
        { id: 'topK5', label: 'Top-5', value: 5 },
    ]

    const handleStartChange = (e) => {
        const start = parseInt(e.target.value);
        const newRange = {
            start: start,
            end: localRange.end
        };
        setSelectedPreset(null);
        setLocalRange(newRange);
        actions.setTimeRange(newRange);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (state.timeRange && (state.timeRange.start !== localRange.start || state.timeRange.end !== localRange.end)) {
        setLocalRange(state.timeRange);
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-effect rounded-xl p-6 transition-opacity ${state.loading ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <h2 className="text-xl font-semibold mb-6 text-sports-primary">
                Prediction Window ({localTrajSec}s)
            </h2>

            <div className="flex justify-between items-center mb-6">
                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Input Start</div>
                    <div className="text-2xl font-mono font-semibold text-sports-primary">
                        {formatTime(localRange.start)}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                    <div className="h-px w-12 bg-gradient-to-r from-sports-primary to-sports-secondary"></div>
                    <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded border border-white/10">
                        {localTrajSec}s Trajectory
                    </span>
                    <div className="h-px w-12 bg-gradient-to-r from-sports-secondary to-sports-primary"></div>
                </div>

                <div className="text-center">
                    <div className="text-sm text-gray-400 mb-1">Input End</div>
                    <div className="text-2xl font-mono font-semibold text-sports-secondary">
                        {formatTime(localRange.start + localTrajSec)}
                    </div>
                </div>
            </div>

            <div className="relative mb-8 h-6 flex items-center">
                {/* Background Track */}
                <div className="absolute w-full h-2 bg-white/10 rounded-full" />

                {/* Visual Selection Bar */}
                <motion.div
                    className="absolute h-2 bg-gradient-to-r from-sports-primary to-sports-secondary rounded-full"
                    style={{
                        // How far from the left the 3s block starts
                        width: `${((localRange.start) / localRange.end) * 100}%`,

                        // How wide the 3s block is relative to the whole match
                        right: `${((localRange.end - localRange.start)) / localRange.end * 100}%`,
                    }}
                />

                {/* The Input Controller */}
                <input
                    type="range"
                    min="0"
                    max={MAX_TIME - WINDOW_SIZE}
                    step="1"
                    value={localRange.start}
                    onChange={handleStartChange}
                    disabled={state.loading}
                    className={`absolute w-full h-2 appearance-none bg-transparent z-10
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-sports-primary
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(var(--sports-primary-rgb),0.5)]
                    ${state.loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />

            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {presets.map((preset) => (
                    <motion.button
                        key={preset.id}
                        onClick={() => {
                            // Ensure we don't exceed the match bounds
                            const validStart = Math.min(preset.start, MAX_TIME - WINDOW_SIZE);
                            const newRange = {
                                start: validStart,
                                end: localRange.end // Keep the same end time to maintain window size 
                            };
                            setLocalRange(newRange);
                            setSelectedPreset(preset.id);
                            actions.setTimeRange(newRange);
                        }}
                        disabled={state.loading}
                        className={`px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm 
                       text-gray-300 hover:bg-sports-primary/20 hover:border-sports-primary/50 
                       transition-all duration-200 ${selectedPreset === preset.id

                                ? 'bg-sports-primary/20 border-2 border-sports-primary glow-primary'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            } ${state.loading ? 'cursor-not-allowed' : ''}`}
                        whileHover={state.loading ? {} : { scale: 1.02 }}
                        whileTap={state.loading ? {} : { scale: 0.98 }}
                    >
                        {preset.label}
                    </motion.button>
                ))}
            </div>

            <h2 className="text-xl font-semibold mb-6 text-sports-primary mt-5">
                Number of Zones to Forecast
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                {topKvalues.map((topK) => (
                    <motion.button
                        key={topK.id}
                        onClick={() => {
                            actions.setTopK(topK.value);
                        }}
                        disabled={state.loading}
                        className={`px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm 
                       text-gray-300 hover:bg-sports-primary/20 hover:border-sports-primary/50 
                       transition-all duration-200 ${state.topK === topK.value

                                ? 'bg-sports-primary/20 border-2 border-sports-primary glow-primary'
                                : 'bg-white/5 border border-white/10 hover:bg-white/10'
                            } ${state.loading ? 'cursor-not-allowed' : ''}`}
                        whileHover={state.loading ? {} : { scale: 1.02 }}
                        whileTap={state.loading ? {} : { scale: 0.98 }}
                    >
                        {topK.label}
                    </motion.button>
                ))}
            </div>
            <div className="text-xs text-center text-gray-500 mt-3 italic">
                TCN Model requires 3.0s of trajectory data to forecast the next zone.
            </div>

            {/* ── Trajectory Visibility Slider ── */}
            <h2 className="text-xl font-semibold mb-4 text-sports-primary mt-6">
                True Trajectory Visibility
            </h2>
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">1s</span>
                <span className="text-sm font-mono font-semibold px-3 py-1 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--sports-secondary, #00e5ff)' }}>
                    {localTrajSec}s
                </span>
                <span className="text-sm text-gray-400">20s</span>
            </div>
            <div className="relative h-6 flex items-center mb-2">
                {/* Track */}
                <div className="absolute w-full h-2 bg-white/10 rounded-full" />
                {/* Fill */}
                <div
                    className="absolute h-2 rounded-full"
                    style={{
                        width: `${((localTrajSec - 1) / 19) * 100}%`,
                        background: 'linear-gradient(to right, var(--sports-secondary, #00e5ff), #FFD700)'
                    }}
                />
                <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={localTrajSec}
                    onChange={(e) => {
                        const v = parseInt(e.target.value);
                        setLocalTrajSec(v);
                        actions.setTrajectorySeconds(v);
                    }}
                    disabled={state.loading}
                    className={`absolute w-full h-2 appearance-none bg-transparent z-10
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-6
                    [&::-webkit-slider-thumb]:h-6
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-yellow-400
                    [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,215,0,0.5)]
                    ${state.loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                />
            </div>
            <div className="text-xs text-center text-gray-500 mt-1 italic">
                Show up to {localTrajSec}s of the player's actual movement path.
            </div>
        </motion.div>
    );
}

import React, { useState, useCallback, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../context/ProjectContext';
import apiService from '../services/apiService';

// Render the LLM markdown-style output with styled headings and bullets
function MarkdownBlock({ text }) {
    if (!text) return null;
    const lines = text.split('\n');
    return (
        <div className="space-y-1.5 text-sm leading-relaxed">
            {lines.map((line, i) => {
                if (!line.trim()) return <div key={i} className="h-1" />;

                // **Heading**: value
                if (/^\*\*[^*]+\*\*:/.test(line)) {
                    const colonIdx = line.indexOf('**: ');
                    if (colonIdx !== -1) {
                        const header = line.slice(2, colonIdx);
                        const body = line.slice(colonIdx + 4);
                        return (
                            <div key={i} className="flex flex-wrap gap-1">
                                <span className="text-sports-primary font-semibold">{header}:</span>
                                <span className="text-gray-200">{body}</span>
                            </div>
                        );
                    }
                }

                // **Bold** standalone heading
                if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
                    return (
                        <div key={i} className="text-sports-primary font-semibold pt-1">
                            {line.replace(/\*\*/g, '')}
                        </div>
                    );
                }

                // Bullet points
                if (/^[-•]/.test(line.trim())) {
                    return (
                        <div key={i} className="flex gap-2 text-gray-200 pl-2">
                            <span className="text-sports-secondary mt-0.5 flex-shrink-0">▸</span>
                            <span>{line.replace(/^[-•]\s*/, '')}</span>
                        </div>
                    );
                }

                return <div key={i} className="text-gray-300">{line}</div>;
            })}
        </div>
    );
}

export default function TacticalCoach() {
    const { state } = useProject();
    const { forecast, selectedPlayer, selectedGame, timeRange } = state;

    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const hasData = forecast?.probabilities?.length > 0;

    // Reset analysis when forecast changes (new player/game/time selected)
    useEffect(() => {
        setAnalysis(null);
        setError(null);
        setLoading(false);
    }, [forecast]);

    const handleAnalyze = useCallback(async () => {
        if (!hasData || !selectedPlayer || !selectedGame) return;

        setLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const matchMinute = Math.floor((timeRange?.start ?? 0) / 60);

            const payload = {
                player_name: selectedPlayer.name,
                player_position: selectedPlayer.position ?? 'unknown',
                start_time: timeRange?.start ?? 0,
                match_context: {
                    home_team: selectedGame.home_team,
                    away_team: selectedGame.away_team,
                    home_score: selectedGame.home_score ?? 0,
                    away_score: selectedGame.away_score ?? 0,
                    match_minute: matchMinute,
                },
                forecast: {
                    probabilities: forecast.probabilities,
                    currentPosition: forecast.currentPosition ?? { x: 0, y: 0 },
                    truePosition: forecast.truePosition ?? { x: 0, y: 0 },
                },
                real_path: forecast.realPath ?? [],
            };

            const result = await apiService.getTacticalAnalysis(payload);
            setAnalysis(result.analysis);
        } catch (err) {
            console.error('Tactical analysis error:', err);
            setError('Failed to get tactical analysis. Check that GEMINI_API_KEY is set in backend/.env');
        } finally {
            setLoading(false);
        }
    }, [forecast, selectedPlayer, selectedGame, timeRange, hasData]);

    // ── Empty / no-forecast state ──
    if (!hasData) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-effect rounded-xl p-6 h-full flex items-center justify-center"
            >
                <div className="text-center text-gray-500">
                    <div className="text-4xl mb-3">🧠</div>
                    <p className="font-medium text-gray-400">AI Tactical Coach</p>
                    <p className="text-sm mt-2">Generate a forecast first to unlock tactical analysis</p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-5 flex flex-col gap-4"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🧠</span>
                    <h2 className="text-base font-semibold text-white">AI Tactical Coach</h2>
                </div>
                <span
                    className="text-[10px] text-gray-500 font-mono px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    Gemini 2.0 Flash
                </span>
            </div>

            {/* Context pills */}
            {selectedPlayer && selectedGame && (
                <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs bg-sports-primary/20 text-sports-primary border border-sports-primary/30 rounded-full px-2 py-0.5">
                        {selectedPlayer.name}
                    </span>
                    <span className="text-xs bg-white/5 text-gray-400 rounded-full px-2 py-0.5 border border-white/10">
                        {selectedGame.home_team} vs {selectedGame.away_team}
                    </span>
                    <span className="text-xs bg-white/5 text-gray-400 rounded-full px-2 py-0.5 border border-white/10">
                        {Math.floor((timeRange?.start ?? 0) / 60)}' min
                    </span>
                </div>
            )}

            {/* Analyse button */}
            <motion.button
                onClick={handleAnalyze}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all ${loading
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'text-white cursor-pointer shadow-lg shadow-purple-900/30'
                    }`}
                style={loading ? {} : {
                    background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                }}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        Analysing…
                    </span>
                ) : analysis ? (
                    '↺ Re-analyse'
                ) : (
                    '⚡ Get Tactical Analysis'
                )}
            </motion.button>

            {/* Error message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-red-400 border border-red-800/40 rounded-lg p-3"
                        style={{ background: 'rgba(127,29,29,0.2)' }}
                    >
                        {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Analysis output */}
            <AnimatePresence mode="wait">
                {analysis && (
                    <motion.div
                        key={analysis.slice(0, 30)}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-lg p-4"
                        style={{
                            background: 'rgba(88,28,135,0.12)',
                            border: '1px solid rgba(139,92,246,0.2)',
                        }}
                    >
                        <MarkdownBlock text={analysis} />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

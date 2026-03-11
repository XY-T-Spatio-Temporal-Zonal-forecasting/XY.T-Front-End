import React, { useEffect, useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../context/ProjectContext';
import PitchVisualization from '../components/PitchVisualization';
import SelectionPanel from '../components/SelectionPanel';
import TemporalControl from '../components/TemporalControl';
import TacticalCoach from '../components/TacticalCoach';
import mockService from '../services/mockService';
import apiService from '../services/apiService';

export default function Dashboard() {
    const { state, actions } = useProject();
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingGenerator, setLoadingGenerator] = useState(false);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [lastForecastPayload, setLastForecastPayload] = useState(null);

    useEffect(() => {
        if (state.selectedGame && state.selectedPlayer) {
            setLoadingGenerator(false);
            setIsGenerating(false);
        } else {
            setLoadingGenerator(true);
            setIsGenerating(false);
        }

    }, [state.selectedGame, state.selectedPlayer, actions]);

    // Generate forecast
    const handleGenerateForecast = async () => {
        if (!state.selectedGame || !state.selectedPlayer) {
            actions.setError('No tracking data in selected time range');
            return;
        }

        setIsGenerating(true);
        actions.setLoading(true);

        try {
            // Extract sequence from time range
            const startingFrame = state.timeRange.start;
            console.log('Selected time range:', state.timeRange);
            const topK = state.topK;

            if (startingFrame < 10) {
                actions.setError('Time range must start after the first 10 seconds of the game');
                setIsGenerating(false);
                actions.setLoading(false);
                return;
            }

            const payload = {
                match_id: parseInt(state.selectedGame.match_id),
                player_id: parseInt(state.selectedPlayer.player_id),
                start_time: startingFrame,
                top_k: topK,
                trajectory_seconds: Math.min(20, Math.max(1, state.trajectorySeconds ?? 20))
            };
            console.log('Requesting forecast with payload:', payload);
            const forecast = await apiService.getForecast(payload);
            actions.setForecast(forecast);
            // Reset any previous animation so the Animate button becomes available again
            actions.setForecastTimeline([]);
            actions.setTimelineStep(0);
            setLastForecastPayload(payload);
        } catch (error) {
            actions.setError('Failed to generate forecast');
        } finally {
            setIsGenerating(false);
            actions.setLoading(false);
        }
    };

    const handleAnimateForecast = async () => {
        if (!lastForecastPayload) return;
        setLoadingTimeline(true);
        try {
            const result = await apiService.getForecastTimeline(lastForecastPayload);
            actions.setForecastTimeline(result.forecastTimeline ?? []);
        } catch (error) {
            actions.setError('Failed to build forecast timeline');
        } finally {
            setLoadingTimeline(false);
        }
    };


    return (
        <div className="min-h-screen bg-sports-darker">
            {/* Header */}
            <header className="border-b border-white/10 bg-sports-dark/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-2xl">
                                ⚽
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">
                                    Football Trajectory Forecasting
                                </h1>
                                <p className="text-sm text-gray-400">
                                    TCN Deep Learning Model
                                </p>
                            </div>
                        </motion.div>

                        {/* Status indicator */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2"
                        >
                            {state.loading ? (
                                <div className="flex items-center gap-2 text-sports-secondary">
                                    <div className="w-2 h-2 rounded-full bg-sports-secondary animate-pulse"></div>
                                    <span className="text-sm">Processing...</span>
                                </div>
                            ) : state.forecast ? (
                                <div className="flex items-center gap-2 text-sports-primary">
                                    <div className="w-2 h-2 rounded-full bg-sports-primary"></div>
                                    <span className="text-sm">Forecast Ready</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                                    <span className="text-sm">Idle</span>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left sidebar - Selection */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="col-span-12 lg:col-span-3"
                    >
                        <SelectionPanel />
                    </motion.div>

                    {/* Center - Pitch Visualization */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="col-span-12 lg:col-span-6"
                    >
                        <div className="glass-effect rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">
                                    Pitch Visualization
                                </h2>
                                {state.selectedPlayer && (
                                    <div className="text-sm text-gray-400">
                                        {state.selectedPlayer.name} • #{state.selectedPlayer.number}
                                    </div>
                                )}
                            </div>

                            <div className="bg-pitch-dark rounded-lg p-4">
                                <PitchVisualization
                                    trackingData={[]}
                                    forecast={state.forecast}
                                    timeRange={state.timeRange}
                                />
                            </div>

                            {/* Controls */}
                            <div className="mt-6 space-y-4">
                                <TemporalControl />
                                {/* Animate Forecast button — appears once a static forecast is ready */}
                                {state.forecast && (
                                    <motion.button
                                        onClick={handleAnimateForecast}
                                        disabled={loadingTimeline || (state.forecastTimeline?.length > 0)}
                                        className={`w-full py-3 rounded-xl font-semibold text-base transition-all ${!loadingTimeline && !(state.forecastTimeline?.length > 0)
                                                ? 'bg-[#FFD700]/20 border border-[#FFD700]/50 text-[#FFD700] hover:bg-[#FFD700]/30 cursor-pointer'
                                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            }`}
                                        initial={{ opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        {loadingTimeline ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-[#FFD700]/30 border-t-[#FFD700] rounded-full animate-spin"></div>
                                                Building Timeline…
                                            </span>
                                        ) : state.forecastTimeline?.length > 0 ? (
                                            `▶ Animating ${state.forecastTimeline.length} Steps`
                                        ) : (
                                            '▶ Animate Forecast'
                                        )}
                                    </motion.button>
                                )}
                                {/* Generate button */}
                                <motion.button
                                    onClick={handleGenerateForecast}
                                    disabled={loadingGenerator || isGenerating}
                                    className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${!loadingGenerator && !isGenerating
                                        ? 'gradient-primary text-white hover:shadow-lg hover:shadow-sports-primary/50 cursor-pointer'
                                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                        }`}
                                    whileHover={loadingGenerator ? { scale: 1.02 } : {}}
                                    whileTap={loadingGenerator ? { scale: 0.98 } : {}}
                                >
                                    {isGenerating ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Generating Forecast...
                                        </span>
                                    ) : (
                                        '🎯 Generate Trajectory Forecast'
                                    )}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right sidebar - AI Tactical Coach */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="col-span-12 lg:col-span-3"
                    >
                        <TacticalCoach />
                    </motion.div>
                </div>

                {/* Error display */}
                <AnimatePresence>
                    {state.error && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-6 right-6 max-w-md"
                        >
                            <div className="glass-effect rounded-xl p-4 border-l-4 border-sports-accent">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl">⚠️</div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-white mb-1">Error</h3>
                                        <p className="text-sm text-gray-300">{state.error}</p>
                                    </div>
                                    <button
                                        onClick={() => actions.setError(null)}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 mt-12">
                <div className="container mx-auto px-6 py-6 justify-center flex items-center">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                        <div>
                            Powered by TCN
                        </div>

                    </div>
                </div>
            </footer>
        </div>
    );
}

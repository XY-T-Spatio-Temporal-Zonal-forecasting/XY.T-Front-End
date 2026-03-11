import React from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../context/ProjectContext';

export default function PredictionMetrics() {
    const { state } = useProject();
    const { forecast } = state;

    if (!forecast) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-effect rounded-xl p-6 h-full flex items-center justify-center"
            >
                <div className="text-center text-gray-500">
                    <div className="text-4xl mb-3">📊</div>
                    <p>No prediction available</p>
                    <p className="text-sm mt-2">Select a player and generate a forecast</p>
                </div>
            </motion.div>
        );
    }

    const { probabilities, metadata } = forecast;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Top-3 Zonal Probabilities */}
            <div className="glass-effect rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-sports-primary flex items-center gap-2">
                    <span>🎯</span>
                    Top Predicted Zones
                </h2>

                <div className="space-y-3">
                    {probabilities.map((prob, idx) => {
                        const percentage = (prob.probability * 100).toFixed(1);
                     const colors = [ 
    'bg-red-600',    // Rank 1: High Prob (Hot)
    'bg-orange-500', // Rank 2
    'bg-yellow-400', // Rank 3
    'bg-green-500',  // Rank 4
    'bg-blue-600'    // Rank 5: Low Prob (Cold)
];

// Matching Glow effects for your glass-morphism UI
const glowColors = [
    'shadow-[0_0_15px_rgba(220,38,38,0.5)]', // Red glow
    'shadow-[0_0_15px_rgba(249,115,22,0.4)]', // Orange glow
    'shadow-[0_0_15px_rgba(250,204,21,0.3)]', // Yellow glow
    'shadow-[0_0_15px_rgba(34,197,94,0.2)]',  // Green glow
    'shadow-[0_0_15px_rgba(37,99,235,0.2)]'   // Blue glow
];
                        return (
                            <motion.div
                                key={prob.zone_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="relative"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-lg ${colors[idx]} flex items-center justify-center font-bold text-sm ${glowColors[idx]}`}
                                        >
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">
                                                Zone {prob.zone_id}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                Row {Math.floor(prob.zone_id / 16)} • Col{' '}
                                                {prob.zone_id % 16}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold font-mono text-white">
                                            {percentage}%
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full ${colors[idx]}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ delay: idx * 0.1 + 0.2, duration: 0.5 }}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* MDN Parameters */}
            {/* <div className="glass-effect rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4 text-sports-secondary flex items-center gap-2">
                    <span>📈</span>
                    MDN Parameters
                </h2>

                <div className="space-y-4">
                    {/* Number of components */}
                    {/* <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <span className="text-gray-400">Mixture Components</span>
                        <span className="font-mono font-semibold text-sports-primary">
                            {gmm_parameters.means.length}
                        </span>
                    </div> */}

                    {/* Component details */}
                    {/* <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-300 mb-2">
                            Component Weights (π)
                        </div>
                        {gmm_parameters.weights.map((weight, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="text-xs text-gray-500 w-16">
                                    Component {idx + 1}
                                </div>
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-primary"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${weight * 100}%` }}
                                        transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    />
                                </div>
                                <div className="text-xs font-mono text-gray-400 w-12 text-right">
                                    {weight.toFixed(3)}
                                </div>
                            </div>
                        ))}
                    </div> */}

                    {/* Means (μ) */}
                    {/* <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-300 mb-2">
                            Mean Positions (μ)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {gmm_parameters.means.slice(0, 4).map((mean, idx) => (
                                <div
                                    key={idx}
                                    className="p-2 bg-white/5 rounded border border-white/10"
                                >
                                    <div className="text-xs text-gray-500 mb-1">
                                        Component {idx + 1}
                                    </div>
                                    <div className="font-mono text-xs text-sports-secondary">
                                        x: {mean[0].toFixed(1)}m, y: {mean[1].toFixed(1)}m
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div> */}

                    {/* Covariances (Σ) */}
                    {/* <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-300 mb-2">
                            Std Deviations (σ)
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {gmm_parameters.covariances.slice(0, 4).map((cov, idx) => {
                                const sigma_x = Math.sqrt(cov[0][0]);
                                const sigma_y = Math.sqrt(cov[1][1]);
                                return (
                                    <div
                                        key={idx}
                                        className="p-2 bg-white/5 rounded border border-white/10"
                                    >
                                        <div className="text-xs text-gray-500 mb-1">
                                            Component {idx + 1}
                                        </div>
                                        <div className="font-mono text-xs text-sports-primary">
                                            σx: {sigma_x.toFixed(2)}m, σy: {sigma_y.toFixed(2)}m
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div> */}
                {/* </div>
            </div> */}

            {/* Metadata */}
            {metadata && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-effect rounded-xl p-4 border-l-4 border-sports-primary"
                >
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-400">Model</div>
                        <div className="font-semibold text-white">{metadata.model}</div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                        <div className="text-gray-400">Confidence</div>
                        <div className="font-semibold text-sports-primary">
                            {(metadata.confidence * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                        <div className="text-gray-400">Timestamp</div>
                        <div className="font-mono text-xs text-gray-500">
                            {new Date(metadata.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

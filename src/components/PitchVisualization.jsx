import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../context/ProjectContext';

const PITCH_WIDTH = import.meta.env.VITE_PITCH_WIDTH ? parseFloat(import.meta.env.VITE_PITCH_WIDTH) : 105;
const PITCH_HEIGHT = import.meta.env.VITE_PITCH_HEIGHT ? parseFloat(import.meta.env.VITE_PITCH_HEIGHT) : 68;
const GRID_COLS = import.meta.env.VITE_GRID_COLS ? parseInt(import.meta.env.VITE_GRID_COLS) : 9;
const GRID_ROWS = import.meta.env.VITE_GRID_ROWS ? parseInt(import.meta.env.VITE_GRID_ROWS) : 3;

// Pitch visualization component with 4x16 grid and heatmap
export default function PitchVisualization() {
    const { state } = useProject();
    const { forecast = null, trajectorySeconds = 3, forecastTimeline = [], timelineStep: _ctxStep = 0 } = state;
    const canvasRef = useRef(null);
    const [hoveredZone, setHoveredZone] = useState(null);
    const [localStep, setLocalStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const isPausedRef = useRef(false); // ref mirror so the interval callback doesn't need isPaused as dep

    // SVG dimensions
    const SVG_WIDTH = 1200;
    const SVG_HEIGHT = 700;
    const PADDING = 40;
    const PITCH_SVG_WIDTH = SVG_WIDTH - 2 * PADDING;
    const PITCH_SVG_HEIGHT = SVG_HEIGHT - 2 * PADDING;

    // Scale functions
    const scaleX = (x) => PADDING + (x / PITCH_WIDTH) * PITCH_SVG_WIDTH;
    const scaleY = (y) => PADDING + (1 - y / PITCH_HEIGHT) * PITCH_SVG_HEIGHT;

    // Zone dimensions
    const zoneWidth = PITCH_SVG_WIDTH / GRID_COLS;
    const zoneHeight = PITCH_SVG_HEIGHT / GRID_ROWS;

    // Get zone coordinates
    const getZoneCoords = (zoneId) => {
        const row = Math.floor(zoneId / GRID_COLS);
        const col = zoneId % GRID_COLS;
        const flippedRow = GRID_ROWS - 1 - row;
        return {
            x: PADDING + col * zoneWidth,
            y: PADDING + flippedRow * zoneHeight,
        };
    };

    // Calculate heatmap from GMM parameters
    const getHeatmapIntensity = (x, y) => {
        if (!forecast?.gmm_parameters) return 0;
        const { means, covariances, weights } = forecast.gmm_parameters;
        let totalDensity = 0;
        for (let i = 0; i < means.length; i++) {
            const [mu_x, mu_y] = means[i];
            const [[var_x, _], [__, var_y]] = covariances[i];
            const weight = weights[i];
            const dx = x - mu_x;
            const dy = y - mu_y;
            const exponent = -(dx * dx / (2 * var_x) + dy * dy / (2 * var_y));
            const density = Math.exp(exponent) / (2 * Math.PI * Math.sqrt(var_x * var_y));
            totalDensity += weight * density;
        }
        return totalDensity;
    };

    // Render heatmap on canvas
    useEffect(() => {
        if (!forecast?.gmm_parameters || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = PITCH_SVG_WIDTH;
        canvas.height = PITCH_SVG_HEIGHT;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const resolution = 4;
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        let maxDensity = 0;
        const densityMap = [];
        for (let py = 0; py < canvas.height; py += resolution) {
            for (let px = 0; px < canvas.width; px += resolution) {
                const x = (px / PITCH_SVG_WIDTH) * PITCH_WIDTH;
                const y = (py / PITCH_SVG_HEIGHT) * PITCH_HEIGHT;
                const density = getHeatmapIntensity(x, y);
                densityMap.push({ px, py, density });
                maxDensity = Math.max(maxDensity, density);
            }
        }
        densityMap.forEach(({ px, py, density }) => {
            const normalized = density / maxDensity;
            if (normalized > 0.05) {
                let r, g, b;
                if (normalized < 0.25) {
                    r = 0; g = Math.floor(normalized * 4 * 212); b = 255;
                } else if (normalized < 0.5) {
                    r = 0;
                    g = 212 + Math.floor((normalized - 0.25) * 4 * 43);
                    b = Math.floor(255 - (normalized - 0.25) * 4 * 255);
                } else if (normalized < 0.75) {
                    r = Math.floor((normalized - 0.5) * 4 * 255); g = 255; b = 0;
                } else {
                    r = 255; g = Math.floor(255 - (normalized - 0.75) * 4 * 255); b = 0;
                }
                const alpha = Math.floor(normalized * 180);
                for (let dy = 0; dy < resolution; dy++) {
                    for (let dx = 0; dx < resolution; dx++) {
                        const idx = ((py + dy) * canvas.width + (px + dx)) * 4;
                        imageData.data[idx] = r;
                        imageData.data[idx + 1] = g;
                        imageData.data[idx + 2] = b;
                        imageData.data[idx + 3] = alpha;
                    }
                }
            }
        });
        ctx.putImageData(imageData, 0, 0);
    }, [forecast]);

    // Single animation effect: resets to step 0 on a new timeline, then ticks every 2 s.
    // Pause is controlled via isPausedRef so the interval never needs to restart on hover.
    useEffect(() => {
        isPausedRef.current = false;
        setIsPaused(false);
        setLocalStep(0);
        if (forecastTimeline.length === 0) return;
        const id = setInterval(() => {
            if (!isPausedRef.current) {
                setLocalStep(prev => (prev + 1) % forecastTimeline.length);
            }
        }, 1300);
        return () => clearInterval(id);
    }, [forecastTimeline]); // isPaused intentionally omitted — managed via ref

    // Derived animation state (must precede pathPoints so we can slice the trail)
    const isAnimating = forecastTimeline.length > 0;
    const currentTimelineStep = isAnimating ? forecastTimeline[localStep] : null;

    // Build real path SVG points from forecast.realPath.
    // When animating, reveal only up to the current step's second so the trail
    // grows in sync with the animation. Otherwise show all points up to trajectorySeconds.
    const realPath = forecast?.realPath ?? [];
    const trailCap = isAnimating ? (currentTimelineStep?.second ?? 0) : trajectorySeconds;
    const pathPoints = realPath
        .filter(pt => pt.second <= trailCap)
        .map(pt => ({
            cx: scaleX(pt.x),
            cy: scaleY(pt.y),
            second: pt.second,
        }));

    console.log("Rendering PitchVisualization with forecast:", forecast);

    return (
        <div className="flex flex-col w-full">
            {/* ── Timeline playback control bar ── */}
            {isAnimating && (
                <div
                    className="flex items-center gap-3 px-4 py-2 mb-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    {/* Play / Pause button */}
                    <button
                        onClick={() => {
                            const next = !isPaused;
                            setIsPaused(next);
                            isPausedRef.current = next;
                        }}
                        className="text-sports-secondary hover:text-white transition-colors flex-shrink-0"
                        title={isPaused ? 'Play' : 'Pause'}
                    >
                        {isPaused ? (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 15,8 3,15" /></svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <rect x="2" y="1" width="4" height="14" /><rect x="10" y="1" width="4" height="14" />
                            </svg>
                        )}
                    </button>
                    {/* Step counter */}
                    <span className="text-sm font-mono text-white flex-shrink-0">
                        Step {localStep + 1}&nbsp;/&nbsp;{forecastTimeline.length}
                    </span>
                    {/* Segmented progress bar — each segment is individually clickable */}
                    <div className="flex-1 flex gap-0.5">
                        {forecastTimeline.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setLocalStep(i); setIsPaused(true); }}
                                className="flex-1 h-2 rounded-full transition-all"
                                style={{
                                    background: i <= localStep ? '#FFD700' : 'rgba(255,255,255,0.15)',
                                    opacity: i === localStep ? 1 : 0.65,
                                }}
                                title={`Step ${i + 1}`}
                            />
                        ))}
                    </div>
                    {/* Horizon label */}
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        t+{currentTimelineStep?.second ?? ''}s
                    </span>
                </div>
            )}

            <div
                className="relative w-full"
                onMouseEnter={() => { if (isAnimating) { isPausedRef.current = true; setIsPaused(true); } }}
                onMouseLeave={() => { if (isAnimating) { isPausedRef.current = false; setIsPaused(false); } }}
            >
                {/* ── Pitch loading overlay ── */}
                {state.loading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-lg"
                        style={{ background: 'rgba(10,20,15,0.72)', backdropFilter: 'blur(3px)' }}>
                        <svg width="90" height="90" viewBox="0 0 90 90">
                            {/* Background ring */}
                            <circle cx="45" cy="45" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                            {/* Spinning arc */}
                            <circle
                                cx="45" cy="45" r="36"
                                fill="none"
                                stroke="url(#spin-grad)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray="80 145"
                                strokeDashoffset="0"
                            >
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 45 45"
                                    to="360 45 45"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                            </circle>
                            <defs>
                                <linearGradient id="spin-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#00ff88" />
                                    <stop offset="100%" stopColor="#6e4cff" />
                                </linearGradient>
                            </defs>
                            {/* Pulsing center dot */}
                            <circle cx="45" cy="45" r="7" fill="#00ff88" opacity="0.9">
                                <animate attributeName="r" values="7;10;7" dur="1.2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.2s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                        <p className="mt-4 text-sm font-semibold tracking-widest uppercase"
                            style={{ color: '#00ff88', textShadow: '0 0 12px rgba(0,255,136,0.6)' }}>
                            Generating Forecast…
                        </p>
                        <p className="mt-1 text-xs text-gray-400">Running TCN model inference</p>
                    </div>
                )}

                <svg
                    width={SVG_WIDTH}
                    height={SVG_HEIGHT}
                    className="w-full h-auto"
                    viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                >
                    {/* Arrow marker definition for real path */}
                    <defs>
                        <marker
                            id="real-path-arrow"
                            markerWidth="3"
                            markerHeight="3"
                            refX="6"
                            refY="3"
                            orient="auto"
                        >
                            <path d="M0,0 L0,6 L8,3 z" fill="#FFD700" opacity="0.9" />
                        </marker>
                    </defs>

                    {/* Pitch background */}
                    <rect
                        x={PADDING} y={PADDING}
                        width={PITCH_SVG_WIDTH} height={PITCH_SVG_HEIGHT}
                        fill="#1a4d2e" stroke="#ffffff" strokeWidth="2"
                    />

                    {/* Center line */}
                    <line
                        x1={PADDING + PITCH_SVG_WIDTH / 2} y1={PADDING}
                        x2={PADDING + PITCH_SVG_WIDTH / 2} y2={PADDING + PITCH_SVG_HEIGHT}
                        stroke="#ffffff" strokeWidth="1.5" opacity="0.6"
                    />

                    {/* Center circle */}
                    <circle
                        cx={PADDING + PITCH_SVG_WIDTH / 2}
                        cy={PADDING + PITCH_SVG_HEIGHT / 2}
                        r={PITCH_SVG_HEIGHT / 6}
                        fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6"
                    />

                    {/* Penalty areas */}
                    <rect
                        x={PADDING} y={PADDING + PITCH_SVG_HEIGHT / 4}
                        width={PITCH_SVG_WIDTH / 8} height={PITCH_SVG_HEIGHT / 2}
                        fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6"
                    />
                    <rect
                        x={PADDING + PITCH_SVG_WIDTH * 7 / 8} y={PADDING + PITCH_SVG_HEIGHT / 4}
                        width={PITCH_SVG_WIDTH / 8} height={PITCH_SVG_HEIGHT / 2}
                        fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6"
                    />

                    {/* Grid overlay */}
                    {Array.from({ length: GRID_ROWS + 1 }).map((_, row) => (
                        <line
                            key={`h-${row}`}
                            x1={PADDING} y1={PADDING + row * zoneHeight}
                            x2={PADDING + PITCH_SVG_WIDTH} y2={PADDING + row * zoneHeight}
                            stroke="#00ff88" strokeWidth="0.5" opacity="0.3"
                        />
                    ))}
                    {Array.from({ length: GRID_COLS + 1 }).map((_, col) => (
                        <line
                            key={`v-${col}`}
                            x1={PADDING + col * zoneWidth} y1={PADDING}
                            x2={PADDING + col * zoneWidth} y2={PADDING + PITCH_SVG_HEIGHT}
                            stroke="#00ff88" strokeWidth="0.5" opacity="0.3"
                        />
                    ))}

                    {/* Zone number labels (semi-transparent) */}
                    {Array.from({ length: GRID_ROWS * GRID_COLS }).map((_, idx) => {
                        const { x, y } = getZoneCoords(idx);
                        return (
                            <text
                                key={`zone-label-${idx}`}
                                x={x + zoneWidth / 2}
                                y={y + zoneHeight / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="35"
                                fill="#00ff88"
                                opacity="0.25"
                                pointerEvents="none"
                                fontWeight="500"
                            >
                                {idx}
                            </text>
                        );
                    })}

                    {/* Zone highlights for top predictions – dimmed during animation */}
                    {forecast?.probabilities?.map((prob, idx) => {
                        const { x, y } = getZoneCoords(prob.zone_id);
                        const hue = 240 * (1 - prob.probability);
                        const fillColor = `hsl(${hue}, 70%, 50%)`;
                        const baseOpacity = isAnimating ? 0.08 : (0.4 + (prob.probability * 0.4));
                        return (
                            <motion.rect
                                key={`zone-${prob.zone_id}`}
                                x={x} y={y}
                                width={zoneWidth} height={zoneHeight}
                                fill={fillColor}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: baseOpacity, scale: 1 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                onMouseEnter={() => !isAnimating && setHoveredZone(prob)}
                                onMouseLeave={() => !isAnimating && setHoveredZone(null)}
                                className="cursor-pointer"
                                style={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                            />
                        );
                    })}

                    {/* Animated zone highlights for the current timeline step */}
                    {isAnimating && currentTimelineStep?.zones?.map((zoneId, idx) => {
                        const prob = currentTimelineStep.probabilities[idx] ?? 0;
                        const { x, y } = getZoneCoords(zoneId);
                        const hue = 240 * (1 - prob);
                        const fillColor = `hsl(${hue}, 80%, 55%)`;
                        const opacity = 0.45 + (prob * 0.45);
                        return (
                            <motion.rect
                                key={`tl-zone-${zoneId}-${localStep}`}
                                x={x} y={y}
                                width={zoneWidth} height={zoneHeight}
                                fill={fillColor}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity, scale: 1 }}
                                transition={{ duration: 0.35, delay: idx * 0.08 }}
                                style={{ stroke: 'rgba(255,215,0,0.4)', strokeWidth: 1.5 }}
                            />
                        );
                    })}

                    {/* ── Real path: animated arrows between per-second positions ── */}
                    {pathPoints.length > 1 && pathPoints.slice(0, -1).map((pt, idx) => {
                        const next = pathPoints[idx + 1];
                        const dx = next.cx - pt.cx;
                        const dy = next.cy - pt.cy;
                        const len = Math.sqrt(dx * dx + dy * dy) || 1;
                        const trim = 10;
                        const x2 = next.cx - (dx / len) * trim;
                        const y2 = next.cy - (dy / len) * trim;
                        return (
                            <motion.line
                                key={`rp-arrow-${idx}`}
                                x1={pt.cx} y1={pt.cy}
                                x2={x2} y2={y2}
                                stroke="#FFD700"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                markerEnd="url(#real-path-arrow)"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.9 }}
                                transition={{ duration: 0.4, delay: 0.3 + idx * 0.25, ease: 'easeOut' }}
                            />
                        );
                    })}

                    {/* Real path dots — each pulses once it appears */}
                    {pathPoints.map((pt, idx) => {
                        const pulseDur = `${1.4 + idx * 0.3}s`;
                        const baseR = 3.5 + idx * 0.2;
                        return (
                            <motion.g
                                key={`rp-dot-${idx}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: 0.2 + idx * 0.25, type: 'spring', stiffness: 260 }}
                            >
                                {/* Outer ring pulse */}
                                <circle cx={pt.cx} cy={pt.cy} r={baseR + 4} fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.5">
                                    <animate attributeName="r" values={`${baseR + 2};${baseR + 9};${baseR + 2}`} dur={pulseDur} repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;0;0.5" dur={pulseDur} repeatCount="indefinite" />
                                </circle>
                                {/* Core dot */}
                                <circle cx={pt.cx} cy={pt.cy} r={baseR} fill="#FFD700" opacity="0.95">
                                    <animate attributeName="r" values={`${baseR};${baseR + 1.5};${baseR}`} dur={pulseDur} repeatCount="indefinite" />
                                </circle>
                            </motion.g>
                        );
                    })}

                    {/* Current position (pink pulsing dot) */}
                    {forecast?.currentPosition && (
                        <motion.circle
                            cx={scaleX(forecast.currentPosition.x)}
                            cy={scaleY(forecast.currentPosition.y)}
                            r="6"
                            fill="#ff3366"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />
                        </motion.circle>
                    )}

                    {/* Animated real position dot for the current timeline step (gold) */}
                    {isAnimating && currentTimelineStep?.realX != null && (
                        <motion.g
                            key={`tl-pos-${localStep}`}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, type: 'spring', stiffness: 300 }}
                        >
                            <circle
                                cx={scaleX(currentTimelineStep.realX)}
                                cy={scaleY(currentTimelineStep.realY)}
                                r={12} fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5"
                            >
                                <animate attributeName="r" values="12;18;12" dur="1.5s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                            <circle
                                cx={scaleX(currentTimelineStep.realX)}
                                cy={scaleY(currentTimelineStep.realY)}
                                r={7} fill="#FFD700" opacity="0.95"
                            >
                                <animate attributeName="r" values="7;9;7" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                        </motion.g>
                    )}

                    {/* True end position (green ring + dot) — always the last point of the visible trail */}
                    {(() => {
                        // Use the last rendered path point so the green dot is always
                        // anchored to the tip of the growing trail (pathPoints already
                        // respects the per-step trailCap). Fall back to forecast.truePosition
                        // only when no real path data is available yet.
                        const lastPt = pathPoints.length > 0
                            ? pathPoints[pathPoints.length - 1]
                            : null;
                        const cx = lastPt?.cx ?? (forecast?.truePosition ? scaleX(forecast.truePosition.x) : null);
                        const cy = lastPt?.cy ?? (forecast?.truePosition ? scaleY(forecast.truePosition.y) : null);
                        if (cx == null || cy == null) return null;
                        return (
                            <motion.g
                                key={`true-pos-${isAnimating ? localStep : 'static'}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: isAnimating ? 0 : 0.3 }}
                            >
                                <circle cx={cx} cy={cy} r="8" fill="none" stroke="#00ff88" strokeWidth="2" />
                                <circle cx={cx} cy={cy} r="4" fill="#00ff88" />
                            </motion.g>
                        );
                    })()}
                </svg>

                {/* Time range label */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 0.4, y: 5 }}
                    className="absolute bottom-4 right-4 rounded-lg p-3 text-sm"
                >
                    <div className="font-semibold text-sports-secondary">
                        {forecast?.sequenceStartTime && `from ${forecast.sequenceStartTime}s to ${forecast.sequenceEndTime}s`}
                    </div>
                </motion.div>

                {/* Hover tooltip – step detail when animating+paused, zone detail otherwise */}
                {isAnimating && isPaused && currentTimelineStep ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 glass-effect rounded-lg p-3 text-sm"
                        style={{ minWidth: 160 }}
                    >
                        <div className="font-semibold text-[#FFD700] mb-1">
                            t+{currentTimelineStep.second}s &middot; Step {localStep + 1}/{forecastTimeline.length}
                        </div>
                        {currentTimelineStep.zones.map((zoneId, i) => (
                            <div key={zoneId} className="flex justify-between gap-4 text-xs">
                                <span className="text-gray-300">Zone {zoneId}</span>
                                <span className="text-sports-primary font-mono">
                                    {((currentTimelineStep.probabilities[i] ?? 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </motion.div>
                ) : (hoveredZone && !isAnimating) ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-4 left-4 glass-effect rounded-lg p-3 text-sm"
                    >
                        <div className="font-semibold text-sports-secondary">Zone {hoveredZone.zone_id}</div>
                        <div className="text-sports-primary">
                            Probability: {(hoveredZone.probability * 100).toFixed(1)}%
                        </div>
                    </motion.div>
                ) : null}

            </div>{/* end relative pitch wrapper */}

            {/* Legend — thin full-width strip directly beneath the pitch */}
            {forecast?.realPath?.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="w-full flex items-center justify-center gap-8 px-4 py-2 text-xs"
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)',
                    }}
                >
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ff3366] flex-shrink-0"></span>
                        <span className="text-gray-400">Current Position</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FFD700] flex-shrink-0"></span>
                        <span className="text-gray-400">Real Path (per second)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#00ff88] flex-shrink-0"></span>
                        <span className="text-gray-400">True End Position</span>
                    </div>
                    {isAnimating && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FFD700] flex-shrink-0" style={{ boxShadow: '0 0 4px #FFD700' }}></span>
                            <span className="text-gray-400">Forecast Position (animated)</span>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}

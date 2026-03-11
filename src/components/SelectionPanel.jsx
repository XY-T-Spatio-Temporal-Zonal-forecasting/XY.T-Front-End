import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProject } from '../context/ProjectContext';
import mockService from '../services/mockService';
import apiService from '../services/apiService';

// Animated shimmer skeleton row
function SkeletonRow({ wide = false }) {
    return (
        <div className="w-full p-3 rounded-lg mb-1 bg-white/5 border border-white/10 animate-pulse">
            <div className={`h-3.5 rounded bg-white/10 mb-2 ${wide ? 'w-3/4' : 'w-1/2'}`} />
            <div className="h-2.5 rounded bg-white/5 w-2/5" />
        </div>
    );
}

export default function SelectionPanel() {
    const { state, actions } = useProject();
    const [games, setGames] = useState([]);
    const [players, setPlayers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loadingGames, setLoadingGames] = useState(true);
    const [loadingPlayers, setLoadingPlayers] = useState(false);

    const setTimeRange = (matchId) => {
        for (let game of games) {
            if (game.match_id === matchId) {
                actions.setTimeRange({ start: game.starting_timestamp, end: game.ending_timestamp });
                break;
            }
        }
    };

    // Fetch games on mount
    useEffect(() => {
        const fetchGames = async () => {
            setLoadingGames(true);
            try {
                const data = await apiService.getGames();
                setGames(data);
            } catch (error) {
                actions.setError('Failed to load games');
            } finally {
                setLoadingGames(false);
            }
        };
        fetchGames();
    }, []);

    // Fetch players when game changes
    useEffect(() => {
        if (state.selectedGame) {
            const fetchPlayers = async () => {
                setLoadingPlayers(true);
                setPlayers([]);
                try {
                    const data = await apiService.getPlayers(state.selectedGame.match_id);
                    setTimeRange(state.selectedGame.match_id);
                    setPlayers(data);
                } catch (error) {
                    actions.setError('Failed to load players');
                } finally {
                    setLoadingPlayers(false);
                }
            };
            fetchPlayers();
        } else {
            setPlayers([]);
        }
    }, [state.selectedGame]);

    // Filter players by search term
    const filteredPlayers = players.filter(
        (player) =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
            player.team_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`space-y-6 ${state.loading ? 'pointer-events-none' : ''}`}>
            {/* ── Game Selection ── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`glass-effect rounded-xl p-6 transition-opacity ${state.loading ? 'opacity-50' : ''}`}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-sports-primary">Select Game</h2>
                    {loadingGames && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-sports-primary animate-pulse inline-block" />
                            Loading…
                        </span>
                    )}
                </div>

                <div className="space-y-2 overflow-y-auto p-1 max-h-96 custom-scrollbar overflow-x-hidden">
                    {loadingGames ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <SkeletonRow key={i} wide={i % 2 === 0} />
                        ))
                    ) : (
                        games.map((game) => (
                            <motion.button
                                key={game.match_id}
                                onClick={() => actions.setGame(game)}
                                disabled={state.loading}
                                className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                                    state.selectedGame?.match_id === game.match_id
                                        ? 'bg-sports-primary/20 border-2 border-sports-primary glow-primary'
                                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                } ${state.loading ? 'cursor-not-allowed' : ''}`}
                                whileHover={state.loading ? {} : { scale: 1.02 }}
                                whileTap={state.loading ? {} : { scale: 0.98 }}
                            >
                                <div className="font-semibold text-white">
                                    {game.home_team} vs {game.away_team}
                                </div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {game.venue} • {new Date(game.date).toLocaleDateString()}
                                </div>
                            </motion.button>
                        ))
                    )}
                </div>
            </motion.div>

            {/* ── Player Selection ── */}
            {state.selectedGame && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`glass-effect rounded-xl p-4 transition-opacity ${state.loading ? 'opacity-50' : ''}`}
                >
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-semibold text-sports-secondary">Select Player</h2>
                        {loadingPlayers && (
                            <span className="flex items-center gap-1.5 text-xs text-gray-400">
                                <span className="w-2 h-2 rounded-full bg-sports-secondary animate-pulse inline-block" />
                                Loading…
                            </span>
                        )}
                    </div>

                    {/* Search input — hidden while players are loading */}
                    {!loadingPlayers && (
                        <div className="mb-4 p-2">
                            <input
                                type="text"
                                placeholder="Search by name, position, or team..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={state.loading}
                                className={`w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-sports-secondary focus:ring-2 focus:ring-sports-secondary/50 transition-all ${
                                    state.loading ? 'cursor-not-allowed opacity-60' : ''
                                }`}
                            />
                        </div>
                    )}

                    {/* Player list */}
                    <div className="space-y-2 max-h-96 p-3 overflow-y-auto custom-scrollbar overflow-x-hidden">
                        {loadingPlayers ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonRow key={i} wide={i % 3 !== 2} />
                            ))
                        ) : filteredPlayers.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No players found</div>
                        ) : (
                            filteredPlayers.map((player) => (
                                <motion.button
                                    key={player.player_id}
                                    onClick={() => actions.setPlayer(player)}
                                    disabled={state.loading}
                                    className={`w-full text-left p-2 mb-2 rounded-lg transition-all ${
                                        state.selectedPlayer?.player_id === player.player_id
                                            ? 'bg-sports-secondary/20 border-2 border-sports-secondary glow-secondary'
                                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                                    } ${state.loading ? 'cursor-not-allowed' : ''}`}
                                    whileHover={state.loading ? {} : { scale: 1.02 }}
                                    whileTap={state.loading ? {} : { scale: 0.98 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-white flex items-center gap-2">
                                                <span className="text-sports-primary">#{player.number}</span>
                                                {player.name}
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                {player?.position ?? 'N/A'} • {player.team_name}
                                            </div>
                                        </div>
                                        {state.selectedPlayer?.player_id === player.player_id && (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-3 h-3 rounded-full bg-sports-secondary"
                                            />
                                        )}
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>
                </motion.div>
            )}

            {/* Info panel — only when no game selected and done loading */}
            {!state.selectedGame && !loadingGames && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass-effect rounded-xl p-6 border-l-4 border-sports-accent"
                >
                    <div className="flex items-start gap-3">
                        <div className="text-sports-accent text-2xl">ℹ️</div>
                        <div>
                            <h3 className="font-semibold text-white mb-1">Get Started</h3>
                            <p className="text-sm text-gray-400">
                                Select a game to view available players and start forecasting trajectories.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

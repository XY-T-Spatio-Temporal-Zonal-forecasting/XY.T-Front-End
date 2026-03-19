// API Service for Football Trajectory Forecasting
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || " https://unrocky-contradictious-alberta.ngrok-free.dev/api";

class ApiService {
/**
 * Fetch all available games
 * @returns {Promise<Array>} List of games
 */
async getGames() {
try {
const response = await fetch(`${API_BASE_URL}/match/all`, {
cache: "no-store",
headers: {
"ngrok-skip-browser-warning": true,
},
});
console.log("API Response for games:", response);
if (!response.ok) throw new Error("Failed to fetch games");
return await response.json();
} catch (error) {
console.error("Error fetching games:", error);
throw error;
}
}

/**
 * Fetch players for a specific game
 * @param {string} match_id - The game ID
 * @returns {Promise<Array>} List of players
 */
async getPlayers(match_id) {
try {
const response = await fetch(`${API_BASE_URL}/match/${match_id}/players`, {
cache: "no-store",
headers: {
"ngrok-skip-browser-warning": true,
},
});
if (!response.ok) throw new Error("Failed to fetch players");
return await response.json();
} catch (error) {
console.error("Error fetching players:", error);
throw error;
}
}

/**
 * Get forecast for a player's trajectory
 * @param {Object} payload - Forecast request payload
 * @param {string} payload.gameId - Game ID
 * @param {string} payload.playerId - Player ID
 * @param {Array} payload.sequence - Input tracking sequence
 * @param {number} payload.startTime - Start time of sequence
 * @param {number} payload.endTime - End time of sequence
 * @returns {Promise<Object>} Forecast result with predicted_zone_id, probabilities, gmm_parameters
 */
// async getForecast(payload) {
//   try {
//     const response = await fetch(`${API_BASE_URL}/forecast`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(payload),
//     });

//     if (!response.ok) throw new Error('Failed to get forecast');
//     return await response.json();
//   } catch (error) {
//     console.error('Error getting forecast:', error);
//     throw error;
//   }
// }

/**
 * Get tracking data for a specific player in a game
 * @param {string} match_id - Game ID
 * @param {string} player_id - Player ID
 * @param {number} start_time - Starting frame number for the sequence
 * @param {number} top_k - Number of top predictions to return
 * @returns {Promise<Array>} Tracking data points
 */
async getForecast(payload) {
try {
const response = await fetch(`${API_BASE_URL}/match/forecast`, {
method: "POST",
cache: "no-store",
headers: {
"Content-Type": "application/json",
"ngrok-skip-browser-warning": true,
},
body: JSON.stringify(payload),
});
if (!response.ok) throw new Error("Failed to fetch tracking data");
return await response.json();
} catch (error) {
console.error("Error fetching tracking data:", error);
throw error;
}
}

/**
 * Get per-timestep forecast timeline for animated playback
 * @param {Object} payload - Same shape as getForecast payload
 * @returns {Promise<Object>} { forecastTimeline: [{second, zones, probabilities, realX, realY}] }
 */
async getForecastTimeline(payload) {
try {
const response = await fetch(`${API_BASE_URL}/match/forecast/timeline`, {
method: "POST",
cache: "no-store",

headers: {
"Content-Type": "application/json",
"ngrok-skip-browser-warning": true,
},
body: JSON.stringify(payload),
});
if (!response.ok) throw new Error("Failed to fetch forecast timeline");
return await response.json();
} catch (error) {
console.error("Error fetching forecast timeline:", error);
throw error;
}
}

/**
 * Get AI tactical analysis for a forecast via Gemini LLM
 * @param {Object} payload - TacticalAnalysisRequest
 * @returns {Promise<{analysis: string, model: string}>}
 */
async getTacticalAnalysis(payload) {
try {
const response = await fetch(`${API_BASE_URL}/match/tactical-analysis`, {
method: "POST",
headers: {
"Content-Type": "application/json",
"ngrok-skip-browser-warning": true,
},
body: JSON.stringify(payload),
cache: "no-store",
});
if (!response.ok) throw new Error("Failed to get tactical analysis");
return await response.json();
} catch (error) {
console.error("Error getting tactical analysis:", error);
throw error;
}
}
}

export default new ApiService();

// Mock API Service for Testing
// Simulates the backend API with realistic football trajectory data



const MOCK_GAMES = [
  { id: 'game-001', name: 'Manchester United vs Liverpool', date: '2024-03-15', stadium: 'Old Trafford' },
  { id: 'game-002', name: 'Barcelona vs Real Madrid', date: '2024-03-16', stadium: 'Camp Nou' },
  { id: 'game-003', name: 'Bayern Munich vs Dortmund', date: '2024-03-17', stadium: 'Allianz Arena' },
  
];

const MOCK_PLAYERS = {
  'game-001': [
    { id: 'player-001', name: 'Marcus Rashford', number: 10, position: 'Forward', team: 'Manchester United' },
    { id: 'player-002', name: 'Bruno Fernandes', number: 8, position: 'Midfielder', team: 'Manchester United' },
    { id: 'player-003', name: 'Mohamed Salah', number: 11, position: 'Forward', team: 'Liverpool' },
    { id: 'player-004', name: 'Virgil van Dijk', number: 4, position: 'Defender', team: 'Liverpool' },
  ],
  'game-002': [
    { id: 'player-005', name: 'Robert Lewandowski', number: 9, position: 'Forward', team: 'Barcelona' },
    { id: 'player-006', name: 'Pedri', number: 8, position: 'Midfielder', team: 'Barcelona' },
    { id: 'player-007', name: 'Vinicius Jr', number: 7, position: 'Forward', team: 'Real Madrid' },
    { id: 'player-008', name: 'Luka Modric', number: 10, position: 'Midfielder', team: 'Real Madrid' },
  ],
  'game-003': [
    { id: 'player-009', name: 'Harry Kane', number: 9, position: 'Forward', team: 'Bayern Munich' },
    { id: 'player-010', name: 'Joshua Kimmich', number: 6, position: 'Midfielder', team: 'Bayern Munich' },
  ],
};

// Football pitch dimensions: 105m x 68m
// Grid: 4 rows x 16 columns = 64 zones

// Generate mock tracking data
function generateMockTrackingData(playerId, duration = 300) {
  const data = [];
  let x = Math.random() * PITCH_WIDTH;
  let y = Math.random() * PITCH_HEIGHT;
  
  for (let t = 0; t < duration; t++) {
    // Simulate realistic movement
    x += (Math.random() - 0.5) * 2;
    y += (Math.random() - 0.5) * 1.5;
    
    // Keep within bounds
    x = Math.max(0, Math.min(PITCH_WIDTH, x));
    y = Math.max(0, Math.min(PITCH_HEIGHT, y));
    
    data.push({
      timestamp: t,
      x: x,
      y: y,
      velocity: Math.random() * 8 + 2, // 2-10 m/s
    });
  }
  
  return data;
}

// Convert coordinates to zone ID (0-63)
function coordsToZone(x, y) {
  const col = Math.floor((x / PITCH_WIDTH) * GRID_COLS);
  const row = Math.floor((y / PITCH_HEIGHT) * GRID_ROWS);
  return Math.min(63, Math.max(0, row * GRID_COLS + col));
}

// Generate mock forecast with MDN parameters
function generateMockForecast(sequence) {
  // Get last position from sequence
  const lastPoint = sequence[sequence.length - 1];
  
  // Predict next position with some randomness
  const predictedX = Math.max(0, Math.min(PITCH_WIDTH, lastPoint.x + (Math.random() - 0.5) * 10));
  const predictedY = Math.max(0, Math.min(PITCH_HEIGHT, lastPoint.y + (Math.random() - 0.5) * 8));
  
  const predictedZone = coordsToZone(predictedX, predictedY);
  
  // Generate zone probabilities (top 3 zones)
  const probabilities = [];
  const zones = [predictedZone];
  
  // Add neighboring zones
  if (predictedZone % GRID_COLS > 0) zones.push(predictedZone - 1);
  if (predictedZone % GRID_COLS < GRID_COLS - 1) zones.push(predictedZone + 1);
  if (predictedZone >= GRID_COLS) zones.push(predictedZone - GRID_COLS);
  if (predictedZone < 64 - GRID_COLS) zones.push(predictedZone + GRID_COLS);
  
  // Generate probabilities that sum to ~1.0
  const probs = zones.slice(0, 3).map(() => Math.random());
  const sum = probs.reduce((a, b) => a + b, 0);
  
  zones.slice(0, 3).forEach((zone, i) => {
    probabilities.push({
      zone_id: zone,
      probability: probs[i] / sum,
    });
  });
  
  // Sort by probability descending
  probabilities.sort((a, b) => b.probability - a.probability);
  
  // Generate GMM parameters (Gaussian Mixture Model for MDN)
  // 5 mixture components as per your notebook
  const numComponents = 5;
  const gmmParameters = {
    means: [],
    covariances: [],
    weights: [],
  };
  
  for (let i = 0; i < numComponents; i++) {
    // Mean positions (x, y)
    const offsetX = (Math.random() - 0.5) * 15;
    const offsetY = (Math.random() - 0.5) * 10;
    gmmParameters.means.push([
      predictedX + offsetX,
      predictedY + offsetY,
    ]);
    
    // Covariance matrices (2x2 for x, y)
    const sigma_x = Math.random() * 3 + 1;
    const sigma_y = Math.random() * 2 + 0.5;
    gmmParameters.covariances.push([
      [sigma_x * sigma_x, 0],
      [0, sigma_y * sigma_y],
    ]);
    
    // Mixture weights (should sum to 1)
    gmmParameters.weights.push(Math.random());
  }
  
  // Normalize weights
  const weightSum = gmmParameters.weights.reduce((a, b) => a + b, 0);
  gmmParameters.weights = gmmParameters.weights.map(w => w / weightSum);
  
  return {
    predicted_zone_id: predictedZone,
    predicted_coordinates: { x: predictedX, y: predictedY },
    probabilities,
    gmm_parameters: gmmParameters,
    metadata: {
      model: 'TCN-MDN',
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
      timestamp: new Date().toISOString(),
    },
  };
}

class MockApiService {
  async getGames() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_GAMES;
  }

  async getPlayers(gameId) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_PLAYERS[gameId] || [];
  }

  async getTrackingData(gameId, playerId) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return generateMockTrackingData(playerId);
  }

  async getForecast(payload) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { sequence } = payload;
    if (!sequence || sequence.length === 0) {
      throw new Error('Invalid sequence data');
    }
    
    return generateMockForecast(sequence);
  }
}

export default new MockApiService();
export { coordsToZone };

# Football Trajectory Forecasting Dashboard

A React + Tailwind CSS dashboard for visualizing football player trajectory predictions using a TCN-MDN (Temporal Convolutional Network - Mixture Density Network) deep learning model.

## Features

- **Interactive Pitch Visualization**: SVG-based football pitch with 4×16 zonal grid (64 zones)
- **MDN Heatmap**: Real-time probability density visualization using Gaussian Mixture Models
- **Player Tracking**: Animated trajectory paths with temporal controls
- **Prediction Metrics**: Top-3 zonal probabilities and detailed MDN parameters (μ, σ, π)
- **Dark Theme**: Sports analytics aesthetic with glassmorphism effects
- **Smooth Animations**: Powered by Framer Motion

## Tech Stack

- **React** (Vite)
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Mock API Service** for testing (can be replaced with real backend)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── PitchVisualization.jsx
│   ├── SelectionPanel.jsx
│   ├── TemporalControl.jsx
│   └── PredictionMetrics.jsx
├── context/            # State management
│   └── ProjectContext.jsx
├── hooks/              # Custom React hooks
├── pages/              # Page components
│   └── Dashboard.jsx
├── services/           # API services
│   ├── apiService.js
│   └── mockService.js
└── utils/              # Utility functions
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK_DATA=true
```

## API Integration

The dashboard expects the following API endpoints:

- `GET /api/games` - List of available games
- `GET /api/games/{id}/players` - Players in a specific game
- `GET /api/games/{id}/players/{playerId}/tracking` - Tracking data
- `POST /api/forecast` - Generate trajectory forecast

### Forecast Request Format

```json
{
  "gameId": "game-001",
  "playerId": "player-001",
  "sequence": [...],
  "startTime": 0,
  "endTime": 100
}
```

### Forecast Response Format

```json
{
  "predicted_zone_id": 42,
  "predicted_coordinates": { "x": 52.5, "y": 34.0 },
  "probabilities": [
    { "zone_id": 42, "probability": 0.65 },
    { "zone_id": 43, "probability": 0.25 },
    { "zone_id": 41, "probability": 0.10 }
  ],
  "gmm_parameters": {
    "means": [[52.5, 34.0], ...],
    "covariances": [[[4.0, 0], [0, 2.0]], ...],
    "weights": [0.3, 0.25, 0.2, 0.15, 0.1]
  },
  "metadata": {
    "model": "TCN-MDN",
    "confidence": 0.85,
    "timestamp": "2024-03-15T10:30:00Z"
  }
}
```

## Mock Data

The app includes a comprehensive mock service (`mockService.js`) that simulates the backend API with realistic football data. This allows you to develop and test the UI without a live backend.

## License

MIT

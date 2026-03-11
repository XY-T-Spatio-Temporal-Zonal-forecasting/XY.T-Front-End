# Football Trajectory Forecasting Dashboard

A React + Tailwind CSS dashboard for visualizing football player trajectory predictions using a TCN (Temporal Convolutional Network) deep learning model.

## Features

- **Interactive Pitch Visualization**: SVG-based football pitch with 3x9 zonal grid (27 zones) and player position tracking
- **Player Tracking**: Animated trajectory paths with temporal controls
- **Tactical Coach**: AI-powered tactical recommendations and strategic analysis with formatted insights
- **Prediction Metrics**: Top-3 zonal probabilities
- **Temporal Control**: Timeline scrubber for exploring match data across different time points
- **Selection Panel**: Intuitive interface for selecting and filtering match data
- **Dark Theme**: Sports analytics aesthetic with glassmorphism effects
- **Smooth Animations**: Powered by Framer Motion and GPU-accelerated transitions
- **Responsive Design**: Fully responsive layout that works on desktop and tablet devices

## Tech Stack

- **Frontend Framework**: React 19.2.0
- **Build Tool**: Vite 6.4.1
- **Styling**: Tailwind CSS 3.4.4 + PostCSS
- **Animation**: Framer Motion 12.34.0
- **Code Quality**: ESLint with React hooks support
- **Mock API Service** for development and testing

## Project Structure

```
src/
├── components/                    # Reusable UI components
│   ├── PitchVisualization.jsx     # Interactive pitch and player positions
│   ├── SelectionPanel.jsx         # Match/game selection interface
│   ├── TemporalControl.jsx        # Timeline and temporal navigation
│   ├── PredictionMetrics.jsx      # Performance and prediction display
│   └── TacticalCoach.jsx          # AI-powered tactical recommendations
├── context/                       # State management
│   └── ProjectContext.jsx         # Global project context
├── pages/                         # Page components
│   └── Dashboard.jsx              # Main dashboard layout
├── services/                      # API services
│   ├── apiService.js              # Backend API client
│   └── mockService.js             # Mock data for development
├── hooks/                         # Custom React hooks (extensible)
└── utils/                         # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

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

### Preview Production Build

```bash
npm run preview
```

### Code Quality

```bash
npm run lint
```

## Configuration

The development server is configured to proxy API requests to `http://localhost:8000`. Update the proxy configuration in `vite.config.js` if your backend runs on a different port.

Copy `.env.example` to `.env` if present and configure:

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
- `POST /api/tactical-analysis` - Get tactical coaching recommendations


## Mock Data

The app includes a comprehensive mock service (`mockService.js`) that simulates the backend API with realistic football data. This allows you to:
- Develop and test the UI without a live backend
- Prototype new features
- Test different data scenarios
- Validate component behavior

## Key Components

### PitchVisualization
Renders an interactive football pitch with:
- 3x9 zonal grid (27 zones total)
- Real-time player position markers
- Trajectory path animations

### SelectionPanel
Provides filtering and selection for:
- Match/game selection
- Player selection
- Time range filtering
- Data export options

### TemporalControl
Timeline interface featuring:
- Frame-by-frame navigation
- Play/pause controls
- Playback speed adjustment
- Current time display

### PredictionMetrics
Displays analytical data:
- Top-3/5 predicted zones with probabilities
- Confidence scores
- MDN parameters visualization
- Model metadata

### TacticalCoach
AI-powered analysis providing:
- Strategic recommendations
- Formation analysis
- Player movement insights
- Markdown-formatted output for readability

## Context API

The application uses React Context API for global state management via `ProjectContext`. This manages:
- Currently selected match/game
- Player selections
- Temporal position (frame number)
- Filter states
- API response data

## Performance Optimization

The project leverages:
- Vite for fast development and optimized production builds
- React 19's latest features for performance
- Framer Motion for GPU-accelerated animations
- Tailwind CSS for efficient styling
- Code splitting and lazy loading where applicable

## Browser Support

Works in all modern browsers that support:
- ES2020 JavaScript
- CSS Grid and Flexbox
- SVG rendering
- WebGL (for animations)

## Development Notes

### Adding New Components

1. Create component file in `src/components/`
2. Import and use `useProject()` hook for global state access
3. Use Tailwind classes for styling consistency
4. Leverage Framer Motion for animations

### Styling Guide

- Use Tailwind CSS utility classes
- Dark theme colors use `bg-gray-900`, `text-gray-100`, etc.
- Sports theme accent color: `text-sports-primary`
- Use `glassmorphism` effects for modern UI aesthetic

### API Integration

- All API calls go through `apiService.js`
- Mock service provides fallback during development
- Proxy configuration in `vite.config.js` for backend calls

## Contributing

1. Ensure code passes ESLint checks: `npm run lint`
2. Build locally to verify: `npm run build`
3. Test in development mode: `npm run dev`
4. Follow React best practices and component composition patterns

## Troubleshooting

### Port Already in Use
- Vite defaults to port 5173
- Change in `vite.config.js` if needed

### API Connection Issues
- Verify backend is running on `http://localhost:8000`
- Check proxy settings in `vite.config.js`
- Mock service will provide test data if backend is unavailable

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is v16 or higher: `node --version`



## License

MIT

## Support

For issues, questions, or feature requests, please create an issue in the repository.

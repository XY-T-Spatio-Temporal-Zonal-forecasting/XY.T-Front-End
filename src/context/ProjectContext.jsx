import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
    selectedGame: null,
    selectedPlayer: null,
    timeRange: { start: 0, end: 90*60 },
    topK: 3,
    trajectorySeconds: 3, // how many seconds of real path to show (1-20)
    forecast: {
       
        probabilities: [
            
        ], // Array of probabilities for each zone
        currentPosition: {
                x: null,
                y: null,
        }, // Current position of the player
        truePosition: {
                x: null,
                y: null,
        }, // True position of the player at the end of the sequence
        sequenceStartTime: null, // Start time of the input sequence
        sequenceEndTime: null, // End time of the input sequence
    },
    loading: false,
    error: null,
    forecastTimeline: [],
    timelineStep: 0,
};

// Action types
export const ActionTypes = {
    SET_GAME: 'SET_GAME',
    SET_PLAYER: 'SET_PLAYER',
    SET_TIME_RANGE: 'SET_TIME_RANGE',
    SET_TOP_K: 'SET_TOP_K',
    SET_TRAJECTORY_SECONDS: 'SET_TRAJECTORY_SECONDS',
    SET_FORECAST: 'SET_FORECAST',
    SET_FORECAST_TIMELINE: 'SET_FORECAST_TIMELINE',
    SET_TIMELINE_STEP: 'SET_TIMELINE_STEP',
    SET_LOADING: 'SET_LOADING',
    SET_ERROR: 'SET_ERROR',
    RESET_STATE: 'RESET_STATE',
};

// Reducer function
function projectReducer(state, action) {
    switch (action.type) {
        case ActionTypes.SET_GAME:
            return {
                ...state,
                selectedGame: action.payload,
                
                selectedPlayer: null, // Reset player when game changes
                forecast: null,
                forecastTimeline: [],
                timelineStep: 0,
            };

        case ActionTypes.SET_PLAYER:
            return {
                ...state,
                selectedPlayer: action.payload,
                forecast: null,
                forecastTimeline: [],
                timelineStep: 0,
            };
         case ActionTypes.SET_TOP_K:
            return {
                ...state,
                topK: action.payload,
            };

        case ActionTypes.SET_TRAJECTORY_SECONDS:
            return {
                ...state,
                trajectorySeconds: Math.min(20, Math.max(1, action.payload)),
            };

        case ActionTypes.SET_TIME_RANGE:
            return {
                ...state,
                timeRange: action.payload,
            };

        case ActionTypes.SET_FORECAST:
            return {
                ...state,
                forecast: action.payload,
                loading: false,
            };

        case ActionTypes.SET_FORECAST_TIMELINE:
            return {
                ...state,
                forecastTimeline: action.payload,
                timelineStep: 0,
            };

        case ActionTypes.SET_TIMELINE_STEP:
            return {
                ...state,
                timelineStep: action.payload,
            };

        case ActionTypes.SET_LOADING:
            return {
                ...state,
                loading: action.payload,
            };

        case ActionTypes.SET_ERROR:
            return {
                ...state,
                error: action.payload,
                loading: false,
            };

        case ActionTypes.RESET_STATE:
            return initialState;

        default:
            return state;
    }
}

// Create context
const ProjectContext = createContext(null);

// Provider component
export function ProjectProvider({ children }) {
    const [state, dispatch] = useReducer(projectReducer, initialState);

    // Action creators
    const setGame = useCallback((game) => {
        dispatch({ type: ActionTypes.SET_GAME, payload: game });
    }, []);

    const setPlayer = useCallback((player) => {
        dispatch({ type: ActionTypes.SET_PLAYER, payload: player });
    }, []);

 const setTopK = useCallback((topK) => {
        dispatch({ type: ActionTypes.SET_TOP_K, payload: topK });
    }, []);

    const setTrajectorySeconds = useCallback((seconds) => {
        dispatch({ type: ActionTypes.SET_TRAJECTORY_SECONDS, payload: seconds });
    }, []);
    const setTimeRange = useCallback((range) => {
        dispatch({ type: ActionTypes.SET_TIME_RANGE, payload: range });
    }, []);

    const setForecast = useCallback((forecast) => {
        dispatch({ type: ActionTypes.SET_FORECAST, payload: forecast });
    }, []);

    const setForecastTimeline = useCallback((timeline) => {
        dispatch({ type: ActionTypes.SET_FORECAST_TIMELINE, payload: timeline });
    }, []);

    const setTimelineStep = useCallback((step) => {
        dispatch({ type: ActionTypes.SET_TIMELINE_STEP, payload: step });
    }, []);

    const setLoading = useCallback((loading) => {
        dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
    }, []);

    const setError = useCallback((error) => {
        dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    }, []);

    const resetState = useCallback(() => {
        dispatch({ type: ActionTypes.RESET_STATE });
    }, []);

    const value = {
        state,
        actions: {
            setGame,
            setPlayer,
            setTopK,
            setTrajectorySeconds,
            setTimeRange,
            setForecast,
            setForecastTimeline,
            setTimelineStep,
            setLoading,
            setError,
            resetState,
        },
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}

// Custom hook to use the context
export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}

export default ProjectContext;

/* ============================================
   FoodLoop Context — global state + cross-tab sync
   ============================================ */

import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { foodLoopReducer, ACTION_TYPES } from './reducer.js';
import { generateSeedData } from './seed.js';
import { createDemoClock } from './clock.js';

const FoodLoopContext = createContext(null);

const STORAGE_KEY = 'foodloop_state';
const CHANNEL_NAME = 'foodloop_sync';

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure all required arrays exist
      return {
        ...generateSeedData(),
        ...parsed,
        simNow: Date.now(),
      };
    }
  } catch (e) {
    console.warn('Failed to load persisted state:', e);
  }
  return null;
}

function persistState(state) {
  try {
    // Don't persist simNow — it's always recomputed
    const toSave = { ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to persist state:', e);
  }
}

export function FoodLoopProvider({ children }) {
  const initialState = loadPersistedState() || generateSeedData();
  const [state, dispatch] = useReducer(foodLoopReducer, initialState);
  const stateRef = useRef(state);
  const channelRef = useRef(null);
  const clockRef = useRef(null);

  // Keep stateRef current
  stateRef.current = state;

  // ---- BroadcastChannel for cross-tab sync ----
  useEffect(() => {
    let channel = null;
    try {
      channel = new BroadcastChannel(CHANNEL_NAME);
      channel.onmessage = (event) => {
        if (event.data?.type === 'STATE_UPDATE') {
          dispatch({
            type: ACTION_TYPES.SYNC_STATE,
            payload: event.data.state,
          });
        }
      };
      channelRef.current = channel;
    } catch {
      // BroadcastChannel not supported — fall back to storage events
      const handleStorage = (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const newState = JSON.parse(event.newValue);
            dispatch({
              type: ACTION_TYPES.SYNC_STATE,
              payload: newState,
            });
          } catch {
            // ignore parse errors
          }
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  // ---- Broadcast state changes ----
  const broadcastState = useCallback((newState) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'STATE_UPDATE',
          state: newState,
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // ---- Persist + broadcast on meaningful data changes (excluding pure ticks) ----
  const dataVersionRef = useRef('');
  useEffect(() => {
    const currentDataKey = JSON.stringify({
      l: state.listings,
      m: state.matches,
      h: state.handovers,
      r: state.receivers,
      rest: state.restaurants,
      v: state.volunteers,
      sp: state.speed,
      u: state.currentUser?.id,
    });

    if (dataVersionRef.current !== currentDataKey) {
      dataVersionRef.current = currentDataKey;
      persistState(state);
      broadcastState(state);
    }
  }, [state, broadcastState]);

  // ---- Demo Clock ----
  useEffect(() => {
    const clock = createDemoClock(({ simNow }) => {
      dispatch({ type: ACTION_TYPES.TICK, payload: { simNow } });
    });
    clock.start();
    clockRef.current = clock;

    return () => clock.destroy();
  }, []);

  // Sync clock speed when state.speed changes
  useEffect(() => {
    if (clockRef.current) {
      clockRef.current.setSpeed(state.speed);
    }
  }, [state.speed]);

  // ---- Wrapped dispatch that ensures sync ----
  const syncDispatch = useCallback((action) => {
    dispatch(action);
  }, []);

  const contextValue = {
    state,
    dispatch: syncDispatch,
    clock: clockRef,
  };

  return (
    <FoodLoopContext.Provider value={contextValue}>
      {children}
    </FoodLoopContext.Provider>
  );
}

/**
 * Hook to access FoodLoop context.
 * @returns {{ state: object, dispatch: Function, clock: object }}
 */
export function useFoodLoop() {
  const context = useContext(FoodLoopContext);
  if (!context) {
    throw new Error('useFoodLoop must be used within a FoodLoopProvider');
  }
  return context;
}

export { ACTION_TYPES };

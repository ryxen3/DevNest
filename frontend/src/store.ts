import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/slices/authReducer";
import { State } from "./features/slices/authReducer";

// Load from localStorage
const loadState = (): { auth: State } | undefined => {
  try {
    const serializedState = localStorage.getItem("reduxState");
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return undefined;
  }
};

// Save to localStorage
const saveState = (state: { auth: State }) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("reduxState", serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
};

// Load initial state from localStorage
const preloadedState = loadState();

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState,
});

store.subscribe(() => {
  saveState({
    auth: store.getState().auth, // Only persist auth
  });
});

export default store;

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";

const AgentHarnessContext = createContext(null);

const INITIAL_CATEGORIES = [
  {
    id: "creative",
    label: "Creative",
    agents: [
      { id: "color", name: "Color Formulation", model: "Claude" },
      { id: "extensions", name: "Extensions Spec", model: "Claude" },
    ],
  },
  {
    id: "client",
    label: "Client Care",
    agents: [
      { id: "consult", name: "Consultation", model: "Claude" },
      { id: "scheduler", name: "Booking", model: "Local" },
    ],
  },
  {
    id: "salon",
    label: "Salon Ops",
    agents: [{ id: "lookbook", name: "Lookbook Notes", model: "GPT" }],
  },
];

const INITIAL_SESSIONS = [
  {
    id: "session-color-1",
    agentId: "color",
    categoryId: "creative",
    title: "Color Consult",
    status: "ready",
  },
];

function harnessReducer(state, action) {
  switch (action.type) {
    case "TOGGLE_DRAWER":
      return { ...state, isOpen: action.open ?? !state.isOpen };
    case "SET_CATEGORY":
      return {
        ...state,
        activeCategoryId: action.categoryId,
        activeAgentId:
          state.categories.find((c) => c.id === action.categoryId)?.agents[0]?.id ??
          state.activeAgentId,
      };
    case "SET_AGENT":
      return { ...state, activeAgentId: action.agentId };
    case "SET_SESSION":
      return { ...state, activeSessionId: action.sessionId };
    case "ADD_SESSION": {
      const session = {
        id: `session-${Date.now()}`,
        agentId: state.activeAgentId,
        categoryId: state.activeCategoryId,
        title: action.title ?? "New Session",
        status: "ready",
      };
      return {
        ...state,
        sessions: [...state.sessions, session],
        activeSessionId: session.id,
      };
    }
    case "CLOSE_SESSION": {
      const remaining = state.sessions.filter((s) => s.id !== action.sessionId);
      return {
        ...state,
        sessions: remaining,
        activeSessionId:
          state.activeSessionId === action.sessionId
            ? remaining[remaining.length - 1]?.id ?? null
            : state.activeSessionId,
      };
    }
    default:
      return state;
  }
}

function buildInitialState() {
  return {
    isOpen: false,
    categories: INITIAL_CATEGORIES,
    activeCategoryId: "creative",
    activeAgentId: "color",
    sessions: INITIAL_SESSIONS,
    activeSessionId: INITIAL_SESSIONS[0]?.id ?? null,
  };
}

export function AgentHarnessProvider({ children }) {
  const [state, dispatch] = useReducer(harnessReducer, null, buildInitialState);

  const activeCategory = useMemo(
    () => state.categories.find((c) => c.id === state.activeCategoryId),
    [state.categories, state.activeCategoryId],
  );

  const activeAgent = useMemo(
    () => activeCategory?.agents.find((a) => a.id === state.activeAgentId),
    [activeCategory, state.activeAgentId],
  );

  const activeSession = useMemo(
    () => state.sessions.find((s) => s.id === state.activeSessionId),
    [state.sessions, state.activeSessionId],
  );

  const toggleDrawer = useCallback((open) => {
    dispatch({ type: "TOGGLE_DRAWER", open });
  }, []);

  const setCategory = useCallback((categoryId) => {
    dispatch({ type: "SET_CATEGORY", categoryId });
  }, []);

  const setAgent = useCallback((agentId) => {
    dispatch({ type: "SET_AGENT", agentId });
  }, []);

  const setSession = useCallback((sessionId) => {
    dispatch({ type: "SET_SESSION", sessionId });
  }, []);

  const addSession = useCallback((title) => {
    dispatch({ type: "ADD_SESSION", title });
  }, []);

  const closeSession = useCallback((sessionId) => {
    dispatch({ type: "CLOSE_SESSION", sessionId });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      activeCategory,
      activeAgent,
      activeSession,
      toggleDrawer,
      setCategory,
      setAgent,
      setSession,
      addSession,
      closeSession,
    }),
    [
      state,
      activeCategory,
      activeAgent,
      activeSession,
      toggleDrawer,
      setCategory,
      setAgent,
      setSession,
      addSession,
      closeSession,
    ],
  );

  return (
    <AgentHarnessContext.Provider value={value}>{children}</AgentHarnessContext.Provider>
  );
}

export function useAgentHarness() {
  const context = useContext(AgentHarnessContext);
  if (!context) {
    throw new Error("useAgentHarness must be used within AgentHarnessProvider");
  }
  return context;
}

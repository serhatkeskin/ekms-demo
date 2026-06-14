import { createContext, useContext, useReducer, useMemo, useCallback, useEffect, ReactNode } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "services/base";
import { setAccessTokenGetter, setAccessTokenSetter } from "services/axiosInstance";
import { setNotificationTokenGetter } from "contexts/notifications/NotificationContext";

interface User {
  username: string;
  is_staff: boolean;
  is_superuser: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN"; payload: { user: User; access: string } }
  | { type: "LOGOUT" }
  | { type: "LOADING"; payload: boolean }
  | { type: "AUTH_ERROR"; payload: string }
  | { type: "CLEAR_ERROR" }
  | { type: "REFRESH_TOKEN"; payload: { access: string; user?: User | null } };

interface AuthActions {
  login: (credentials: { username: string; password: string; remember_me?: boolean }) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (value: boolean) => void;
  setAuthError: (error: string) => void;
  clearError: () => void;
}

type AuthContextType = [AuthState, AuthActions];

const AuthContext = createContext<AuthContextType | null>(null);
AuthContext.displayName = "AuthContext";

function reducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.access,
        loading: false,
        error: null,
      };
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        loading: false,
        error: null,
      };
    case "LOADING":
      return { ...state, loading: action.payload };
    case "AUTH_ERROR":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: action.payload,
        loading: false,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "REFRESH_TOKEN":
      return {
        ...state,
        isAuthenticated: true,
        accessToken: action.payload.access,
        user: action.payload.user || state.user,
        loading: false,
        error: null,
      };
    default:
      throw new Error(`Unhandled action type`);
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [controller, dispatch] = useReducer(reducer, {
    isAuthenticated: false,
    user: null,
    accessToken: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const tokenGetter = () => controller.accessToken;
    setAccessTokenGetter(tokenGetter);
    setNotificationTokenGetter(tokenGetter);
    setAccessTokenSetter((newToken) => {
      if (newToken) {
        dispatch({
          type: "REFRESH_TOKEN",
          payload: { access: newToken, user: controller.user },
        });
      } else {
        dispatch({ type: "LOGOUT" });
      }
    });
  }, [controller.accessToken, controller.user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const initializeAuth = async () => {
        try {
          const storedRefresh = localStorage.getItem("ekms_refresh");
          if (!storedRefresh) {
            dispatch({ type: "LOADING", payload: false });
            return;
          }
          const response = await axios.post(
            `${API_BASE}/auth/login/refresh/`,
            { refresh: storedRefresh },
            { withCredentials: true }
          );
          if (response.data?.refresh) localStorage.setItem("ekms_refresh", response.data.refresh);

          const newAccessToken = response.data?.access;
          if (newAccessToken) {
            const stored = localStorage.getItem("ekms_user");
            const ud = response.data.user || (stored ? JSON.parse(stored) : null);
            const user: User = ud || {
              username: response.data.username || "",
              is_staff: !!response.data.is_staff,
              is_superuser: !!response.data.is_superuser || !!response.data.is_staff,
            };

            dispatch({ type: "LOGIN", payload: { user, access: newAccessToken } });
          } else {
            dispatch({ type: "LOADING", payload: false });
          }
        } catch {
          dispatch({ type: "LOADING", payload: false });
        }
      };

      initializeAuth();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  const login = useCallback(
    async ({ username, password, remember_me }: { username: string; password: string; remember_me?: boolean }) => {
      dispatch({ type: "LOADING", payload: true });
      try {
        const response = await axios.post(
          `${API_BASE}/auth/login/`,
          { username, password, remember_me },
          { withCredentials: true }
        );

        const ud = response.data.user || response.data;
        const user: User = {
          username: ud.username,
          is_staff: !!ud.is_staff,
          is_superuser: !!ud.is_superuser || !!ud.is_staff,
        };

        localStorage.setItem("ekms_user", JSON.stringify(user));
        if (response.data.refresh) localStorage.setItem("ekms_refresh", response.data.refresh);
        dispatch({ type: "LOGIN", payload: { user, access: response.data.access } });
        navigate("/");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { detail?: string } }; message?: string };
        const errMsg = err.response?.data?.detail || err.message || "Login failed. Please try again.";
        dispatch({ type: "AUTH_ERROR", payload: errMsg });
      }
    },
    [navigate]
  );

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/auth/logout/`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("ekms_user");
    localStorage.removeItem("ekms_refresh");
    dispatch({ type: "LOGOUT" });
    navigate("/login");
  }, [navigate]);

  const actions = useMemo<AuthActions>(
    () => ({
      login,
      logout,
      setLoading: (value) => dispatch({ type: "LOADING", payload: value }),
      setAuthError: (error) => dispatch({ type: "AUTH_ERROR", payload: error }),
      clearError: () => dispatch({ type: "CLEAR_ERROR" }),
    }),
    [login, logout]
  );

  const value = useMemo<AuthContextType>(() => [controller, actions], [controller, actions]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };

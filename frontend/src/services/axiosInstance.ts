import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_BASE } from "./base";

let getAccessToken: () => string | null = () => null;
let setAccessToken: (token: string | null) => void = () => {};
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

export const setAccessTokenGetter = (getterFn: () => string | null): void => {
  getAccessToken = getterFn;
};

export const setAccessTokenSetter = (setterFn: (token: string | null) => void): void => {
  setAccessToken = setterFn;
};

const processQueue = (error: Error | null, token: string | null = null): void => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

const refreshToken = async (): Promise<string> => {
  try {
    const storedRefresh = localStorage.getItem("ekms_refresh");
    if (!storedRefresh) throw new Error("No refresh token stored");

    const response = await axios.post(
      `${API_BASE}/auth/login/refresh/`,
      { refresh: storedRefresh },
      { withCredentials: true }
    );

    const newAccessToken = response.data?.access;
    if (newAccessToken) {
      if (response.data?.refresh) localStorage.setItem("ekms_refresh", response.data.refresh);
      setAccessToken(newAccessToken);
      return newAccessToken;
    }

    throw new Error("No access token returned from refresh");
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

const axiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (config) => {
    let token = getAccessToken();

    if (!token && !isRefreshing) {
      try {
        isRefreshing = true;
        token = await refreshToken();
        isRefreshing = false;
      } catch {
        isRefreshing = false;
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        setAccessToken(null);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

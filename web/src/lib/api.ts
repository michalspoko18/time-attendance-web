import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearSession, getAccessToken, setAccessToken } from './auth';

const baseURL = import.meta.env.VITE_API_URL ?? '';

export const api = axios.create({
  baseURL,
  withCredentials: true
});

export interface AuthUser {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  name?: string;
  email?: string;
  employee_id?: string;
  employment?: string;
  is_active?: boolean;
  is_manager?: boolean;
}

const refreshClient = axios.create({
  baseURL,
  withCredentials: true
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post('/api/auth/refresh/')
      .then((response) => {
        const nextAccessToken = response.data?.access;

        if (!nextAccessToken) {
          return null;
        }

        setAccessToken(nextAccessToken);
        return nextAccessToken;
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const nextAccessToken = await refreshAccessToken();

    if (!nextAccessToken) {
      clearSession();
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
    return api(originalRequest);
  }
);

// ---------------------------------------------------------------------------
// Manager API helpers
// ---------------------------------------------------------------------------

export interface ManagerUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  employment: string;
  is_active: boolean;
  is_manager: boolean;
}

export interface DailyEntry extends ManagerUser {
  status: 'in' | 'out' | 'absent';
  started_at: string | null;
  today_seconds: number;
}

export interface ManagerOverview {
  total_users: number;
  users_in: number;
  users_worked_today: number;
  users_absent: number;
  date: string;
}

export interface WorkSession {
  id: number;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  status: 'open' | 'closed';
}

export interface UserDetail extends ManagerUser {
  stats: {
    today_seconds: number;
    week_seconds: number;
    month_seconds: number;
    total_seconds: number;
    total_sessions: number;
  };
  today: {
    status: 'in' | 'out' | 'absent';
    started_at: string | null;
    today_seconds: number;
  };
}

export interface DailyBreakdownEntry {
  date: string;
  total_seconds: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const managerApi = {
  getOverview: () =>
    api.get<ManagerOverview>('/api/attendance/manager/overview/').then((r) => r.data),

  getDaily: () =>
    api.get<DailyEntry[]>('/api/attendance/manager/daily/').then((r) => r.data),

  getUsers: (params?: { page?: number; is_active?: boolean }) =>
    api
      .get<PaginatedResponse<ManagerUser>>('/api/attendance/manager/users/', { params })
      .then((r) => r.data),

  getUserDetail: (employeeId: string) =>
    api
      .get<UserDetail>(`/api/attendance/manager/users/${employeeId}/`)
      .then((r) => r.data),

  getUserSessions: (
    employeeId: string,
    params?: { page?: number; date_from?: string; date_to?: string; status?: string }
  ) =>
    api
      .get<PaginatedResponse<WorkSession>>(
        `/api/attendance/manager/users/${employeeId}/sessions/`,
        { params }
      )
      .then((r) => r.data),

  getUserDailyBreakdown: (
    employeeId: string,
    params?: { date_from?: string; date_to?: string }
  ) =>
    api
      .get<DailyBreakdownEntry[]>(
        `/api/attendance/manager/users/${employeeId}/daily-breakdown/`,
        { params }
      )
      .then((r) => r.data),
};

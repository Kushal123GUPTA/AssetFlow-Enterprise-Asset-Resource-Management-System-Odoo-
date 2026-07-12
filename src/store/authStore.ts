import { create } from 'zustand';
import axios from 'axios';
import { signIn } from 'next-auth/react';

const API = {
  SIGNUP: "/api/auth/signup",
  FORGOT: "/api/auth/forgot-password",
  RESET: "/api/auth/reset-password",
};

interface AuthState {
  isLoading: boolean;
  error: string | null;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
  }) => Promise<boolean>;
  login: (data: { email: string; password: string }) => Promise<boolean>;
  requestPasswordReset: (
    email: string
  ) => Promise<{ ok: boolean; resetPath?: string; message?: string }>;
  resetPassword: (token: string, password: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  error: null,

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(API.SIGNUP, data);
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        set({ error: result.error, isLoading: false });
        return false;
      }

      set({ isLoading: false });
      return true;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "An error occurred during signup";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        set({ error: result.error, isLoading: false });
        return false;
      }

      set({ isLoading: false });
      return true;
    } catch {
      set({ error: "An unexpected error occurred during login", isLoading: false });
      return false;
    }
  },

  requestPasswordReset: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(API.FORGOT, { email });
      set({ isLoading: false });
      return {
        ok: true,
        resetPath: res.data.resetPath as string | undefined,
        message: res.data.message as string | undefined,
      };
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Could not start password reset";
      set({ error: message, isLoading: false });
      return { ok: false };
    }
  },

  resetPassword: async (token, password) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(API.RESET, { token, password });
      set({ isLoading: false });
      return true;
    } catch (error: unknown) {
      const message =
        axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : "Could not reset password";
      set({ error: message, isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

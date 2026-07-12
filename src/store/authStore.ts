import { create } from 'zustand';
import axios from 'axios';
import { signIn } from 'next-auth/react';

const API = {
  SIGNUP: "/api/auth/signup",
};

interface AuthState {
  isLoading: boolean;
  error: string | null;
  signup: (data: any) => Promise<boolean>;
  login: (data: any) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoading: false,
  error: null,
  
  signup: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(API.SIGNUP, data);
      // Automatically login after successful signup
      const result = await signIn('credentials', {
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
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || "An error occurred during signup", 
        isLoading: false 
      });
      return false;
    }
  },

  login: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const result = await signIn('credentials', {
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
    } catch (error: any) {
      set({ error: "An unexpected error occurred during login", isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));

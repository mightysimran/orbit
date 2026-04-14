import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The Auth Store manages who is logged in and their profile details
export const useAuthStore = create(
  persist(
    (set) => ({
      // --- STATE (The Memory) ---
      user: null,
      token: null,
      isAuthenticated: false,
      userRole: "rider", // Defaults to 'rider', can switch to 'driver'

      // --- ACTIONS (How we change the memory) ---

      // Called when the user successfully logs in
      setLoginSuccess: (userData, token) =>
        set({
          user: userData,
          token: token,
          isAuthenticated: true,
        }),

      // Called when toggling between Rider and Driver modes
      setUserRole: (role) => set({ userRole: role }),

      // Called when the user logs out
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          userRole: "rider",
        }),
    }),
    {
      name: "campus-ride-auth", // This saves the data to the phone's local storage
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

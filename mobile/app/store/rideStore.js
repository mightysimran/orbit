import { create } from "zustand";

// The Ride Store manages the live state of an active trip
export const useRideStore = create((set) => ({
  // --- STATE (The Memory) ---
  // Statuses: 'idle' -> 'searching' -> 'accepted' -> 'in_progress' -> 'completed'
  status: "idle",

  // Route and Cost details
  pickup: null,
  dropoff: null,
  fare: 0,

  // People involved
  driverDetails: null,
  riderDetails: null,

  // 🚨 NEW: Stores the incoming ride data sent from the socket
  currentRide: null,

  // --- ACTIONS (How we change the memory) ---

  // 🚨 NEW: Saves the incoming socket data so the UI can display it
  setRideData: (data) => set({ currentRide: data }),

  // 1. Rider hits "Confirm Ride"
  setRideRequest: (pickupLocation, dropoffLocation, estimatedFare, rider) =>
    set({
      status: "searching",
      pickup: pickupLocation,
      dropoff: dropoffLocation,
      fare: estimatedFare,
      riderDetails: rider,
    }),

  // 2. Driver hits "Accept Ride"
  acceptRide: (driver) =>
    set({
      status: "accepted",
      driverDetails: driver,
    }),

  // 3. Driver hits "Confirm Pickup"
  startRide: () =>
    set({
      status: "in_progress",
    }),

  // 4. Reset everything when the ride is over or canceled
  clearRide: () =>
    set({
      status: "idle",
      pickup: null,
      dropoff: null,
      fare: 0,
      driverDetails: null,
      riderDetails: null,
      currentRide: null, // Make sure to clear the socket data too!
    }),
}));

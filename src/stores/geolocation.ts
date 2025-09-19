import { create } from "zustand";
import type {
  GeolocationPermission,
  GeolocationReading,
  GeolocationStatus,
} from "@/types/geo";

type GeolocationState = {
  isSupported: boolean;
  permission: GeolocationPermission;
  status: GeolocationStatus;
  reading: GeolocationReading | null;
  error: string | null;
};

type GeolocationActions = {
  setPermission: (p: GeolocationPermission) => void;
  setStatus: (s: GeolocationStatus) => void;
  setReading: (r: GeolocationReading | null) => void;
  setError: (e: string | null) => void;
  setSupported: (v: boolean) => void;
  reset: () => void;
};

const initialState: GeolocationState = {
  isSupported: typeof window !== "undefined" && "geolocation" in navigator,
  permission: "unknown",
  status: "idle",
  reading: null,
  error: null,
};

export const useGeolocationStore = create<
  GeolocationState & GeolocationActions
>((set) => ({
  ...initialState,
  setPermission: (permission) => set({ permission }),
  setStatus: (status) => set({ status }),
  setReading: (reading) => set({ reading }),
  setError: (error) => set({ error }),
  setSupported: (isSupported) => set({ isSupported }),
  reset: () => set({ ...initialState }),
}));

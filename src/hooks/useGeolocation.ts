import { useState, useCallback } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  status: "idle" | "loading" | "success" | "denied" | "unavailable" | "timeout";
}

interface GeolocationResult {
  state: GeolocationState;
  requestLocation: () => Promise<{ latitude: number; longitude: number } | null>;
  clearLocation: () => void;
}

/**
 * Hook for capturing user's geolocation with graceful fallback
 */
export const useGeolocation = (): GeolocationResult => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
    status: "idle",
  });

  const clearLocation = useCallback(() => {
    setState({
      latitude: null,
      longitude: null,
      loading: false,
      error: null,
      status: "idle",
    });
  }, []);

  const requestLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        loading: false,
        error: "Geolocation is not supported by your browser",
        status: "unavailable",
      });
      return null;
    }

    setState((prev) => ({ ...prev, loading: true, status: "loading", error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setState({
            latitude,
            longitude,
            loading: false,
            error: null,
            status: "success",
          });
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMessage = "Location not available";
          let status: GeolocationState["status"] = "unavailable";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied";
              status = "denied";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              status = "unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              status = "timeout";
              break;
          }

          setState({
            latitude: null,
            longitude: null,
            loading: false,
            error: errorMessage,
            status,
          });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // 10 seconds timeout
          maximumAge: 60000, // Accept cached position up to 1 minute old
        }
      );
    });
  }, []);

  return { state, requestLocation, clearLocation };
};

export default useGeolocation;

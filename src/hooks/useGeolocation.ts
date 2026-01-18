import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  errorCode: 'UNSUPPORTED' | 'PERMISSION_DENIED' | 'UNAVAILABLE' | 'TIMEOUT' | null;
  loading: boolean;
  permissionState: PermissionState | null;
}

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    errorCode: null,
    loading: true,
    permissionState: null,
  });

  // Check permission state
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return;
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setState((prev) => ({ ...prev, permissionState: result.state }));
      
      // Listen for permission changes
      result.onchange = () => {
        setState((prev) => ({ ...prev, permissionState: result.state }));
        if (result.state === 'granted') {
          requestLocation();
        }
      };
    } catch (err) {
      // Permissions API not fully supported
      console.log('Permissions API not supported');
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        errorCode: 'UNSUPPORTED',
        loading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null, errorCode: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          errorCode: null,
          loading: false,
          permissionState: 'granted',
        });
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location';
        let errorCode: GeolocationState['errorCode'] = null;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            errorCode = 'PERMISSION_DENIED';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your device settings.';
            errorCode = 'UNAVAILABLE';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            errorCode = 'TIMEOUT';
            break;
        }
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          errorCode,
          loading: false,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000, // 5 minutes cache
        ...options,
      }
    );
  }, [options]);

  // Set manual location
  const setManualLocation = useCallback((lat: number, lng: number) => {
    setState({
      latitude: lat,
      longitude: lng,
      accuracy: null,
      error: null,
      errorCode: null,
      loading: false,
      permissionState: null,
    });
  }, []);

  useEffect(() => {
    checkPermission();
    requestLocation();
  }, [checkPermission, requestLocation]);

  return { 
    ...state, 
    requestLocation, 
    setManualLocation,
    isPermissionDenied: state.errorCode === 'PERMISSION_DENIED',
  };
};

'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import polyline from '@mapbox/polyline';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: parseFloat('12.9716'),
  lng: parseFloat('77.5946'),
};

const libraries: ('places' | 'geometry' | 'drawing' | 'visualization')[] = ['places'];

interface RoutePoint {
  lat: number;
  lng: number;
}

interface RouteInfo {
  distance: string | null;
  duration: string | null;
  optimization: string;
  bonus_type?: string;
  bonus_value?: number;
  max_round_trips?: number;
  message?: string;
}

interface AlternativeRoute {
  route_index: number;
  polyline: string;
  num_nodes: number;
  bonus_type: string;
  bonus_value: number;
  total_distance_meters: number;
  total_distance_km: number;
  is_feasible: boolean;
  max_round_trips: number;
  distance: string;
  duration: string;
}

interface RouteResponse {
  status: string;
  polyline?: string;
  distance?: string;
  duration?: string;
  optimization_used?: string;
  route_id?: number;
  bonus_type?: string;
  bonus_value?: number;
  max_round_trips?: number;
  num_nodes?: number;
  total_distance_km?: number;
  message?: string;
  other_routes?: AlternativeRoute[];
}

interface MapContainerProps {
  onControlPanelData: (data: {
    pointA: RoutePoint | null;
    pointB: RoutePoint | null;
    routeInfo: RouteInfo;
    loading: boolean;
    optimizationCriteria: string;
    alternativeRoutes: AlternativeRoute[];
    selectedRouteIndex: number | null;
    onOptimizationChange: (criteria: string) => void;
    onResetRoute: () => void;
    onRecalculateRoute: () => void;
    onAlternativeRouteSelect: (routeIndex: number) => void;
    onResetToDefaultRoute: () => void;
  }) => void;
}

export default function MapContainer({ onControlPanelData }: MapContainerProps) {
  const { user } = useAuth();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<RoutePoint>(defaultCenter);
  const [pointA, setPointA] = useState<RoutePoint | null>(null);
  const [pointB, setPointB] = useState<RoutePoint | null>(null);
  const [routePolyline, setRoutePolyline] = useState<RoutePoint[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo>({
    distance: null,
    duration: null,
    optimization: 'fastest',
  });
  const [loading, setLoading] = useState(false);
  const [optimizationCriteria, setOptimizationCriteria] = useState('fastest');
  const [alternativeRoutes, setAlternativeRoutes] = useState<AlternativeRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null);
  const [defaultRoutePolyline, setDefaultRoutePolyline] = useState<RoutePoint[] | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyC1PrKN6ly3H33OCfXIbz-3LWBBeiu44M4',
    libraries,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(userLocation);
          toast.success('Location detected. Map centered on your current location.');
        },
        (error) => {
          console.warn('Geolocation error:', error);
          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error('Location access denied. Using default location.');
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error('Location unavailable. Using default location.');
              break;
            case error.TIMEOUT:
              toast.error('Location request timeout. Using default location.');
              break;
            default:
              toast.error('Location error. Using default location.');
              break;
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    } else {
      toast.error('Geolocation not supported. Using default location.');
    }
  }, []);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const calculateRoute = useCallback(async (start: RoutePoint, end: RoutePoint) => {
    setLoading(true);
    
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (user?.id) {
        headers['x-user-id'] = user.id.toString();
      }
      
      const response = await fetch(`${backendUrl}/maps/calculate-route`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          start_lat: start.lat,
          start_lng: start.lng,
          end_lat: end.lat,
          end_lng: end.lng,
          optimization_criteria: optimizationCriteria,
          mode: 'driving',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const data: RouteResponse = await response.json();

      if (data.status === 'success' && data.polyline) {
        const decodedPath = polyline
          .decode(data.polyline)
          .map((p: [number, number]) => ({ lat: p[0], lng: p[1] }));
        
        setRoutePolyline(decodedPath);
        setDefaultRoutePolyline(decodedPath);
        setSelectedRouteIndex(null);
        setRouteInfo({
          distance: data.distance || null,
          duration: data.duration || null,
          optimization: data.optimization_used || optimizationCriteria,
          bonus_type: data.bonus_type,
          bonus_value: data.bonus_value,
          max_round_trips: data.max_round_trips,
          message: data.message,
        });

        setAlternativeRoutes(data.other_routes || []);

        if (map && decodedPath.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          decodedPath.forEach((point: RoutePoint) => bounds.extend(point));
          bounds.extend(start);
          bounds.extend(end);
          map.fitBounds(bounds);
        }

        toast.success('Route calculated successfully!');
      } else {
        toast.error(data.message || 'Failed to get route data.');
        setRoutePolyline(null);
        setDefaultRoutePolyline(null);
        setAlternativeRoutes([]);
        setSelectedRouteIndex(null);
        setRouteInfo({ 
          distance: null, 
          duration: null, 
          optimization: optimizationCriteria 
        });
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error(`Could not fetch route: ${errorMessage}`);
      setRoutePolyline(null);
      setDefaultRoutePolyline(null);
      setAlternativeRoutes([]);
      setSelectedRouteIndex(null);
      setRouteInfo({ 
        distance: null, 
        duration: null, 
        optimization: optimizationCriteria 
      });
    } finally {
      setLoading(false);
    }
  }, [optimizationCriteria, map, user]);

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      if (!pointA) {
        setPointA({ lat, lng });
        setPointB(null);
        setRoutePolyline(null);
        setDefaultRoutePolyline(null);
        setAlternativeRoutes([]);
        setSelectedRouteIndex(null);
        setRouteInfo({ 
          distance: null, 
          duration: null, 
          optimization: optimizationCriteria 
        });
        toast.success('Point A set. Click again to set Point B.');
      } else if (!pointB) {
        setPointB({ lat, lng });
        calculateRoute(pointA, { lat, lng });
        toast.success('Point B set. Calculating route...');
      } else {
        setPointA({ lat, lng });
        setPointB(null);
        setRoutePolyline(null);
        setDefaultRoutePolyline(null);
        setAlternativeRoutes([]);
        setSelectedRouteIndex(null);
        setRouteInfo({ 
          distance: null, 
          duration: null, 
          optimization: optimizationCriteria 
        });
        toast.success('Route reset. Point A set. Click again to set Point B.');
      }
    },
    [pointA, pointB, optimizationCriteria, calculateRoute]
  );

  const resetRoute = () => {
    setPointA(null);
    setPointB(null);
    setRoutePolyline(null);
    setDefaultRoutePolyline(null);
    setAlternativeRoutes([]);
    setSelectedRouteIndex(null);
    setRouteInfo({ 
      distance: null, 
      duration: null, 
      optimization: optimizationCriteria 
    });
    toast.success('Route cleared. Click on the map to set Point A.');
  };

  const handleOptimizationChange = (criteria: string) => {
    setOptimizationCriteria(criteria);
    if (pointA && pointB) {
      calculateRoute(pointA, pointB);
    }
  };

  const handleRecalculateRoute = () => {
    if (pointA && pointB) {
      calculateRoute(pointA, pointB);
    }
  };

  const handleAlternativeRouteSelect = (routeIndex: number) => {
    const selectedRoute = alternativeRoutes[routeIndex];
    if (selectedRoute) {
      const decodedPath = polyline
        .decode(selectedRoute.polyline)
        .map((p: [number, number]) => ({ lat: p[0], lng: p[1] }));
      
      setRoutePolyline(decodedPath);
      setSelectedRouteIndex(routeIndex);
      
      setRouteInfo({
        distance: selectedRoute.distance,
        duration: selectedRoute.duration,
        optimization: routeInfo.optimization,
        bonus_type: selectedRoute.bonus_type,
        bonus_value: selectedRoute.bonus_value,
        max_round_trips: selectedRoute.max_round_trips,
        message: `Alternative route ${routeIndex + 1} selected`,
      });

      if (map && decodedPath.length > 0 && pointA && pointB) {
        const bounds = new window.google.maps.LatLngBounds();
        decodedPath.forEach((point: RoutePoint) => bounds.extend(point));
        bounds.extend(pointA);
        bounds.extend(pointB);
        map.fitBounds(bounds);
      }

      toast.success(`Alternative route ${routeIndex + 1} selected`);
    }
  };

  const handleResetToDefaultRoute = () => {
    if (defaultRoutePolyline) {
      setRoutePolyline(defaultRoutePolyline);
      setSelectedRouteIndex(null);
      
      if (pointA && pointB) {
        calculateRoute(pointA, pointB);
      }
      
      toast.success('Reset to optimized default route');
    }
  };

  useEffect(() => {
    onControlPanelData({
      pointA,
      pointB,
      routeInfo,
      loading,
      optimizationCriteria,
      alternativeRoutes,
      selectedRouteIndex,
      onOptimizationChange: handleOptimizationChange,
      onResetRoute: resetRoute,
      onRecalculateRoute: handleRecalculateRoute,
      onAlternativeRouteSelect: handleAlternativeRouteSelect,
      onResetToDefaultRoute: handleResetToDefaultRoute,
    });
  }, [pointA, pointB, routeInfo, loading, optimizationCriteria, alternativeRoutes, selectedRouteIndex]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-red-600 font-medium">Error Loading Maps</h3>
          <p className="text-sm text-gray-600 mt-1">
            Failed to load Google Maps. Please check your API key configuration.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Error: {loadError.message}
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span>Loading Map...</span>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={10}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={handleMapClick}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
      }}
    >
      {pointA && (
        <Marker
          position={pointA}
          icon={{
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#4CAF50" stroke="#2E7D32" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">A</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
          }}
        />
      )}

      {pointB && (
        <Marker
          position={pointB}
          icon={{
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="14" fill="#F44336" stroke="#C62828" stroke-width="2"/>
                <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">B</text>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
          }}
        />
      )}

      {routePolyline && (
        <Polyline
          path={routePolyline}
          options={{
            strokeColor: '#2563EB',
            strokeOpacity: 0.8,
            strokeWeight: 5,
            geodesic: true,
          }}
        />
      )}
    </GoogleMap>
  );
}

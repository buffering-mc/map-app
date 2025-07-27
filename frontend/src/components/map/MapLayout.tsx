'use client';

import { useState } from 'react';
import MapContainer from './MapContainer';
import ControlPanel from './ControlPanel';

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

interface ControlPanelData {
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
}

export default function MapLayout() {
  const [controlPanelData, setControlPanelData] = useState<ControlPanelData | null>(null);

  const handleControlPanelData = (data: ControlPanelData) => {
    setControlPanelData(data);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Map Container - Top Half */}
      <div className="h-1/2 p-4">
        <div className="h-full bg-gray-100 rounded-lg overflow-hidden shadow-md">
          <MapContainer onControlPanelData={handleControlPanelData} />
        </div>
      </div>
      
      {/* Control Panel Container - Bottom Half */}
      <div className="h-1/2 p-4 pt-0">
        <div className="h-full bg-white rounded-lg shadow-md overflow-auto">
          {controlPanelData && (
            <ControlPanel
              pointA={controlPanelData.pointA}
              pointB={controlPanelData.pointB}
              routeInfo={controlPanelData.routeInfo}
              loading={controlPanelData.loading}
              optimizationCriteria={controlPanelData.optimizationCriteria}
              alternativeRoutes={controlPanelData.alternativeRoutes}
              selectedRouteIndex={controlPanelData.selectedRouteIndex}
              onOptimizationChange={controlPanelData.onOptimizationChange}
              onResetRoute={controlPanelData.onResetRoute}
              onRecalculateRoute={controlPanelData.onRecalculateRoute}
              onAlternativeRouteSelect={controlPanelData.onAlternativeRouteSelect}
              onResetToDefaultRoute={controlPanelData.onResetToDefaultRoute}
            />
          )}
        </div>
      </div>
    </div>
  );
}

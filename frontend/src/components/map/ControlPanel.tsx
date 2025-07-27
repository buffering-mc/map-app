'use client';

import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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

interface ControlPanelProps {
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

export default function ControlPanel({
  pointA,
  pointB,
  routeInfo,
  loading,
  optimizationCriteria,
  alternativeRoutes,
  selectedRouteIndex,
  onOptimizationChange,
  onResetRoute,
  onRecalculateRoute,
  onAlternativeRouteSelect,
  onResetToDefaultRoute,
}: ControlPanelProps) {
  return (
    <div className="h-full p-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">
          Route Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Click on the map to set points A and B
          </p>
          
          {/* Optimization Controls */}
          {/* <div className="space-y-2">
            <label className="text-sm font-medium">Route Optimization:</label>
            <div className="flex space-x-2 flex-wrap">
              <Button
                size="sm"
                variant={optimizationCriteria === 'fastest' ? 'default' : 'outline'}
                onClick={() => onOptimizationChange('fastest')}
              >
                Fastest
              </Button>
              <Button
                size="sm"
                variant={optimizationCriteria === 'shortest' ? 'default' : 'outline'}
                onClick={() => onOptimizationChange('shortest')}
              >
                Shortest
              </Button>
              <Button
                size="sm"
                variant={optimizationCriteria === 'eco_friendly' ? 'default' : 'outline'}
                onClick={() => onOptimizationChange('eco_friendly')}
              >
                Eco-Friendly
              </Button>
            </div>
          </div> */}
        </div>

        {/* Point Information */}
        <div className="space-y-2">
          {pointA && (
            <p className="text-sm">
              <span className="font-medium text-green-600">Point A:</span>{' '}
              {pointA.lat.toFixed(4)}, {pointA.lng.toFixed(4)}
            </p>
          )}
          {pointB && (
            <p className="text-sm">
              <span className="font-medium text-red-600">Point B:</span>{' '}
              {pointB.lat.toFixed(4)}, {pointB.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Calculating route...</span>
          </div>
        )}

        {/* Route Information */}
        {routeInfo.distance && (
          <div className="p-3 bg-blue-50 rounded-lg space-y-2">
            <p className="text-sm font-medium text-blue-800">Route Information:</p>
            <div className="space-y-1">
              <p className="text-sm text-blue-700">
                this route is {routeInfo.distance} km long for a single trip from point a to point b
              </p>
              {routeInfo.max_round_trips !== undefined && (
                <p className="text-sm text-blue-700">
                  If this path is chosen then a total of {routeInfo.max_round_trips} round trips can be made on a single charge of 100 units
                </p>
              )}
              {routeInfo.bonus_value !== undefined && (
                <p className="text-sm text-blue-700">
                  Choosing this path offers a one time bonus backup charge of {routeInfo.bonus_value} units whenever needed
                </p>
              )}
            </div>
          </div>
        )}

        {/* Alternative Routes */}
        {alternativeRoutes.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800">
                Alternative Routes ({alternativeRoutes.length})
              </p>
              {selectedRouteIndex !== null && (
                <Button
                  onClick={onResetToDefaultRoute}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Reset to Default
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alternativeRoutes.map((route, index) => (
                <div
                  key={route.route_index}
                  className={`p-2 rounded border cursor-pointer transition-colors ${
                    selectedRouteIndex === index
                      ? 'bg-blue-100 border-blue-300'
                      : 'bg-white border-gray-200 hover:bg-gray-100'
                  }`}
                  onClick={() => onAlternativeRouteSelect(index)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-700">
                        Route {index + 1}
                        {selectedRouteIndex === index && (
                          <span className="ml-1 text-blue-600">(Selected)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-600">
                        {route.distance} • {route.duration}
                      </p>
                      <p className="text-xs text-gray-600">
                        {route.bonus_type}: +{route.bonus_value} units
                      </p>
                      <p className="text-xs text-gray-600">
                        Max trips: {route.max_round_trips}
                      </p>
                    </div>
                    {route.is_feasible ? (
                      <span className="text-xs text-green-600 font-medium">✓</span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">✗</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button onClick={onResetRoute} variant="outline" size="sm">
            Clear Route
          </Button>
          {pointA && pointB && (
            <Button
              onClick={onRecalculateRoute}
              size="sm"
              disabled={loading}
            >
              Recalculate
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Click once to set Point A (green)</p>
          <p>• Click again to set Point B (red) and calculate route</p>
        </div>
      </CardContent>
    </div>
  );
}

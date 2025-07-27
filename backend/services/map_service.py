import httpx
import random
from sqlalchemy.orm import Session
from typing import Dict, Tuple
from models import RouteHistory, Maps
from schemas.route_schemas import RouteRequest, RouteResponse
import logging
from config import config

logger = logging.getLogger(__name__)

INITIAL_CHARGE = 100
CHARGE_PER_KM = 1 


class MapService:
    @staticmethod
    def build_route_graph(route_obj: dict) -> Dict[Tuple[float, float], Dict[Tuple[float, float], int]]:
        graph = {}
        legs = route_obj.get("legs", [])
        
        for leg in legs:
            steps = leg.get("steps", [])
            for step in steps:
                start = step.get("startLocation", {}).get("latLng", {})
                end = step.get("endLocation", {}).get("latLng", {})
                distance = step.get("distanceMeters", 0)
                
                if not start.get("latitude") or not start.get("longitude") or \
                   not end.get("latitude") or not end.get("longitude"):
                    continue
                    
                start_node = (start.get("latitude"), start.get("longitude"))
                end_node = (end.get("latitude"), end.get("longitude"))
                
                if start_node not in graph:
                    graph[start_node] = {}
                
                graph[start_node][end_node] = distance
        
        return graph

    @staticmethod
    def count_unique_nodes(graph: Dict[Tuple[float, float], Dict[Tuple[float, float], int]]) -> int:
        all_nodes = set()
        all_nodes.update(graph.keys())
        
        for destinations in graph.values():
            all_nodes.update(destinations.keys())
        
        return len(all_nodes)

    @staticmethod
    def determine_charging_bonus(num_nodes: int) -> Tuple[str, int]:
        if num_nodes >= 3:
            bonus_type = random.choice(["Type A", "Type B"])
            bonus_value = 5 if bonus_type == "Type A" else 10
            return bonus_type, bonus_value
        else:
            return "None", 0

    @staticmethod
    def get_total_distance_meters(route_obj: dict) -> int:
        total = 0
        legs = route_obj.get("legs", [])
        for leg in legs:
            steps = leg.get("steps", [])
            for step in steps:
                total += step.get("distanceMeters", 0)
        return total

    @staticmethod
    def calculate_route_feasibility_and_trips(
        total_distance_meters: int, 
        bonus_value: int,
        initial_charge: int = INITIAL_CHARGE,
        charge_per_km: int = CHARGE_PER_KM
    ) -> Tuple[bool, int]:
        total_distance_km = total_distance_meters / 1000.0
        total_charge = initial_charge + bonus_value
        
        charge_needed_per_trip = total_distance_km * charge_per_km
        
        if total_charge < charge_needed_per_trip:
            return False, 0
        
        charge_needed_per_round_trip = charge_needed_per_trip * 2
        max_round_trips = int(total_charge / charge_needed_per_round_trip)
        
        return True, max_round_trips

    @staticmethod
    async def calculate_optimal_route(db: Session, user_id: int, request: RouteRequest) -> RouteResponse:
        google_api_key = config.GOOGLE_MAPS_API_KEY #os.getenv("GOOGLE_DIRECTIONS_API_KEY")
        
        if not google_api_key:
            raise ValueError("Google Directions API key not configured")

        google_directions_url = "https://routes.googleapis.com/directions/v2:computeRoutes"
        headers = {
            "X-Goog-Api-Key": google_api_key,
            "X-Goog-FieldMask": "*"
        }
        body = {
            "origin": {
                "location": {
                    "latLng": {
                        "latitude": request.start_lat,
                        "longitude": request.start_lng
                    }
                }
            },
            "destination": {
                "location": {
                    "latLng": {
                        "latitude": request.end_lat,
                        "longitude": request.end_lng
                    }
                }
            },
            "travelMode": "DRIVE",
            "languageCode": "en-US",
            "units": "METRIC",
            "computeAlternativeRoutes": True
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url=google_directions_url, headers=headers, json=body)
            route_data = response.json()

            routes = route_data.get("routes", [])
            if not routes:
                return RouteResponse(
                    status="error",
                    message="Route calculation failed: No route found"
                )

            route_analyses = []
            
            for i, route in enumerate(routes):
                graph = MapService.build_route_graph(route)
                num_nodes = MapService.count_unique_nodes(graph)
                bonus_type, bonus_value = MapService.determine_charging_bonus(num_nodes)
                total_distance_meters = MapService.get_total_distance_meters(route)
                is_feasible, max_round_trips = MapService.calculate_route_feasibility_and_trips(
                    total_distance_meters, bonus_value
                )
                
                route_analysis = {
                    "route_index": i,
                    "route": route,
                    "graph": graph,
                    "num_nodes": num_nodes,
                    "bonus_type": bonus_type,
                    "bonus_value": bonus_value,
                    "total_distance_meters": total_distance_meters,
                    "total_distance_km": total_distance_meters / 1000.0,
                    "is_feasible": is_feasible,
                    "max_round_trips": max_round_trips
                }
                
                route_analyses.append(route_analysis)

            feasible_routes = [analysis for analysis in route_analyses if analysis["is_feasible"]]
            
            if not feasible_routes:
                return RouteResponse(
                    status="error",
                    message="No feasible routes found. All routes exceed vehicle charge capacity."
                )

            best_route_analysis = max(feasible_routes, key=lambda x: x["max_round_trips"])
            best_route = best_route_analysis["route"]

            overview_polyline = best_route.get("polyline", {}).get("encodedPolyline", "")
            
            leg = best_route["legs"][0] if best_route.get("legs") and len(best_route["legs"]) > 0 else None
            if leg:
                distance_text = leg.get("localizedValues", {}).get("distance", {}).get("text", "")
                duration_text = leg.get("localizedValues", {}).get("duration", {}).get("text", "")
            else:
                distance_text = f"{best_route_analysis['total_distance_km']:.2f} km"
                duration_text = ""

            route_record = RouteHistory(
                user_id=user_id,
                start_lat=request.start_lat,
                start_lng=request.start_lng,
                end_lat=request.end_lat,
                end_lng=request.end_lng,
                distance=distance_text,
                duration=duration_text,
                polyline_data=overview_polyline,
                optimization_criteria=request.optimization_criteria,
                bonus_type=best_route_analysis['bonus_type'],
                bonus_value=best_route_analysis['bonus_value'],
                max_round_trips=best_route_analysis['max_round_trips'],
                num_nodes=best_route_analysis['num_nodes'],
                total_distance_km=best_route_analysis['total_distance_km']
            )
            db.add(route_record)
            db.commit()
            db.refresh(route_record)

            other_routes_data = []
            for analysis in route_analyses:
                if analysis["route_index"] != best_route_analysis["route_index"]:
                    route_data = {
                        "route_index": analysis["route_index"],
                        "polyline": analysis["route"].get("polyline", {}).get("encodedPolyline", ""),
                        "num_nodes": analysis["num_nodes"],
                        "bonus_type": analysis["bonus_type"],
                        "bonus_value": analysis["bonus_value"],
                        "total_distance_meters": analysis["total_distance_meters"],
                        "total_distance_km": analysis["total_distance_km"],
                        "is_feasible": analysis["is_feasible"],
                        "max_round_trips": analysis["max_round_trips"]
                    }
                    
                    route_leg = analysis["route"]["legs"][0] if analysis["route"].get("legs") and len(analysis["route"]["legs"]) > 0 else None
                    if route_leg:
                        route_data["distance"] = route_leg.get("localizedValues", {}).get("distance", {}).get("text", "")
                        route_data["duration"] = route_leg.get("localizedValues", {}).get("duration", {}).get("text", "")
                    else:
                        route_data["distance"] = f"{analysis['total_distance_km']:.2f} km"
                        route_data["duration"] = ""
                    
                    other_routes_data.append(route_data)

            map_record = Maps(
                user_id=user_id,
                selected_route=route_record.id,
                other_routes=other_routes_data
            )
            db.add(map_record)
            db.commit()
            db.refresh(map_record)

            return RouteResponse(
                status="success",
                polyline=overview_polyline,
                distance=distance_text,
                duration=duration_text,
                optimization_used=request.optimization_criteria,
                route_id=route_record.id,
                bonus_type=best_route_analysis['bonus_type'],
                bonus_value=best_route_analysis['bonus_value'],
                max_round_trips=best_route_analysis['max_round_trips'],
                num_nodes=best_route_analysis['num_nodes'],
                total_distance_km=round(best_route_analysis['total_distance_km'], 2),
                other_routes=other_routes_data, 
                message=f"Optimal route selected with {best_route_analysis['bonus_type']} charging bonus "
                       f"(+{best_route_analysis['bonus_value']} units). "
                       f"Maximum round trips: {best_route_analysis['max_round_trips']}. "
                       f"Route has {best_route_analysis['num_nodes']} nodes."
            )


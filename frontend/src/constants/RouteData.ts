// RouteData shape coming from backend
import { Feature } from "geojson";
import { POI } from "../models/POI";

export type RouteData = {
  feature: Feature;
  pois: POI[];
};
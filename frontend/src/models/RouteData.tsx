import { Feature } from "geojson";
import { POI } from "./POI";

export type RouteData = {
    feature: Feature;
    pois: POI[];
};
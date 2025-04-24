import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Feature } from "geojson";
import { useTheme } from "@mui/material";
import { POI } from "../models/POI";
import { getIconForCategory } from "./categoryIcons";

export interface Props {
  pois: POI[];
  focusedPOI: POI | null;
  routeFeature: Feature | null;
}

/** Zooms & pans to include all POIs in view */
function MapFlyToBounds({ pois }: { pois: POI[] }) {
  const map = useMap();
  useEffect(() => {
    if (pois.length) {
      const bounds = pois.map((p) => [p.latitude, p.longitude]) as [
        number,
        number
      ][];
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
  }, [pois, map]);
  return null;
}

/** Flys to a single lat/lon when they change */
export function FlyToMarker({
  lat,
  lon,
}: {
  lat: number;
  lon: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], 16);
    } else {
      console.warn("FlyToMarker skipped invalid coords", { lat, lon });
    }
  }, [lat, lon, map]);
  return null;
}

/** Renders a GeoJSON LineString as a blue (or theme.primary) polyline */
function RouteLine({ routeFeature }: { routeFeature: Feature | null }) {
  const theme = useTheme();
  if (
    !routeFeature ||
    routeFeature.geometry.type !== "LineString" ||
    !Array.isArray(routeFeature.geometry.coordinates)
  ) {
    return null;
  }
  const coords = routeFeature.geometry.coordinates.map(
    ([lon, lat]) => [lat, lon] as [number, number]
  );
  return (
    <Polyline
      positions={coords}
      pathOptions={{ color: theme.palette.primary.main }}
    />
  );
}

export default function MapViewer({
  pois,
  focusedPOI,
  routeFeature,
}: Props) {
  const theme = useTheme();

  // initial center (first POI or Tel-Aviv)
  const center: [number, number] = pois.length
    ? [pois[0].latitude, pois[0].longitude]
    : [32.0853, 34.7818];

  // switch tiles / attribution based on theme
  const tileUrl =
    theme.palette.mode === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const attribution =
    theme.palette.mode === "dark"
      ? '&copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: "100%", height: "100%" }}
    >
      {/* fit all POIs */}
      <MapFlyToBounds pois={pois} />

      {/* focus on a single POI if requested */}
      {focusedPOI &&
        Number.isFinite(focusedPOI.latitude) &&
        Number.isFinite(focusedPOI.longitude) && (
          <FlyToMarker
            lat={focusedPOI.latitude}
            lon={focusedPOI.longitude}
          />
        )}

      <TileLayer url={tileUrl} attribution={attribution} />

      {/* place markers with category icons */}
      {pois.map((poi, i) => (
        <Marker
          key={i}
          position={[poi.latitude, poi.longitude]}
          icon={getIconForCategory(poi.categories)}
        >
          <Popup>
            <strong>{poi.name}</strong>
            {poi.description && <p>{poi.description}</p>}
            <div>
              <a
                href={
                  poi.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      poi.address
                    )}`
                    : `https://www.google.com/maps/search/?api=1&query=${poi.latitude},${poi.longitude}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                📍 View on map
              </a>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* draw the GeoJSON route if provided, else connect POIs in order */}
      {routeFeature ? (
        <RouteLine routeFeature={routeFeature} />
      ) : (
        pois.length > 1 && (
          <Polyline
            positions={pois.map((p) => [p.latitude, p.longitude] as [
              number,
              number
            ])}
            pathOptions={{ color: theme.palette.secondary.main }}
          />
        )
      )}
    </MapContainer>
  );
}

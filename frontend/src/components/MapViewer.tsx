import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getIconForCategory } from "./categoryIcons";
import { POI, Props } from "../models/POI";
import { useEffect } from "react";
import { useTheme } from "@mui/material";


function MapFlyToBounds({ pois }: { pois: POI[] }) {
  const map = useMap();

  useEffect(() => {
    if (!pois.length) return;

    const bounds = pois.map((p) => [p.latitude, p.longitude]) as [number, number][];
    map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
  }, [pois]);

  return null;
}

export function FlyToMarker({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    const isValid =
      typeof lat === "number" &&
      typeof lon === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lon);

    if (isValid) {
      map.flyTo([lat, lon], 16);
    } else {
      console.warn("❌ FlyToMarker skipped: Invalid coordinates", { lat, lon });
    }
  }, [lat, lon]);

  return null;
}


export default function MapViewer({ pois,focusedPOI }: Props) {
  const center: [number, number] = pois.length
    ? [pois[0].latitude, pois[0].longitude]
    : [32.0853, 34.7818]; // Default to Tel Aviv

  const theme = useTheme();

  const tileUrl =
    theme.palette.mode === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution =
    theme.palette.mode === "dark"
      ? '&copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer center={center} zoom={13} style={{ width: "100%", height: "100%" }}>
      <MapFlyToBounds pois={pois} />
      {focusedPOI &&
        typeof focusedPOI.latitude === "number" &&
        typeof focusedPOI.longitude === "number" &&
        Number.isFinite(focusedPOI.latitude) &&
        Number.isFinite(focusedPOI.longitude) && (
          <FlyToMarker lat={focusedPOI.latitude} lon={focusedPOI.longitude} />
        )}
        

      <TileLayer url={tileUrl} attribution={attribution}/>

      {pois.map((poi, i) => (
        <Marker
          key={i}
          position={[poi.latitude, poi.longitude]}
          icon={getIconForCategory(poi.categories)}
        >
          <Popup>
            <strong>{poi.name}</strong>
            <br />
            {poi.description && <div>{poi.description}</div>}
            <div>
              <a
                href={
                  poi.address
                    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.address)}`
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

      {pois.length > 1 && (
        <Polyline positions={pois.map((p) => [p.latitude, p.longitude] as [number, number])} />
      )}
    </MapContainer>
  );
}

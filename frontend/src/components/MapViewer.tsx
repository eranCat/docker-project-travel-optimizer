import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getIconForCategory } from "./categoryIcons";
import { POI, Props } from "../models/POI";
import { useEffect } from "react";

function MapFlyToBounds({ pois }: { pois: POI[] }) {
  const map = useMap();

  useEffect(() => {
    if (!pois.length) return;

    const bounds = pois.map((p) => [p.latitude, p.longitude]) as [number, number][];
    map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
  }, [pois]);

  return null;
}


export default function MapViewer({ pois }: Props) {
  const center: [number, number] = pois.length
    ? [pois[0].latitude, pois[0].longitude]
    : [32.0853, 34.7818]; // Default to Tel Aviv

  return (
    <MapContainer center={center} zoom={13} style={{ height: "400px", width: "100%" }}>
      <MapFlyToBounds pois={pois} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

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

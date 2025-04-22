import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

interface POI {
  name: string;
  latitude: number;
  longitude: number;
}

interface Props {
  pois: POI[];
}

export default function MapViewer({ pois }: Props) {
  const center = pois.length ? [pois[0].latitude, pois[0].longitude] : [32.08, 34.78];

  return (
    <MapContainer center={center as any} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {pois.map((poi, i) => (
        <Marker key={i} position={[poi.latitude, poi.longitude]}>
          <Popup>{poi.name}</Popup>
        </Marker>
      ))}
      <Polyline positions={pois.map(p => [p.latitude, p.longitude] as [number, number])} />
    </MapContainer>
  );
}

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Feature } from 'geojson';
import { useTheme } from '@mui/material';
import { POI } from '../models/POI';
import { CATEGORY_ICONS ,CATEGORY_COLORS} from '../styles/icons'

// Load Font Awesome
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

export function getIconForCategory(categories?: string[]): L.DivIcon {
  const category = categories?.find(cat => typeof cat === 'string')?.toLowerCase() || 'default';
  const iconClass = CATEGORY_ICONS[category] || CATEGORY_ICONS['default'];
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['default'];

  const html = `
    <div class="poi-marker" style="--poi-color: ${color};">
      <i class="fas ${iconClass}"></i>
    </div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -36],
  });
}

export interface Props {
  pois: POI[] | null;
  focusedPOI: POI | null;
  routeFeature: Feature | null;
}

function MapFlyToBounds({ pois }: { pois: POI[] }) {
  const map = useMap();
  useEffect(() => {
    if (pois.length) {
      const bounds = pois.map((p) => [p.latitude, p.longitude]) as [number, number][];
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
    }
  }, [pois, map]);
  return null;
}

function FlyToMarker({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], 18);
    } else {
      console.warn("FlyToMarker skipped invalid coords", { lat, lon });
    }
  }, [lat, lon, map]);
  return null;
}

function RouteLine({ routeFeature }: { routeFeature: Feature | null }) {
  const theme = useTheme();
  if (
    !routeFeature ||
    (routeFeature.geometry.type !== 'LineString' && routeFeature.geometry.type !== 'MultiLineString')
  ) {
    return null;
  }

  let coords: [number, number][];
  if (routeFeature.geometry.type === 'LineString') {
    coords = (routeFeature.geometry.coordinates as number[][]).map(
      ([lon, lat]) => [lat, lon] as [number, number]
    );
  } else {
    coords = (routeFeature.geometry.coordinates as number[][][])
      .flat()
      .map(([lon, lat]) => [lat, lon] as [number, number]);
  }

  return (
    <Polyline
      positions={coords}
      pathOptions={{ color: theme.palette.primary.main }}
    />
  );
}

export default function MapViewer({ pois, focusedPOI, routeFeature }: Props) {
  const theme = useTheme();
  const center: [number, number] = pois && pois.length
    ? [pois[0].latitude, pois[0].longitude]
    : [32.0853, 34.7818];

  const tileUrl =
    theme.palette.mode === 'dark'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution =
    theme.palette.mode === 'dark'
      ? '© <a href="https://carto.com/">CARTO</a>'
      : '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer url={tileUrl} attribution={attribution} />

      {pois && pois.length > 0 && (
        <>
          <MapFlyToBounds pois={pois} />
          {focusedPOI &&
            Number.isFinite(focusedPOI.latitude) &&
            Number.isFinite(focusedPOI.longitude) && (
              <FlyToMarker lat={focusedPOI.latitude} lon={focusedPOI.longitude} />
            )}
          {pois.map((poi, i) => (
            <Marker
              key={i}
              position={[poi.latitude, poi.longitude]}
              icon={getIconForCategory(poi.categories)}
            >
              <Popup>
                <strong>{poi.name}</strong>
                {poi.description && <p>{poi.description}</p>}
              </Popup>
            </Marker>
          ))}
          {routeFeature ? (
            <RouteLine routeFeature={routeFeature} />
          ) : (
            pois.length > 1 && (
              <Polyline
                positions={pois.map((p) => [p.latitude, p.longitude] as [number, number])}
                pathOptions={{ color: theme.palette.secondary.main }}
              />
            )
          )}
        </>
      )}
    </MapContainer>
  );
}
import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Feature } from 'geojson';
import { useTheme } from '@mui/material';
import { POI } from '../models/POI';
import { CATEGORY_COLORS } from '../styles/icons';

// Load Font Awesome once
if (!document.getElementById('fa-stylesheet')) {
  const link = document.createElement('link');
  link.id = 'fa-stylesheet';
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  document.head.appendChild(link);
}

/** Numbered pin marker — synced with POI list index */
function getNumberedIcon(index: number, categories?: string[], focused = false): L.DivIcon {
  const category = categories?.find(c => typeof c === 'string')?.toLowerCase() || 'default';
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS['default'];
  const size = focused ? 40 : 32;
  const border = focused ? 3 : 2;
  const shadow = focused
    ? '0 2px 12px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,255,255,0.6)'
    : '0 2px 6px rgba(0,0,0,0.35)';

  const html = `
    <div style="
      width:${size}px; height:${size}px;
      background:${color};
      border:${border}px solid #fff;
      border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      color:#fff;
      font-weight:700;
      font-size:${focused ? 14 : 12}px;
      font-family:'Inter','Helvetica Neue',sans-serif;
      box-shadow:${shadow};
      transition:transform 200ms ease-out;
      ${focused ? 'transform:scale(1.2);' : ''}
    ">${index + 1}</div>`;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
}

function MapFlyToBounds({ pois }: { pois: POI[] }) {
  const map = useMap();
  const prevLen = useRef(0);
  useEffect(() => {
    if (pois.length > 0 && pois.length !== prevLen.current) {
      prevLen.current = pois.length;
      const bounds = pois
        .filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude))
        .map(p => [p.latitude, p.longitude]) as [number, number][];
      if (bounds.length > 0) {
        map.flyToBounds(bounds, { padding: [40, 40], duration: 1.2, maxZoom: 16 });
      }
    }
  }, [pois, map]);
  return null;
}

function FlyToMarker({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      map.flyTo([lat, lon], 17, { duration: 0.8 });
    }
  }, [lat, lon, map]);
  return null;
}

function RouteLine({ routeFeature, color }: { routeFeature: Feature; color: string }) {
  if (
    routeFeature.geometry.type !== 'LineString' &&
    routeFeature.geometry.type !== 'MultiLineString'
  ) return null;

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
    <>
      {/* White underlay for contrast on any basemap */}
      <Polyline positions={coords} pathOptions={{ color: '#fff', weight: 9, opacity: 0.7 }} />
      {/* Colored route line */}
      <Polyline positions={coords} pathOptions={{ color, weight: 5, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }} />
    </>
  );
}

export interface Props {
  pois?: POI[] | null;
  focusedPOI: POI | null;
  routeFeature: Feature | null;
}

export default function MapViewer({ pois, focusedPOI, routeFeature }: Props) {
  const theme = useTheme();
  const validPois = Array.isArray(pois) ? pois.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) : [];
  const hasPois = validPois.length > 0;

  const center: [number, number] = hasPois
    ? [validPois[0].latitude, validPois[0].longitude]
    : [32.0853, 34.7818];

  const tileUrl = theme.palette.mode === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const attribution = '&copy; <a href="https://carto.com/">CARTO</a>';

  return (
    <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
      <TileLayer url={tileUrl} attribution={attribution} />

      {hasPois && (
        <>
          <MapFlyToBounds pois={validPois} />
          {focusedPOI &&
            Number.isFinite(focusedPOI.latitude) &&
            Number.isFinite(focusedPOI.longitude) && (
              <FlyToMarker lat={focusedPOI.latitude} lon={focusedPOI.longitude} />
            )}

          {/* Fallback dashed connector when no computed route */}
          {!routeFeature && validPois.length > 1 && (
            <Polyline
              positions={validPois.map(p => [p.latitude, p.longitude] as [number, number])}
              pathOptions={{ color: theme.palette.secondary.main, weight: 3, dashArray: '8 6', opacity: 0.7 }}
            />
          )}

          {routeFeature && (
            <RouteLine routeFeature={routeFeature} color={theme.palette.primary.main} />
          )}

          {validPois.map((poi, i) => {
            const isFocused = focusedPOI?.name === poi.name && focusedPOI?.latitude === poi.latitude;
            return (
              <Marker
                key={i}
                position={[poi.latitude, poi.longitude]}
                icon={getNumberedIcon(i, poi.categories, isFocused)}
                zIndexOffset={isFocused ? 1000 : 0}
              >
                <Popup
                  offset={[0, -4]}
                  closeButton={false}
                  className="travel-popup"
                >
                  <div style={{
                    fontFamily: "'Inter','Helvetica Neue',sans-serif",
                    fontSize: '13px',
                    minWidth: 160,
                    maxWidth: 220,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: CATEGORY_COLORS[poi.categories?.[0]?.toLowerCase() ?? 'default'] || CATEGORY_COLORS['default'],
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}>{i + 1}</div>
                      <strong style={{ lineHeight: 1.3 }}>{poi.name}</strong>
                    </div>
                    {poi.description && (
                      <p style={{ margin: '4px 0', color: '#555', fontSize: 12, lineHeight: 1.4 }}>
                        {poi.description}
                      </p>
                    )}
                    {poi.address && (
                      <p style={{ margin: '4px 0 0', color: '#777', fontSize: 11 }}>
                        {poi.address}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </>
      )}
    </MapContainer>
  );
}

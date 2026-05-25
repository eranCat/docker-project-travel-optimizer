import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Feature } from 'geojson';
import { useTheme } from '@mui/material';
import { POI } from '../models/POI';
const POI_COLOR_LIGHT = '#4f46e5';
const POI_COLOR_DARK = '#818cf8';

// Load Font Awesome once
if (!document.getElementById('fa-stylesheet')) {
  const link = document.createElement('link');
  link.id = 'fa-stylesheet';
  link.rel = 'stylesheet';
  link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
  document.head.appendChild(link);
}

/** Numbered pin marker — synced with POI list index */
function getNumberedIcon(index: number, focused = false, darkMode = false): L.DivIcon {
  const color = darkMode ? POI_COLOR_DARK : POI_COLOR_LIGHT;
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

function MapFitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const prevSig = useRef<string>("");
  // Fingerprint of the point set — changes when switching routes / picking locations
  const sig = points.map(([la, lo]) => `${la.toFixed(5)},${lo.toFixed(5)}`).join("|");

  useEffect(() => {
    if (points.length === 0) return;

    // Skip while the map is hidden (container 0×0) — fit would compute NaN
    const fit = (animate: boolean): boolean => {
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) return false;
      if (points.length === 1) {
        map.flyTo(points[0], Math.max(map.getZoom(), 14), { duration: animate ? 1.2 : 0 });
      } else {
        map.flyToBounds(points, { padding: [40, 40], duration: animate ? 1.2 : 0, maxZoom: 16 });
      }
      return true;
    };

    if (sig !== prevSig.current && fit(true)) {
      prevSig.current = sig;
    }

    // Re-fit when the container becomes visible/resizes (e.g. mobile tab switch)
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      if (sig !== prevSig.current && fit(false)) prevSig.current = sig;
    });
    ro.observe(map.getContainer());
    return () => ro.disconnect();
  }, [sig, map, points]);
  return null;
}

/** Teardrop pin for a selected start/destination location. */
function getEndpointIcon(label: string, color: string): L.DivIcon {
  const html = `
    <div style="
      position:relative; width:30px; height:42px;
      filter:drop-shadow(0 3px 4px rgba(0,0,0,0.4));
    ">
      <div style="
        width:30px; height:30px;
        background:${color};
        border:2.5px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        position:absolute; top:0; left:0;
      "></div>
      <div style="
        position:absolute; top:0; left:0; width:30px; height:30px;
        display:flex; align-items:center; justify-content:center;
        color:#fff; font-weight:800; font-size:14px;
        font-family:'Inter','Helvetica Neue',sans-serif;
      ">${label}</div>
    </div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [30, 42],
    iconAnchor: [15, 38],
    popupAnchor: [0, -36],
  });
}

const M_PER_DEG_LAT = 111320;

/** Capsule (stadium) polygon outlining the A→B corridor: every point within
 *  rMeters of the straight segment a→b. Used to visualise the trip corridor. */
function corridorCapsule(a: LatLon, b: LatLon, rMeters: number): [number, number][] {
  const toRad = Math.PI / 180;
  const midLat = (a.lat + b.lat) / 2;
  const mPerDegLon = M_PER_DEG_LAT * Math.cos(midLat * toRad);
  const toLatLon = (x: number, y: number): [number, number] => [
    a.lat + y / M_PER_DEG_LAT,
    a.lon + x / mPerDegLon,
  ];

  const bx = (b.lon - a.lon) * mPerDegLon;
  const by = (b.lat - a.lat) * M_PER_DEG_LAT;
  const len = Math.hypot(bx, by) || 1;
  const ux = bx / len, uy = by / len;   // unit vector along A→B
  const nx = -uy, ny = ux;              // unit perpendicular
  const r = rMeters;
  const steps = 16;
  const pts: [number, number][] = [];

  pts.push(toLatLon(nx * r, ny * r));            // A + n·r
  pts.push(toLatLon(bx + nx * r, by + ny * r));  // B + n·r
  for (let i = 1; i < steps; i++) {              // arc cap at B (+n → −n via +u)
    const t = (i / steps) * Math.PI;
    const vx = nx * Math.cos(t) + ux * Math.sin(t);
    const vy = ny * Math.cos(t) + uy * Math.sin(t);
    pts.push(toLatLon(bx + vx * r, by + vy * r));
  }
  pts.push(toLatLon(bx - nx * r, by - ny * r));  // B − n·r
  pts.push(toLatLon(-nx * r, -ny * r));          // A − n·r
  for (let i = 1; i < steps; i++) {              // arc cap at A (−n → +n via −u)
    const t = (i / steps) * Math.PI;
    const vx = -nx * Math.cos(t) - ux * Math.sin(t);
    const vy = -ny * Math.cos(t) - uy * Math.sin(t);
    pts.push(toLatLon(vx * r, vy * r));
  }
  return pts;
}

function FlyToMarker({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    const size = map.getSize();
    if (Number.isFinite(lat) && Number.isFinite(lon) && size.x > 0 && size.y > 0) {
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

export interface LatLon { lat: number; lon: number; }

export interface Props {
  pois?: POI[] | null;
  focusedPOI: POI | null;
  routeFeature: Feature | null;
  startPoint?: LatLon | null;
  destPoint?: LatLon | null;
  startLabel?: string;
  destLabel?: string;
  radiusKm?: number;
  mode?: 'explore' | 'trip';
}

const isValidPoint = (p?: LatLon | null): p is LatLon =>
  !!p && Number.isFinite(p.lat) && Number.isFinite(p.lon);

export default function MapViewer({ pois, focusedPOI, routeFeature, startPoint, destPoint, startLabel, destLabel, radiusKm = 0, mode = 'explore' }: Props) {
  const theme = useTheme();
  const validPois = Array.isArray(pois) ? pois.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)) : [];
  const hasPois = validPois.length > 0;

  const start = isValidPoint(startPoint) ? startPoint : null;
  const dest = isValidPoint(destPoint) ? destPoint : null;
  const radiusM = radiusKm > 0 ? radiusKm * 1000 : 0;
  const showRadius = radiusM > 0 && !!start;
  const showCircle = showRadius && mode === 'explore';
  const showCorridor = showRadius && mode === 'trip' && !!dest;
  // Dim the overlay once routes are visible so it doesn't compete with the route line.
  const overlayOpacity = hasPois ? 0.03 : 0.08;
  const overlayStrokeOpacity = hasPois ? 0.25 : 1;

  // Frame the radius overlay: add the lat/lon extremes of the circle/corridor so
  // fitBounds zooms out to show the whole area, not just the centre pin.
  const radiusExtremes = (p: LatLon): [number, number][] => {
    const dLat = radiusM / 111320;
    const dLon = radiusM / (111320 * Math.cos(p.lat * Math.PI / 180));
    return [
      [p.lat + dLat, p.lon], [p.lat - dLat, p.lon],
      [p.lat, p.lon + dLon], [p.lat, p.lon - dLon],
    ];
  };

  // All points the map should keep in view: POIs + selected endpoints (+ radius extremes).
  const fitPoints: [number, number][] = [
    ...validPois.map(p => [p.latitude, p.longitude] as [number, number]),
    ...(start ? [[start.lat, start.lon] as [number, number]] : []),
    ...(dest ? [[dest.lat, dest.lon] as [number, number]] : []),
    ...(showCircle && start ? radiusExtremes(start) : []),
    ...(showCorridor && start ? radiusExtremes(start) : []),
    ...(showCorridor && dest ? radiusExtremes(dest) : []),
  ];

  const center: [number, number] = hasPois
    ? [validPois[0].latitude, validPois[0].longitude]
    : start
      ? [start.lat, start.lon]
      : [32.0853, 34.7818];

  const darkMode = theme.palette.mode === 'dark';
  const poiColor = darkMode ? POI_COLOR_DARK : POI_COLOR_LIGHT;

  const tileUrl = darkMode
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const attribution = '&copy; <a href="https://carto.com/">CARTO</a>';

  return (
    <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }}>
      <TileLayer url={tileUrl} attribution={attribution} />

      <MapFitBounds points={fitPoints} />

      {/* Search radius (explore) / corridor (trip) overlay */}
      {showCircle && start && (
        <Circle
          center={[start.lat, start.lon]}
          radius={radiusM}
          pathOptions={{ color: theme.palette.primary.main, weight: 1.5, opacity: overlayStrokeOpacity, fillColor: theme.palette.primary.main, fillOpacity: overlayOpacity, dashArray: '6 6' }}
        />
      )}
      {showCorridor && start && dest && (
        <Polygon
          positions={corridorCapsule(start, dest, radiusM)}
          pathOptions={{ color: theme.palette.primary.main, weight: 1.5, opacity: overlayStrokeOpacity, fillColor: theme.palette.primary.main, fillOpacity: overlayOpacity, dashArray: '6 6' }}
        />
      )}

      {/* Selected start / destination pins — shown even before a route is generated */}
      {start && (
        <Marker position={[start.lat, start.lon]} icon={getEndpointIcon('A', theme.palette.success.main)} zIndexOffset={500}>
          {startLabel && (
            <Tooltip permanent direction="top" offset={[0, -38]} className={`endpoint-label${darkMode ? ' endpoint-label-dark' : ''}`}>{startLabel}</Tooltip>
          )}
        </Marker>
      )}
      {dest && (
        <Marker position={[dest.lat, dest.lon]} icon={getEndpointIcon('B', theme.palette.error.main)} zIndexOffset={500}>
          {destLabel && (
            <Tooltip permanent direction="top" offset={[0, -38]} className={`endpoint-label${darkMode ? ' endpoint-label-dark' : ''}`}>{destLabel}</Tooltip>
          )}
        </Marker>
      )}

      {hasPois && (
        <>
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
                icon={getNumberedIcon(i, isFocused, darkMode)}
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
                        background: poiColor,
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

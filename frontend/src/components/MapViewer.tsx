import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Feature } from 'geojson';
import { useTheme } from '@mui/material';
import { POI } from '../models/POI';

// Load Font Awesome
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

// Icon mapping for categories
const CATEGORY_ICONS: { [key: string]: string } = {
  restaurant: 'fa-utensils',
  cafe: 'fa-mug-hot',
  bar: 'fa-beer-mug-empty',
  fast_food: 'fa-burger',
  pub: 'fa-champagne-glasses',
  bank: 'fa-piggy-bank',
  hospital: 'fa-hospital',
  school: 'fa-school',
  university: 'fa-graduation-cap',
  library: 'fa-book',
  pharmacy: 'fa-prescription-bottle',
  post_office: 'fa-envelope',
  police: 'fa-shield-halved',
  fire_station: 'fa-fire-extinguisher',
  parking: 'fa-square-parking',
  toilets: 'fa-restroom',
  fountain: 'fa-water',
  marketplace: 'fa-cart-shopping',
  cinema: 'fa-film',
  clinic: 'fa-stethoscope',
  community_centre: 'fa-users',
  charging_station: 'fa-charging-station',
  park: 'fa-tree',
  stadium: 'fa-trophy',
  pitch: 'fa-futbol',
  sports_centre: 'fa-dumbbell',
  swimming_pool: 'fa-person-swimming',
  fitness_centre: 'fa-heart-pulse',
  golf_course: 'fa-golf-ball-tee',
  playground: 'fa-child-reaching',
  garden: 'fa-leaf',
  dog_park: 'fa-dog',
  beach_resort: 'fa-umbrella-beach',
  nature_reserve: 'fa-mountain-sun',
  soccer: 'fa-futbol',
  basketball: 'fa-basketball',
  tennis: 'fa-table-tennis-paddle-ball',
  swimming: 'fa-person-swimming',
  gymnastics: 'fa-person-running',
  athletics: 'fa-running',
  volleyball: 'fa-volleyball',
  baseball: 'fa-baseball-bat-ball',
  rugby: 'fa-football',
  cricket: 'fa-cricket-bat-ball',
  hockey: 'fa-hockey-puck',
  skating: 'fa-person-skating',
  climbing: 'fa-person-hiking',
  equestrian: 'fa-horse',
  table_tennis: 'fa-table-tennis-paddle-ball',
  surfing: 'fa-water',
  diving: 'fa-water',
  skateboarding: 'fa-person-skating',
  museum: 'fa-landmark',
  gallery: 'fa-palette',
  zoo: 'fa-paw',
  viewpoint: 'fa-binoculars',
  attraction: 'fa-star',
  hotel: 'fa-hotel',
  hostel: 'fa-hotel',
  guest_house: 'fa-house',
  camp_site: 'fa-tent',
  alpine_hut: 'fa-house',
  information: 'fa-info-circle',
  theme_park: 'fa-roller-coaster',
  chalet: 'fa-house',
  yes: 'fa-building',
  residential: 'fa-house',
  commercial: 'fa-building',
  retail: 'fa-store',
  industrial: 'fa-industry',
  church: 'fa-church',
  school_building: 'fa-school',
  hospital_building: 'fa-hospital',
  sports_hall: 'fa-dumbbell',
  train_station: 'fa-train',
  apartments: 'fa-building',
  house: 'fa-house',
  hut: 'fa-house',
  garage: 'fa-warehouse',
  warehouse: 'fa-warehouse',
  dormitory: 'fa-house',
  supermarket: 'fa-cart-shopping',
  convenience: 'fa-cart-shopping',
  bakery: 'fa-bread-slice',
  butcher: 'fa-drumstick-bite',
  clothes: 'fa-shirt',
  shoes: 'fa-boot',
  jewelry: 'fa-gem',
  books: 'fa-book',
  electronics: 'fa-laptop',
  florist: 'fa-flower',
  optician: 'fa-glasses',
  kiosk: 'fa-store',
  department_store: 'fa-store',
  beach: 'fa-umbrella-beach',
  wood: 'fa-tree',
  wetland: 'fa-water',
  water: 'fa-water',
  peak: 'fa-mountain',
  valley: 'fa-mountain',
  spring: 'fa-water',
  cave_entrance: 'fa-person-hiking',
  rock: 'fa-mountain',
  cliff: 'fa-mountain',
  bay: 'fa-water',
  sand: 'fa-water',
  glacier: 'fa-snowflake',
  castle: 'fa-chess-rook',
  monument: 'fa-monument',
  memorial: 'fa-monument',
  archaeological_site: 'fa-monument',
  ruins: 'fa-monument',
  fort: 'fa-chess-rook',
  battlefield: 'fa-chess-rook',
  church_historic: 'fa-church',
  wayside_cross: 'fa-cross',
  milestone: 'fa-road',
  government: 'fa-building-columns',
  company: 'fa-building',
  lawyer: 'fa-gavel',
  insurance: 'fa-umbrella',
  ngo: 'fa-hands-helping',
  travel_agent: 'fa-plane',
  diplomatic: 'fa-flag',
  carpenter: 'fa-hammer',
  jeweller: 'fa-gem',
  locksmith: 'fa-key',
  shoemaker: 'fa-boot',
  tailor: 'fa-scissors',
  pottery: 'fa-vase',
  sculptor: 'fa-paintbrush',
  bridge: 'fa-archway',
  pier: 'fa-water',
  lighthouse: 'fa-tower-observation',
  windmill: 'fa-wind',
  water_tower: 'fa-tower-observation',
  mast: 'fa-tower-observation',
  tower: 'fa-tower-observation',
  works: 'fa-industry',
  default: 'fa-map-pin'
};

const CATEGORY_COLORS: { [key: string]: string } = {
  restaurant: "#ff6b6b",
  cafe: "#ffb347",
  park: "#28a745",
  museum: "#6f42c1",
  shop: "#fd7e14",
  default: "#3388ff"
};

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
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    }
  }, [pois, map]);
  return null;
}

function FlyToMarker({ lat, lon }: { lat: number; lon: number }) {
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
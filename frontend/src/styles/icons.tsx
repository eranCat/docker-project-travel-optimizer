// Icon mapping for categories
export const CATEGORY_ICONS: { [key: string]: string } = {
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

// Distinct, accessible colors across all tourist categories.
// Grouped by family so related categories share a hue but remain visually unique.
// Light mode: rich, saturated tones that pop on a white/light map.
export const CATEGORY_COLORS: { [key: string]: string } = {
    // Food & drink — warm reds/oranges/yellows
    restaurant: "#ef4444",       // red
    cafe: "#f59e0b",             // amber
    bar: "#b45309",              // dark amber
    pub: "#a16207",              // deeper amber
    nightclub: "#7c3aed",        // purple — actually night-life
    fast_food: "#f97316",        // orange
    biergarten: "#ca8a04",       // yellow-amber
    ice_cream: "#ec4899",        // pink
    food_court: "#e11d48",       // rose
    marketplace: "#dc2626",      // crimson
    bakery: "#d97706",           // dark amber
    chocolate: "#92400e",        // chocolate brown
    department_store: "#fb923c", // light orange
    mall: "#ea580c",             // burnt orange

    // Culture — purples & teals
    museum: "#7c3aed",           // violet
    gallery: "#9333ea",          // purple
    arts_centre: "#a855f7",      // light purple
    theatre: "#6b21a8",          // deep purple
    theater: "#6b21a8",
    cinema: "#5b21b6",           // indigo-purple
    library: "#0d9488",          // teal
    public_bookcase: "#14b8a6",  // light teal
    community_centre: "#0891b2", // cyan
    attraction: "#c026d3",       // fuchsia
    artwork: "#d946ef",          // bright fuchsia
    viewpoint: "#0ea5e9",        // sky blue
    zoo: "#65a30d",              // lime-ish (animals/green)
    aquarium: "#0284c7",         // ocean blue
    theme_park: "#f43f5e",       // rose

    // Historic — earthy browns and bronzes
    castle: "#78350f",           // dark brown
    monument: "#92400e",         // brown
    memorial: "#a3a3a3",         // gray
    ruins: "#6b7280",            // slate
    archaeological_site: "#57534e", // stone
    fort: "#451a03",             // deep brown
    palace: "#b45309",
    church: "#475569",
    cathedral: "#334155",
    abbey: "#64748b",
    city_gate: "#7c2d12",
    manor: "#a16207",
    building: "#737373",         // historic building generic

    // Leisure — greens
    park: "#16a34a",             // green
    fitness_centre: "#22c55e",   // light green
    sports_centre: "#15803d",    // dark green
    stadium: "#166534",
    water_park: "#06b6d4",       // cyan
    beach_resort: "#0ea5e9",     // sky
    dance: "#db2777",            // pink
    amusement_arcade: "#fbbf24", // yellow
    miniature_golf: "#84cc16",   // lime
    escape_game: "#7c3aed",
    bowling_alley: "#f97316",
    spa: "#a78bfa",              // light violet

    // Nature — greens/blues
    beach: "#0ea5e9",
    wood: "#15803d",
    water: "#0284c7",
    cliff: "#525252",
    hot_spring: "#0d9488",
    cave_entrance: "#3f3f46",
    waterfall: "#0891b2",

    // Man-made landmarks — steel grays
    pier: "#52525b",
    lighthouse: "#1f2937",
    windmill: "#854d0e",
    tower: "#404040",

    // Sport — yellows/limes (different from leisure greens)
    soccer: "#84cc16",
    basketball: "#ea580c",
    tennis: "#facc15",
    swimming: "#06b6d4",
    climbing: "#a16207",
    skating: "#0ea5e9",
    golf: "#65a30d",
    surfing: "#0891b2",
    diving: "#0e7490",
    cycling: "#22c55e",
    skiing: "#3b82f6",

    // Craft (food/drink production) — wine/beer tones
    brewery: "#ca8a04",
    winery: "#7f1d1d",
    distillery: "#78350f",

    // Shopping — pinks (distinct from food oranges)
    books: "#be185d",            // rose
    art: "#a21caf",              // dark fuchsia
    antiques: "#9f1239",         // dark rose
    music: "#be123c",
    musical_instrument: "#9d174d",
    gift: "#db2777",
    craft: "#a855f7",
    second_hand: "#831843",
    jewelry: "#eab308",          // gold

    // Place of worship / religious historic
    place_of_worship: "#475569",

    // Aerialway
    cable_car: "#0369a1",
    chair_lift: "#075985",
    gondola: "#0c4a6e",

    // Fallback
    default: "#3388ff"
};

// Dark mode: same hue families but lighter/more vivid so pins are readable
// against the dark Carto basemap. Every color here passes ~3:1 contrast on #1a1a2e.
export const DARK_CATEGORY_COLORS: { [key: string]: string } = {
    // Food & drink
    restaurant: "#f87171",
    cafe: "#fbbf24",
    bar: "#f59e0b",
    pub: "#fcd34d",
    nightclub: "#c084fc",
    fast_food: "#fb923c",
    biergarten: "#fde68a",
    ice_cream: "#f9a8d4",
    food_court: "#fb7185",
    marketplace: "#f87171",
    bakery: "#fcd34d",
    chocolate: "#d97706",
    department_store: "#fdba74",
    mall: "#fb923c",

    // Culture
    museum: "#a78bfa",
    gallery: "#c084fc",
    arts_centre: "#d8b4fe",
    theatre: "#a855f7",
    theater: "#a855f7",
    cinema: "#818cf8",
    library: "#2dd4bf",
    public_bookcase: "#5eead4",
    community_centre: "#38bdf8",
    attraction: "#e879f9",
    artwork: "#f0abfc",
    viewpoint: "#38bdf8",
    zoo: "#a3e635",
    aquarium: "#60a5fa",
    theme_park: "#fb7185",

    // Historic — lifted from near-black to readable mids
    castle: "#d97706",
    monument: "#fbbf24",
    memorial: "#d1d5db",
    ruins: "#9ca3af",
    archaeological_site: "#a8a29e",
    fort: "#f59e0b",
    palace: "#fcd34d",
    church: "#94a3b8",
    cathedral: "#cbd5e1",
    abbey: "#94a3b8",
    city_gate: "#f97316",
    manor: "#fbbf24",
    building: "#a3a3a3",

    // Leisure
    park: "#4ade80",
    fitness_centre: "#86efac",
    sports_centre: "#4ade80",
    stadium: "#22c55e",
    water_park: "#22d3ee",
    beach_resort: "#38bdf8",
    dance: "#f472b6",
    amusement_arcade: "#fde68a",
    miniature_golf: "#bef264",
    escape_game: "#a78bfa",
    bowling_alley: "#fb923c",
    spa: "#c4b5fd",

    // Nature
    beach: "#38bdf8",
    wood: "#4ade80",
    water: "#60a5fa",
    cliff: "#9ca3af",
    hot_spring: "#2dd4bf",
    cave_entrance: "#a1a1aa",
    waterfall: "#38bdf8",

    // Man-made landmarks — were near-black, now light grays/blues
    pier: "#94a3b8",
    lighthouse: "#e2e8f0",
    windmill: "#d97706",
    tower: "#a3a3a3",

    // Sport
    soccer: "#bef264",
    basketball: "#fb923c",
    tennis: "#fde68a",
    swimming: "#22d3ee",
    climbing: "#fbbf24",
    skating: "#38bdf8",
    golf: "#a3e635",
    surfing: "#38bdf8",
    diving: "#0ea5e9",
    cycling: "#86efac",
    skiing: "#93c5fd",

    // Craft
    brewery: "#fde68a",
    winery: "#f87171",
    distillery: "#d97706",

    // Shopping
    books: "#f472b6",
    art: "#e879f9",
    antiques: "#fb7185",
    music: "#fb7185",
    musical_instrument: "#f472b6",
    gift: "#f472b6",
    craft: "#c084fc",
    second_hand: "#fb7185",
    jewelry: "#fde68a",

    // Place of worship
    place_of_worship: "#94a3b8",

    // Aerialway
    cable_car: "#38bdf8",
    chair_lift: "#7dd3fc",
    gondola: "#bae6fd",

    // Fallback
    default: "#60a5fa"
};

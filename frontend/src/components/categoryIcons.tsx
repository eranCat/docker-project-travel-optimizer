import L from "leaflet";

const createIcon = (emoji: string) =>
    L.divIcon({
        html: `<div style="font-size: 24px;">${emoji}</div>`,
        className: "", // removes default marker class
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30],
    });

const categoryIcons: Record<string, L.DivIcon> = {
    museum: createIcon("🖼️"),
    restaurant: createIcon("🍽️"),
    cafe: createIcon("☕"),
    park: createIcon("🌳"),
    theater: createIcon("🎭"),
    arts_centre: createIcon("🎨"),
    kindergarten: createIcon("🎒"),
    default: createIcon("📍"),
};

export function getIconForCategory(categories?: string[]): L.DivIcon {
    if (!categories || categories.length === 0) return categoryIcons.default;

    for (const cat of categories) {
        if (categoryIcons[cat]) return categoryIcons[cat];
    }

    return categoryIcons.default;
}

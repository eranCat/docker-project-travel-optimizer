export interface POI {
    name: string;
    description?: string;
    address?: string;
    latitude: number;
    longitude: number;
    categories?: string[];
    opening_hours?: string;
}

export interface Props {
    pois: POI[];
    focusedPOI?: any;
}


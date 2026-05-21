export interface POI {
    name: string;
    name_he?: string;
    description?: string;
    address?: string;
    latitude: number;
    longitude: number;
    categories?: string[];
    opening_hours?: string;
    wheelchair_accessible?: boolean;
}

export interface Props {
    pois: POI[];
    focusedPOI?: any;
}


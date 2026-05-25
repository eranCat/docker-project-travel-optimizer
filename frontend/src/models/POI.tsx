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
    wiki_title?: string;
    wikidata_id?: string;
    id?: string;
    osm_type?: string;
}

export interface Props {
    pois: POI[];
    focusedPOI?: any;
}


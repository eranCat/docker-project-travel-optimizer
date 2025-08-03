export interface Suggestion {
    display_name: string;
    // Optional more fields
    address: Record<string, any>;
    lat: string; lon: string;
}

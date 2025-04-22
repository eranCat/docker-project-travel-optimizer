import React from "react";

interface FormData {
    interests: string;
    location: string;
    radius_km: number;
    num_routes: number;
    num_pois: number;
}

interface RouteFormProps {
    form: FormData;
    loading: boolean;
    isFormValid: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
}

const RouteForm: React.FC<RouteFormProps> = ({ form, loading, isFormValid, onChange, onSubmit, onReset }) => {
    return (
        <form className="app-form" onSubmit={onSubmit}>
            <div>
                <label htmlFor="interests">Interests</label>
                <input
                    id="interests"
                    name="interests"
                    value={form.interests}
                    onChange={onChange}
                    placeholder="🎯 e.g., museums, vegan food"
                />
            </div>

            <div>
                <label htmlFor="location">Location</label>
                <input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={onChange}
                    placeholder="📍 e.g., Tel Aviv"
                />
            </div>

            <div className="app-form-row">
                <div>
                    <label htmlFor="radius_km">Radius (km)</label>
                    <input
                        id="radius_km"
                        name="radius_km"
                        type="number"
                        value={form.radius_km}
                        onChange={onChange}
                        placeholder="📏 Radius"
                    />
                </div>

                <div>
                    <label htmlFor="num_routes">Number of Routes</label>
                    <input
                        id="num_routes"
                        name="num_routes"
                        type="number"
                        value={form.num_routes}
                        onChange={onChange}
                        placeholder="🧭 Routes"
                    />
                </div>

                <div>
                    <label htmlFor="num_pois">POIs per Route</label>
                    <input
                        id="num_pois"
                        name="num_pois"
                        type="number"
                        value={form.num_pois}
                        onChange={onChange}
                        placeholder="📌 POIs"
                    />
                </div>
            </div>

            <button
                type="submit"
                className="app-submit-button"
                disabled={!isFormValid || loading}
                style={{
                    opacity: !isFormValid || loading ? 0.5 : 1,
                    cursor: !isFormValid || loading ? "not-allowed" : "pointer",
                }}
            >
                {loading ? "Generating..." : "Generate Route"}
            </button>

            <button type="button" className="app-reset-button" onClick={onReset}>
                🧹 Reset Form
            </button>
        </form>
    );
};

export default RouteForm;

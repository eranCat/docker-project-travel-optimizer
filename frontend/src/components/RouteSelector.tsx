import React from "react";

interface Props {
    selectedIndex: number;
    routeCount: number;
    onSelect: (index: number) => void;
}

const RouteSelector: React.FC<Props> = ({ selectedIndex, routeCount, onSelect }) => {
    if (routeCount <= 1) return null;

    return (
        <div className="app-route-selector">
            <label htmlFor="route-select">Select a Route:</label>
            <select
                id="route-select"
                value={selectedIndex}
                onChange={(e) => onSelect(Number(e.target.value))}
            >
                {Array.from({ length: routeCount }).map((_, index) => (
                    <option key={index} value={index}>
                        Route {index + 1}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default RouteSelector;

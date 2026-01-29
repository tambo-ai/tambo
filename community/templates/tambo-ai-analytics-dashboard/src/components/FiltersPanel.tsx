import React, { useState } from 'react';

interface FiltersPanelProps {
    onFiltersChange: (filters: FilterState) => void;
    initialFilters?: FilterState;
}

export interface FilterState {
    region: string;
    category: string;
    startDate: string;
    endDate: string;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({ onFiltersChange, initialFilters }) => {
    const [filters, setFilters] = useState<FilterState>(
        initialFilters || {
            region: '',
            category: '',
            startDate: '',
            endDate: '',
        }
    );

    const handleChange = (field: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    return (
        <div className="rounded-lg border border-border bg-background p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Filters</h3>
            <div className="flex flex-col gap-4">
                <div>
                    <label htmlFor="region" className="mb-1 block text-sm font-medium text-foreground">
                        Region
                    </label>
                    <select
                        id="region"
                        value={filters.region}
                        onChange={(e) => handleChange('region', e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Regions</option>
                        <option value="North America">North America</option>
                        <option value="Europe">Europe</option>
                        <option value="Asia">Asia</option>
                        <option value="India">India</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="category" className="mb-1 block text-sm font-medium text-foreground">
                        Category
                    </label>
                    <select
                        id="category"
                        value={filters.category}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Furniture">Furniture</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-foreground">
                        Start Date
                    </label>
                    <input
                        id="startDate"
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleChange('startDate', e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-foreground">
                        End Date
                    </label>
                    <input
                        id="endDate"
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleChange('endDate', e.target.value)}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>
        </div>
    );
};

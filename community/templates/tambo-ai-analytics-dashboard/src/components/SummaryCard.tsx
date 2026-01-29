import React from 'react';

interface SummaryCardProps {
    title: string;
    value: string | number;
    description?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, description }) => {
    return (
        <div className="rounded-lg border border-border bg-background p-6">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
    );
};

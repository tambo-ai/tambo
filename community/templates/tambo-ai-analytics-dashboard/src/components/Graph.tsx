import React from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

interface GraphProps {
    data: { name: string; value: number }[];
    type: 'line' | 'bar' | 'pie';
    title?: string;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

export const Graph: React.FC<GraphProps> = ({ data, type, title }) => {
    return (
        <div className="w-full rounded-lg border border-border bg-background p-6">
            {title && <h3 className="mb-4 text-lg font-semibold text-foreground">{title}</h3>}
            <ResponsiveContainer width="100%" height={300}>
                {type === 'bar' ? (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                ) : type === 'line' ? (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                ) : (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                )}
            </ResponsiveContainer>
        </div>
    );
};

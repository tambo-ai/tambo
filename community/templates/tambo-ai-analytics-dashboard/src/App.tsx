import { Graph } from '@/components/Graph';
import { SummaryCard } from '@/components/SummaryCard';
import { MessageThreadCollapsible } from '@/components/tambo/message-thread-collapsible';
import { salesData } from '@/data/sales';
import { componentsArray } from '@/tambo/components';
import { TamboProvider, useTamboThread } from '@tambo-ai/react';
import React, { useMemo } from 'react';

const Dashboard: React.FC = () => {
    const thread = useTamboThread() as any;
    const hasApiKey = !!import.meta.env.VITE_TAMBO_API_KEY;
    const messages = thread?.thread?.messages ?? thread?.currentThread?.messages ?? [];

    // Extract all components from assistant messages
    const allComponents = messages
        .filter((msg: any) => msg.role === 'assistant')
        .flatMap((msg: any) => msg.components ?? []);

    // Calculate default overview stats
    const overviewStats = useMemo(() => {
        const totalRevenue = salesData.reduce((sum, record) => sum + record.revenue, 0);
        const totalTransactions = salesData.length;
        const avgTransactionValue = totalRevenue / totalTransactions;

        // Revenue by region
        const regionRevenue = salesData.reduce((acc, record) => {
            acc[record.region] = (acc[record.region] || 0) + record.revenue;
            return acc;
        }, {} as Record<string, number>);

        const revenueByRegion = Object.entries(regionRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Revenue by category
        const categoryRevenue = salesData.reduce((acc, record) => {
            acc[record.category] = (acc[record.category] || 0) + record.revenue;
            return acc;
        }, {} as Record<string, number>);

        const revenueByCategory = Object.entries(categoryRevenue)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Monthly revenue
        const monthlyRevenue = salesData.reduce((acc, record) => {
            const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
            acc[month] = (acc[month] || 0) + record.revenue;
            return acc;
        }, {} as Record<string, number>);

        const revenueByMonth = Object.entries(monthlyRevenue).map(([name, value]) => ({
            name,
            value,
        }));

        // Top product
        const productRevenue = salesData.reduce((acc, record) => {
            acc[record.product] = (acc[record.product] || 0) + record.revenue;
            return acc;
        }, {} as Record<string, number>);

        const topProduct = Object.entries(productRevenue)
            .sort((a, b) => b[1] - a[1])[0];

        return {
            totalRevenue,
            totalTransactions,
            avgTransactionValue,
            revenueByRegion,
            revenueByCategory,
            revenueByMonth,
            topProduct: topProduct ? { name: topProduct[0], value: topProduct[1] } : null,
        };
    }, []);

    const hasUserInteracted = messages.length > 0;
    const showDefaultDashboard = allComponents.length === 0;

    return (
        <div className="relative flex h-screen flex-col bg-background">
            <header className="border-b border-border bg-background px-6 py-4">
                <h1 className="text-2xl font-bold text-foreground">AI Analytics Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                    Ask questions about your business data in natural language
                </p>
            </header>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="mx-auto max-w-7xl space-y-6">
                    {!hasApiKey && (
                        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-red-800">
                            <p className="font-semibold">Configuration Required</p>
                            <p className="text-sm">Please add your Tambo API key to .env file (VITE_TAMBO_API_KEY) and restart the dev server.</p>
                        </div>
                    )}

                    {showDefaultDashboard && (
                        <>
                            {!hasUserInteracted && (
                                <div className="rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
                                    <h2 className="mb-3 text-2xl font-bold text-foreground">
                                        Welcome to your Analytics Dashboard
                                    </h2>
                                    <p className="mb-6 text-base text-muted-foreground">
                                        Open the chat (bottom right) and ask questions in natural language
                                    </p>
                                    <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
                                        <div className="rounded-md bg-background/50 px-4 py-2 text-sm">
                                            💰 "Show revenue by region"
                                        </div>
                                        <div className="rounded-md bg-background/50 px-4 py-2 text-sm">
                                            📊 "Compare last 3 months"
                                        </div>
                                        <div className="rounded-md bg-background/50 px-4 py-2 text-sm">
                                            🏆 "What are the top products?"
                                        </div>
                                        <div className="rounded-md bg-background/50 px-4 py-2 text-sm">
                                            🔍 "Filter Electronics by region"
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Key Metrics Row */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-lg border border-border bg-card p-4">
                                    <SummaryCard
                                        title="Total Revenue"
                                        value={`$${overviewStats.totalRevenue.toLocaleString()}`}
                                        description="Q4 2025"
                                    />
                                </div>
                                <div className="rounded-lg border border-border bg-card p-4">
                                    <SummaryCard
                                        title="Transactions"
                                        value={overviewStats.totalTransactions}
                                        description="Oct - Dec"
                                    />
                                </div>
                                <div className="rounded-lg border border-border bg-card p-4">
                                    <SummaryCard
                                        title="Avg Transaction"
                                        value={`$${Math.round(overviewStats.avgTransactionValue).toLocaleString()}`}
                                        description="Per sale"
                                    />
                                </div>
                                <div className="rounded-lg border border-border bg-card p-4">
                                    <SummaryCard
                                        title="Top Product"
                                        value={overviewStats.topProduct?.name || 'N/A'}
                                        description={`$${overviewStats.topProduct?.value.toLocaleString() || '0'}`}
                                    />
                                </div>
                            </div>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                <div className="rounded-lg border border-border bg-card p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-foreground">Revenue by Region</h3>
                                    <Graph
                                        data={overviewStats.revenueByRegion}
                                        type="bar"
                                        title="Regional Performance"
                                    />
                                </div>

                                <div className="rounded-lg border border-border bg-card p-6">
                                    <h3 className="mb-4 text-lg font-semibold text-foreground">Revenue by Category</h3>
                                    <Graph
                                        data={overviewStats.revenueByCategory}
                                        type="pie"
                                        title="Category Distribution"
                                    />
                                </div>

                                <div className="rounded-lg border border-border bg-card p-6 lg:col-span-2">
                                    <h3 className="mb-4 text-lg font-semibold text-foreground">Monthly Trend</h3>
                                    <Graph
                                        data={overviewStats.revenueByMonth}
                                        type="line"
                                        title="Revenue Over Time"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {!showDefaultDashboard && (
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {allComponents.map((component: any, index: number) => (
                                <div key={`viz-${index}`} className="rounded-lg border border-border bg-card p-6">
                                    {component}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <MessageThreadCollapsible
                defaultOpen={false}
                className="fixed bottom-4 right-4"
                height="600px"
            />
        </div>
    );
};

export const App: React.FC = () => {
    return (
        <TamboProvider
            components={componentsArray}
            apiKey={import.meta.env.VITE_TAMBO_API_KEY || ''}
            contextKey="analytics-chat"
        >
            <Dashboard />
        </TamboProvider>
    );
};

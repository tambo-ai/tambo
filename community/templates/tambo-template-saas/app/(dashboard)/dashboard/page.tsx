import DashboardCard from "@/components/DashboardCard";
import TamboWrapper from "@/tambo/TamboWrapper";
import TamboChat from "@/components/TamboChat";

export default function DashboardPage() {
    return (
        <TamboWrapper>
            <div className="min-h-[calc(100vh-4rem)] p-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="mt-1 text-muted-foreground">
                        Overview of your SaaS metrics and AI-powered insights
                    </p>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DashboardCard
                        title="Total Revenue"
                        value="$45,231"
                        description="Monthly recurring revenue"
                        trend="up"
                        trendValue="+12.5%"
                    />
                    <DashboardCard
                        title="Active Users"
                        value="2,350"
                        description="Users active this month"
                        trend="up"
                        trendValue="+8.2%"
                    />
                    <DashboardCard
                        title="Conversion Rate"
                        value="3.2%"
                        description="Visitor to customer rate"
                        trend="down"
                        trendValue="-0.4%"
                    />
                    <DashboardCard
                        title="Avg. Session"
                        value="4m 32s"
                        description="Average session duration"
                        trend="neutral"
                        trendValue="0%"
                    />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                            Quick Stats
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">New signups today</span>
                                <span className="font-medium text-card-foreground">47</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Pending invoices</span>
                                <span className="font-medium text-card-foreground">12</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Support tickets</span>
                                <span className="font-medium text-card-foreground">8</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Active subscriptions</span>
                                <span className="font-medium text-card-foreground">1,284</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px]">
                        <TamboChat />
                    </div>
                </div>
            </div>
        </TamboWrapper>
    );
}

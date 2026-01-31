export default function SettingsPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="mt-1 text-muted-foreground">
                    Manage your account and application preferences
                </p>
            </div>

            <div className="max-w-2xl space-y-8">
                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                        Profile
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                            >
                                Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                placeholder="Your name"
                                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                placeholder="your@email.com"
                                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                        Preferences
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-card-foreground">
                                    Email notifications
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Receive email updates about your account
                                </p>
                            </div>
                            <button
                                type="button"
                                className="relative h-6 w-11 rounded-full bg-primary transition-colors"
                                role="switch"
                                aria-checked="true"
                            >
                                <span className="absolute right-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-card-foreground">
                                    Dark mode
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Use system preference for theme
                                </p>
                            </div>
                            <button
                                type="button"
                                className="relative h-6 w-11 rounded-full bg-secondary transition-colors"
                                role="switch"
                                aria-checked="false"
                            >
                                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform" />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 text-lg font-semibold text-card-foreground">
                        API Configuration
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="api-key"
                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                            >
                                Tambo API Key
                            </label>
                            <input
                                type="password"
                                id="api-key"
                                placeholder="tb_..."
                                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-mono placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Your API key is stored in environment variables
                            </p>
                        </div>
                    </div>
                </section>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import Database from "better-sqlite3";

export const auth = betterAuth({
    database: new Database("./sqlite.db"),
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: ["http://localhost:3099", "http://127.0.0.1:3099"],
    user: {
        additionalFields: {
            role: {
                type: "string",
                required: false,
                defaultValue: "user",
            },
            initRole: {
                type: "string",
                required: false,
                input: true, // This allows the client to pass initRole
            },
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user: { initRole?: string } & Record<string, unknown>) => {
                    // BetterAuth databaseHooks receive the data object directly.
                    // We map the temporary 'initRole' to 'role' and strip 'initRole'.
                    const { initRole, ...rest } = user;
                    return {
                        data: {
                            ...rest,
                            role: initRole || "user",
                        },
                    };
                },
            },
        },
    },
    plugins: [admin()],
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
});

export type Auth = typeof auth;

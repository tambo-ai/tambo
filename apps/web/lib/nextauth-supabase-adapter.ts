import { withDbClient } from "@tambo-ai-cloud/db";
import { Adapter, AdapterSession, AdapterUser } from "next-auth/adapters";
import { env } from "./env";

// Type definitions for the adapter
interface CreateUserData {
  id?: string;
  email: string;
  name?: string;
  image?: string;
}

interface UpdateUserData {
  id: string;
  email?: string;
  name?: string | null;
  image?: string | null;
}

interface LinkAccountData {
  userId: string;
  provider: string;
  providerAccountId: string;
  access_token?: string;
  expires_at?: number;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}

interface UnlinkAccountData {
  provider: string;
  providerAccountId: string;
}

export function SupabaseAdapter(): Adapter {
  return {
    async createUser(data: CreateUserData) {
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const now = new Date().toISOString();
        const { rows } = await client.query(
          `INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data) VALUES ($1, $2, $3, $4, $5, $6) returning *`,
          [
            data.id || crypto.randomUUID(),
            data.email,
            now,
            now,
            now,
            data.name ? { name: data.name } : {},
          ],
        );

        if (!rows.length) throw new Error("Failed to create user");
        const user = rows[0];

        return {
          id: user.id,
          email: user.email,
          name: user.raw_user_meta_data?.name,
          image: user.raw_user_meta_data?.avatar_url,
        } as AdapterUser;
      });
    },

    async getUser(id) {
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows: users } = await client.query(
          `SELECT * FROM auth.users WHERE id = $1`,
          [id],
        );

        if (!users.length) return null;
        const user = users[0];

        return {
          id: user.id,
          email: user.email,
          name: user.raw_user_meta_data?.name,
          image: user.raw_user_meta_data?.avatar_url,
        } as AdapterUser;
      });
    },

    async getUserByEmail(email) {
      // console.log("AUTH: Getting user by email", email);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows: users } = await client.query(
          `SELECT * FROM auth.users WHERE email = $1`,
          [email],
        );

        if (!users.length) return null;
        const user = users[0];

        return {
          id: user.id,
          email: user.email,
          name: user.raw_user_meta_data?.name,
          image: user.raw_user_meta_data?.avatar_url,
        } as AdapterUser;
      });
    },

    async getUserByAccount({ provider, providerAccountId }) {
      // console.log("AUTH: Getting user by account", provider, providerAccountId);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows: identity } = await client.query(
          `SELECT * FROM auth.identities WHERE provider = $1 AND provider_id = $2`,
          [provider, providerAccountId],
        );
        // console.log("AUTH: identity: ", identity);

        if (!identity.length) {
          // console.log("AUTH: No identity found", identity);
          return null;
        }

        const { rows: users } = await client.query(
          `SELECT * FROM auth.users WHERE id = $1`,
          [identity[0].user_id],
        );

        if (!users.length) return null;
        const user = users[0];

        return {
          id: user.id,
          email: user.email,
          name: user.raw_user_meta_data?.name,
          image: user.raw_user_meta_data?.avatar_url,
        } as AdapterUser;
      });
    },

    async updateUser(data: UpdateUserData) {
      // console.log("AUTH: Updating user", data);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows } = await client.query(
          `UPDATE auth.users SET email = $1, raw_user_meta_data = $2, updated_at = $3 WHERE id = $4 returning *`,
          [
            data.email,
            data.name ? { name: data.name } : {},
            new Date().toISOString(),
            data.id,
          ],
        );

        if (!rows.length) throw new Error("Failed to update user");
        const user = rows[0];

        return {
          id: user.id,
          email: user.email,
          name: user.raw_user_meta_data?.name,
          image: user.raw_user_meta_data?.avatar_url,
        } as AdapterUser;
      });
    },

    async deleteUser(userId) {
      // console.log("AUTH: Deleting user", userId);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows } = await client.query(
          `DELETE FROM auth.users WHERE id = $1 returning *`,
          [userId],
        );

        if (!rows.length) throw new Error("Failed to delete user");
      });
    },

    async linkAccount(data: LinkAccountData) {
      // console.log("AUTH: Linking account", data);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7) returning *`,
          [
            crypto.randomUUID(),
            data.userId,
            data.provider,
            data.providerAccountId,
            {
              access_token: data.access_token,
              expires_at: data.expires_at,
              refresh_token: data.refresh_token,
              token_type: data.token_type,
              scope: data.scope,
              id_token: data.id_token,
              session_state: data.session_state,
            },
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        );

        if (!rows.length) throw new Error("Failed to link account");
      });
    },

    async unlinkAccount({ provider, providerAccountId }: UnlinkAccountData) {
      // console.log("AUTH: Unlinking account", provider, providerAccountId);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows } = await client.query(
          `DELETE FROM auth.identities WHERE provider = $1 AND provider_id = $2 returning *`,
          [provider, providerAccountId],
        );

        if (!rows.length) throw new Error("Failed to unlink account");
      });
    },

    async createSession(data) {
      // console.log("AUTH: Creating session", data);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows } = await client.query(
          `INSERT INTO auth.sessions (id, user_id, created_at, updated_at) VALUES ($1, $2, $3, $4) returning *`,
          [
            data.sessionToken,
            data.userId,
            new Date().toISOString(),
            new Date().toISOString(),
          ],
        );

        if (!rows.length) throw new Error("Failed to create session");
        const session = rows[0];

        return {
          sessionToken: session.id,
          userId: session.user_id,
          expires: data.expires,
        } as AdapterSession;
      });
    },

    async getSessionAndUser(sessionToken) {
      // console.log("AUTH: Getting session and user", sessionToken);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows: sessions } = await client.query(
          `SELECT * FROM auth.sessions WHERE id = $1`,
          [sessionToken],
        );

        if (!sessions.length) return null;
        const session = sessions[0];

        const { rows: users } = await client.query(
          `SELECT * FROM auth.users WHERE id = $1`,
          [session.user_id],
        );

        if (!users.length) return null;
        const user = users[0];

        return {
          session: {
            sessionToken: session.id,
            userId: session.user_id,
            expires:
              session.not_after || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24h
          } as AdapterSession,
          user: {
            id: user.id,
            email: user.email,
            name: user.raw_user_meta_data?.name,
            image: user.raw_user_meta_data?.avatar_url,
          } as AdapterUser,
        };
      });
    },

    async updateSession(data) {
      // console.log("AUTH: Updating session", data);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows } = await client.query(
          `UPDATE auth.sessions SET updated_at = $1, not_after = $2 WHERE id = $3 returning *`,
          [new Date().toISOString(), data.expires, data.sessionToken],
        );

        if (!rows.length) throw new Error("Failed to update session");
        const session = rows[0];

        return {
          sessionToken: session.id,
          userId: session.user_id,
          expires: data.expires,
        } as AdapterSession;
      });
    },

    async deleteSession(sessionToken) {
      // console.log("AUTH: Deleting session", sessionToken);
      return await withDbClient(env.DATABASE_URL, async (client) => {
        const { rows } = await client.query(
          `DELETE FROM auth.sessions WHERE id = $1 returning *`,
          [sessionToken],
        );

        if (!rows.length) throw new Error("Failed to delete session");
      });
    },

    async createVerificationToken(data) {
      // console.log("AUTH: Creating verification token", data);
      // This would typically use the one_time_tokens table
      // For simplicity, we'll skip this for now
      return data;
    },

    async useVerificationToken({ identifier, token }) {
      // console.log("AUTH: Using verification token", identifier, token);
      // This would typically use the one_time_tokens table
      // For simplicity, we'll skip this for now
      return null;
    },
  };
}

import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { createSupabaseServerClient } from "./supabase.server";

const sessionSecret = process.env.SESSION_SECRET ?? "default-secret-change-me";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function commitSession(
  session: Awaited<ReturnType<typeof getSession>>,
) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(
  session: Awaited<ReturnType<typeof getSession>>,
) {
  return sessionStorage.destroySession(session);
}

export async function getUserFromSession(request: Request) {
  const session = await getSession(request);
  const accessToken = session.get("accessToken") as string | undefined;
  const refreshToken = session.get("refreshToken") as string | undefined;

  if (!accessToken) {
    return null;
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken ?? "",
  });

  if (error || !data.user) {
    return null;
  }

  return {
    user: data.user,
    accessToken: data.session?.access_token ?? accessToken,
  };
}

export async function requireUser(request: Request) {
  const result = await getUserFromSession(request);

  if (!result) {
    throw redirect("/login");
  }

  return result;
}

export async function createUserSession(
  request: Request,
  accessToken: string,
  refreshToken: string,
  redirectTo: string,
) {
  const session = await getSession(request);
  session.set("accessToken", accessToken);
  session.set("refreshToken", refreshToken);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function logout(request: Request) {
  const session = await getSession(request);

  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

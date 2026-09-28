import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "pb_session";
const PLAYER_COOKIE = "pb_player";
const MAX_AGE = 60 * 60 * 24 * 180; // 180 days — nobody wants to retype a code

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Add a random value to .env.local — " +
        'generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }
  return value;
}

function passcode(): string {
  const value = process.env.APP_PASSCODE;
  if (!value) {
    throw new Error(
      "APP_PASSCODE is not set. Add the passcode you want to share with the group to .env.local.",
    );
  }
  return value;
}

const hmac = (input: string) =>
  createHmac("sha256", secret()).update(input).digest("hex");

/** Constant-time string compare that doesn't leak length through timing paths. */
function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", secret()).update(a).digest();
  const hb = createHmac("sha256", secret()).update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * The session token is "<issuedAt>.<signature>", where the signature also
 * covers a digest of the current passcode. Changing APP_PASSCODE therefore
 * signs everybody out, which is the behaviour you want if the code leaks.
 */
function mintToken(): string {
  const issuedAt = Date.now().toString();
  return `${issuedAt}.${hmac(`v1:${issuedAt}:${hmac(passcode())}`)}`;
}

function tokenIsValid(token: string | undefined): boolean {
  if (!token) return false;
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) return false;
  return safeEqual(signature, hmac(`v1:${issuedAt}:${hmac(passcode())}`));
}

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return tokenIsValid(store.get(SESSION_COOKIE)?.value);
}

/** Call at the top of every protected page. Redirects out if not signed in. */
export async function requireSession(): Promise<void> {
  if (!(await isSignedIn())) redirect("/login");
}

/** Returns true and sets the cookie when the passcode matches. */
export async function signIn(attempt: string): Promise<boolean> {
  if (!safeEqual(attempt.trim(), passcode())) return false;

  const store = await cookies();
  store.set(SESSION_COOKIE, mintToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PLAYER_COOKIE);
}

/**
 * "Who am I" — purely for convenience and attribution (highlighting your own
 * row, defaulting your RSVP). It is not a permission: everyone can edit
 * everything, by design.
 */
export async function getCurrentPlayerId(): Promise<string | null> {
  const store = await cookies();
  return store.get(PLAYER_COOKIE)?.value ?? null;
}

export async function setCurrentPlayerId(playerId: string): Promise<void> {
  const store = await cookies();
  store.set(PLAYER_COOKIE, playerId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

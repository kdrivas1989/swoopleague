import { getDb } from "./db";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

const SESSION_COOKIE = "swoop_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "swoop-league-secret-change-me";

// In-memory session store (sufficient for single-instance deployment)
const sessions = new Map<string, { adminId: number; email: string; name: string; expiresAt: number }>();

export async function login(email: string, password: string) {
  const db = getDb();
  const admin = db.prepare("SELECT * FROM admin WHERE email = ?").get(email) as {
    id: number;
    email: string;
    password_hash: string;
    name: string;
  } | undefined;

  if (!admin) return null;
  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) return null;

  const sessionId = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  sessions.set(sessionId, { adminId: admin.id, email: admin.email, name: admin.name, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60,
  });

  return { id: admin.id, email: admin.email, name: admin.name };
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const session = sessions.get(sessionId);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

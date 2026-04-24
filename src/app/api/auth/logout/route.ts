/**
 * POST /api/auth/logout
 *
 * Encerra a sessão do usuário limpando o cookie de sessão.
 */
import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/server/auth/jwt";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Sessão encerrada." });

  response.cookies.set(COOKIE_SESSAO, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0, // Expira imediatamente
  });

  return response;
}

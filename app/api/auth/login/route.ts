import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  const body = await request.json() as { username?: string; password?: string };
  const authenticated = body.username === "admin" && Boolean(env.ADMIN_PASSWORD) && body.password === env.ADMIN_PASSWORD;
  return Response.json({ authenticated }, { status: authenticated ? 200 : 401 });
}

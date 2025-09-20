import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not Found", { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    meetingId?: number;
    kioskId?: string;
    nonce?: string;
    ttlSeconds?: number;
  };
  const meetingId = body.meetingId ?? 1;
  const kioskId = body.kioskId ?? "kiosk_test";
  const nonce = body.nonce ?? crypto.randomUUID();
  const ttl = body.ttlSeconds ?? 90;

  const secret = process.env.QR_CODE_SECRET ?? "testsecret";
  const token = jwt.sign(
    { meetingId, kioskId, nonce, issuedAt: Math.floor(Date.now() / 1000) },
    secret,
    { algorithm: "HS256", expiresIn: ttl },
  );
  return Response.json({ token });
}

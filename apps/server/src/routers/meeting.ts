import { type } from "arktype";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/index.js";
import { protectedProcedure, router } from "../lib/trpc.js";
export const meetingRouter = router({
  generateToken: protectedProcedure
    .input(type({ meetingId: "string" }).assert)
    .query(async ({ input }) => {
      const kioskId = process.env.KIOSK_ID || "kiosk_default";

      const payload = {
        meetingId: input.meetingId,
        kioskId,
        issuedAt: Math.floor(Date.now() / 1000),
        nonce: crypto.randomUUID(),
      };

      const token = jwt.sign(payload, process.env.QR_CODE_SECRET!, {
        algorithm: "HS256",
        expiresIn: CONFIG.tokens.qrTokenTtlSeconds,
      });

      return {
        token,
      };
    }),
});


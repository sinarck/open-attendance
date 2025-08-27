import jwt from "jsonwebtoken";
import z from "zod";
import { CONFIG } from "../config";
import { protectedProcedure, router } from "../lib/trpc";
export const meetingRouter = router({
  generateToken: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
      })
    )
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

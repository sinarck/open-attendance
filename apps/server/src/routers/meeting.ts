import jwt from "jsonwebtoken";
import z from "zod";
import { protectedProcedure, router } from "../lib/trpc";

const TOKEN_EXPIRATION_SECONDS = 60;

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
        expiresIn: TOKEN_EXPIRATION_SECONDS,
      });

      console.log(
        "🔑 Debug - Token generated:",
        token.substring(0, 50) + "..."
      );
      console.log("🔑 Debug - Payload:", payload);
      console.log(
        "🔑 Debug - QR_CODE_SECRET exists:",
        !!process.env.QR_CODE_SECRET
      );

      return { token };
    }),
});


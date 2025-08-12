import jwt from "jsonwebtoken";
import z from "zod";
import { publicProcedure, router } from "../lib/trpc";

const TOKEN_EXPIRATION_SECONDS = 30;

export const meetingRouter = router({
  generateToken: publicProcedure
    .input(
      z.object({
        meetingId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const payload = {
        meetingId: input.meetingId,
        issuedAt: Math.floor(Date.now() / 1000),
        nonce: crypto.randomUUID(),
      };

      const token = jwt.sign(payload, process.env.TOKEN_SECRET!, {
        algorithm: "HS256",
        expiresIn: TOKEN_EXPIRATION_SECONDS,
      });

      return { token };
    }),
});

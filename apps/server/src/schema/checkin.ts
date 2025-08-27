import z from "zod";

export const inputSchema = z.object({
  token: z.string().min(1),
  userId: z.string().regex(/^\d{6}$/, "User ID must be 6 digits"),
  geo: z.object({
    lat: z.number(),
    lng: z.number(),
    accuracyM: z.number().max(2000),
  }),
  deviceFingerprint: z.string().min(1),
});

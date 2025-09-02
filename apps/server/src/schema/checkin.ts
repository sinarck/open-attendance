import { type } from "arktype";

export const inputSchema = type({
  token: "string & /^.+$/",
  userId: "string & /^\\d{6}$/",
  geo: {
    lat: "number",
    lng: "number",
    accuracyM: "number<=2000",
  },
  deviceFingerprint: "string & /^.+$/",
});


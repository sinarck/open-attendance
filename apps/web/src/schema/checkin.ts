import { type } from "arktype";

// Mirror of server schema: apps/server/src/schema/checkin.ts
export const checkinInput = type({
  token: "string & /^.+$/",
  userId: "string & /^\\d{6}$/",
  geo: {
    lat: "number",
    lng: "number",
    accuracyM: "number<=2000",
  },
  deviceFingerprint: "string & /^.+$/",
});



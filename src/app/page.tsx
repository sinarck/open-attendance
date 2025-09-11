"use client";

import { trpc } from "@/trpc/client";

export default function Home() {
  const { data } = trpc.dbCheck.useQuery();

  return <div>{JSON.stringify(data)}</div>;
}

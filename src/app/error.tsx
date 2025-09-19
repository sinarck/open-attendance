"use client";

import { Button } from "@/components/ui/button";

type ErrorPageProps = Readonly<{
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}>;

export default function GlobalError(props: ErrorPageProps) {
  const appCode = (props.error.cause as { appCode?: string } | undefined)
    ?.appCode;
  const code = (props.error.cause as { code?: string } | undefined)?.code;

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">{props.error.message}</p>
      </div>
      {appCode && (
        <p className="text-xs text-muted-foreground">
          App code: <code>{appCode}</code>
          {code ? (
            <>
              {" "}
              | TRPC: <code>{code}</code>
            </>
          ) : null}
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={() => props.reset()}>Try again</Button>
      </div>
    </div>
  );
}

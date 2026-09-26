"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[APP:ERROR]", error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">
        An unexpected error occurred while loading this page. You can try
        again, or head back to the dashboard.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Back to Dashboard
        </Button>
        <Button onClick={() => reset()}>Try again</Button>
      </div>
    </div>
  );
}

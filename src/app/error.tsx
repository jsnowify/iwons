"use client";
import { Button } from "@/components/ui";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="content">
      <div className="error-box">
        <h1>Something interrupted your session.</h1>
        <p>
          Your saved drafts are still on this device. Try loading the page
          again.
        </p>
        <Button onClick={reset} variant="secondary">
          Try again
        </Button>
      </div>
    </div>
  );
}

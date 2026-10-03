"use client";
import { Button } from "@/components/ui/primitives";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty-state">
      <h1>We could not open this page.</h1>
      <p>Please try again. Your saved demo is still in your browser.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}

import { Suspense } from "react";
import GeschiedenisInner from "./GeschiedenisInner";

export default function Page() {
  return (
    <Suspense fallback={<div className="pm-page">Laden…</div>}>
      <GeschiedenisInner />
    </Suspense>
  );
}


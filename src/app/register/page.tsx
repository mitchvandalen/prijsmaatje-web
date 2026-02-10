import { Suspense } from "react";
import RegisterInner from "./RegisterInner";

export default function Page() {
  return (
    <Suspense fallback={<div className="pm-page">Laden…</div>}>
      <RegisterInner />
    </Suspense>
  );
}

import { Suspense } from "react";
import ResetPasswordInner from "./ResetPasswordInner";

export default function Page() {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
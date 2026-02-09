"use client";

import { Suspense } from "react";
import LoginInner from "./LoginInner";

export default function LoginClient() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

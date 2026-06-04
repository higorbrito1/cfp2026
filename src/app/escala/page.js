"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EscalaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/guarda");
  }, [router]);

  return null;
}

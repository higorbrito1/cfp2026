"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RootRedirect() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    router.replace("/inicio");
  }, [router]);

  return mounted ? null : null;
}

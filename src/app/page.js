"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RootRedirect() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  useEffect(() => {
    setMounted(true);
    router.replace(`${basePath}/inicio/`);
  }, [basePath, router]);

  return mounted ? null : null;
}

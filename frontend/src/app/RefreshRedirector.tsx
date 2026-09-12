"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// In-memory variable that resets ONLY on a hard browser refresh
let isAppInitialized = false;

export default function RefreshRedirector() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAppInitialized) {
      // If this is the very first load and we are not on the root page, redirect to root
      const savedDocument = pathname.startsWith("/document/") && localStorage.getItem(`doc_${pathname.split("/")[2]}`);
      if (pathname !== "/" && !savedDocument) {
        router.replace("/");
      }
      isAppInitialized = true;
    }
  }, [pathname, router]);

  return null;
}

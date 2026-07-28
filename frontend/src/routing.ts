import { useEffect, useState } from "react";

const NAVIGATION_EVENT = "wisdom:navigate";

export function navigate(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event(NAVIGATION_EVENT));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function usePathname(): string {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", updatePathname);
    window.addEventListener(NAVIGATION_EVENT, updatePathname);

    return () => {
      window.removeEventListener("popstate", updatePathname);
      window.removeEventListener(NAVIGATION_EVENT, updatePathname);
    };
  }, []);

  return pathname;
}


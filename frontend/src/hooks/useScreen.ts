import { useEffect, useState } from "react";

export type Screen = "mobile" | "tablet" | "desktop";

export default function useScreen(): Screen {
  const [size, setSize] = useState<Screen>("desktop");

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 640)      setSize("mobile");
      else if (w < 768) setSize("tablet");
      else              setSize("desktop");
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return size;
}
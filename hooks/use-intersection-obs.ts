import { useEffect, useRef } from "react";

export function useScrollSystem(sceneStore: any) {
  const containerRef = useRef<HTMLDivElement>(null);
  const setLayoutData = sceneStore((s: any) => s.setLayoutData);

  const measureHeights = () => {
    const sections = containerRef.current?.querySelectorAll<HTMLDivElement>(
      "div[data-element-id]",
    );
    if (!sections) return;

    const heights = Array.from(sections).map((section) =>
      section.getBoundingClientRect().height
    );

    setLayoutData({ heights });
  };

  useEffect(() => {
    const timeoutId = setTimeout(measureHeights, 0);

    window.addEventListener("resize", measureHeights);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", measureHeights);
    };
  }, []);

  return { containerRef };
}

import { useEffect, useRef } from "react";
import sceneStore from "@/state/sceneState";

export function useScrollSystem() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setLayoutData = sceneStore((s) => s.setLayoutData);

  // The reusable function to measure and store heights
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
    // Initial measure after one frame
    const timeoutId = setTimeout(measureHeights, 0);

    // Measure on window resize
    window.addEventListener("resize", measureHeights);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", measureHeights);
    };
  }, []);

  return { containerRef };
}

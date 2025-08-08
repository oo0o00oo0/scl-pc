import { useCallback, useEffect, useRef } from "react";
import sceneStore from "@/state/sceneState";

type SectionEntry = { id: number; element: HTMLElement };

export function useScrollSystem() {
  const setActive = sceneStore((s) => s.setActive);
  const setDomData = sceneStore((s) => s.setDomData);
  const sections = useRef<SectionEntry[]>([]);
  // const inc = sceneStore((s) => s.inc);

  const register = useCallback((id: number, el: HTMLElement | null) => {
    if (!el) return;
    // console.log(el.getBoundingClientRect());
    sections.current = sections.current.filter((s) => s.id !== id);
    sections.current.push({ id, element: el });

    let t = 0;
    sections.current.forEach(({ element }) => {
      const height = element.getBoundingClientRect().height;
      t += height;
    });
    console.log("t", t + window.innerHeight);
  }, []);

  const currentIdRef = useRef<number>(0);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (
            !entry.isIntersecting && currentIdRef.current ===
              Number(entry.target.getAttribute("data-element-id"))
          ) {
            currentIdRef.current =
              Number(entry.target.getAttribute("data-element-id")) - 1;

            const previousElement = sections.current.find(
              (s) => s.id === currentIdRef.current - 1,
            );

            setDomData({
              direction: "up",
              id: currentIdRef.current,
              height: previousElement?.element.getBoundingClientRect().height ??
                0,
            });

            setActive(currentIdRef.current);
          } else if (entry.isIntersecting) {
            currentIdRef.current = Number(
              entry.target.getAttribute("data-element-id"),
            );
            const id = Number(entry.target.getAttribute("data-element-id"));

            setDomData({
              id,
              height: entry.boundingClientRect.height,
              direction: "down",
            });
            setActive(id);
          }
        });
      },
      {
        // threshold: 0,
        // rootMargin: `${bufferHeight}px 0px -${bufferHeight}px 0px`,
      },
    );
    console.log(sections.current);
    sections.current.forEach((s) => obs.observe(s.element));
    return () => {
      obs.disconnect();
    };
  }, [setActive, setDomData]);

  return register;
}

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import sceneStore from "@/state/sceneState";

type SectionEntry = { id: number; element: HTMLElement };

export function useScrollSystem() {
  const setActive = sceneStore((s) => s.setActive);
  const setDomData = sceneStore((s) => s.setDomData);
  const sections = useRef<SectionEntry[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const setLayoutData = sceneStore((s) => s.setLayoutData);

  useLayoutEffect(() => {
    // console.log("containerRef", );
    const sections = containerRef.current?.querySelectorAll<HTMLDivElement>(
      "div[data-element-id]",
    );

    if (!sections) return;

    let heights = [window.innerHeight];

    for (const section of sections) {
      heights.push(section.getBoundingClientRect().height);
    }

    console.log("heights", heights);
    setLayoutData({ heights });
  }, []);
  // const inc = sceneStore((s) => s.inc);

  // const register = useCallback((id: number, el: HTMLElement | null) => {
  //   if (!el) return;
  //   // console.log(el.getBoundingClientRect());
  //   sections.current = sections.current.filter((s) => s.id !== id);
  //   sections.current.push({ id, element: el });

  //   let t = 0;
  //   sections.current.forEach(({ element }) => {
  //     const height = element.getBoundingClientRect().height;
  //     t += height;
  //   });
  // }, []);

  // const currentIdRef = useRef<number>(0);

  // useEffect(() => {
  //   const obs = new IntersectionObserver(
  //     (entries) => {
  //       entries.forEach((entry) => {
  //         if (
  //           entry.isIntersecting
  //         ) {
  //           console.log(
  //             "intersecting",
  //             entry.target.getAttribute("data-element-id"),
  //           );
  //         } else {
  //           console.log(
  //             "not intersecting",
  //             entry.target.getAttribute("data-element-id"),
  //           );
  //         }
  //       });
  //     },
  //     {
  //       // threshold: 0,
  //       // rootMargin: `${bufferHeight}px 0px -${bufferHeight}px 0px`,
  //     },
  //   );
  //   sections.current.forEach((s) => obs.observe(s.element));
  //   return () => {
  //     obs.disconnect();
  //   };
  // }, [setActive, setDomData]);

  return { containerRef };
}

// entries.forEach((entry) => {
//   if (
//     !entry.isIntersecting && currentIdRef.current ===
//       Number(entry.target.getAttribute("data-element-id"))
//   ) {
//     currentIdRef.current =
//       Number(entry.target.getAttribute("data-element-id")) - 1;

//     const previousElement = sections.current.find(
//       (s) => s.id === currentIdRef.current - 1,
//     );

//     setDomData({
//       direction: "up",
//       id: currentIdRef.current,
//       height: previousElement?.element.getBoundingClientRect().height ??
//         0,
//     });

//     setActive(currentIdRef.current);
//   } else if (entry.isIntersecting) {
//     currentIdRef.current = Number(
//       entry.target.getAttribute("data-element-id"),
//     );
//     const id = Number(entry.target.getAttribute("data-element-id"));

//     setDomData({
//       id,
//       height: entry.boundingClientRect.height,
//       direction: "down",
//     });
//     setActive(id);
//   }
// });

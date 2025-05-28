import { useCallback, useRef, useState } from "react";

export const useSplatsLoading = (onID1Loaded: () => void) => {
  const progressRef = useRef<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  const loadingBarRef = useRef<HTMLDivElement>(null);

  const updateProgress = useCallback(
    (updater: (prev: Record<string, number>) => Record<string, number>) => {
      progressRef.current = updater(progressRef.current);

      // Update the loading bar visual progress
      if (loadingBarRef.current) {
        const progressValues = Object.values(progressRef.current);
        const totalProgress = progressValues.length > 0
          ? progressValues.reduce((sum, value) => sum + value, 0) /
            progressValues.length
          : 0;

        loadingBarRef.current.style.width = `${totalProgress}%`;
      }

      // Check conditions after updating progress
      const allProgressLoaded = Object.values(progressRef.current).reduce(
        (acc, value) => {
          return acc && value === 100;
        },
        true,
      );

      const id0loaded = progressRef.current["0"] === 100;

      if (id0loaded && !loaded) {
        setLoaded(true);
        onID1Loaded();
      }
      if (allProgressLoaded && !allLoaded) {
        console.log("allLoaded");
        setAllLoaded(true);
      }
    },
    [loaded, allLoaded, onID1Loaded],
  );

  // Remove the useEffect since we're handling the logic in updateProgress
  // useEffect(() => {
  //   ...
  // }, [progress, loaded, onID1Loaded]);

  return {
    loadingBarRef,
    progress: progressRef.current,
    loaded,
    setProgress: updateProgress,
    allLoaded,
  };
};

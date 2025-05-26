import { useCallback, useEffect, useState } from "react";

export const useSplatsLoading = (onID1Loaded: () => void) => {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  const updateProgress = useCallback(
    (updater: (prev: Record<string, number>) => Record<string, number>) => {
      setProgress(updater);
    },
    [],
  );

  useEffect(() => {
    const allLoaded = Object.values(progress).reduce((acc, value) => {
      return acc && value === 100;
    }, true);

    const id0loaded = progress["0"] === 100;

    if (id0loaded) {
      setLoaded(true);
      onID1Loaded();
    }
    if (allLoaded) {
      console.log("allLoaded");
    }
  }, [progress, loaded, onID1Loaded]);

  return { progress, loaded, setProgress: updateProgress };
};

import { Entity } from "@playcanvas/react";
import { EnvAtlas } from "@playcanvas/react/components";
import { useEnvAtlas } from "@playcanvas/react/hooks";

const Environment = ({ url }: { url: string }) => {
  const { asset } = useEnvAtlas(url);

  if (!asset) return null;

  return (
    <Entity>
      <EnvAtlas asset={asset} />
    </Entity>
  );
};

export default Environment;

import { Entity } from '@playcanvas/react';
import { Render, Script, Camera } from '@playcanvas/react/components';
import { Script as PcScript } from 'playcanvas';

class Spinner extends PcScript {
  t = 0;
  update(dt: number) {
    this.t += dt;
    this.entity.setLocalPosition(Math.sin(this.t * 8) * 1, 0, 0);
  }
}

export const Loader = () => (
  <Entity>
    <Entity position={[0, 0, 40]}>
      <Camera />
    </Entity>
    <Entity>
      <Render type="sphere" />
      <Script script={Spinner} />
    </Entity>
  </Entity>
);

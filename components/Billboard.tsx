/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity } from "@playcanvas/react";
import {
  Render,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import {
  BLEND_NORMAL,
  Color,
  RenderComponent,
  Script,
  StandardMaterial,
  Vec3,
} from "playcanvas";
import { useModel } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";

const Billboard = ({
  label,
  handleClickLabel,
  url,
  scale,
  active,
}: {
  label: any;
  handleClickLabel: (data: {
    id: string;
    position: Vec3;
  }) => void;
  url: string;
  scale: number;
  active: boolean;
}) => {
  const { asset: model } = useModel(url);

  const scriptRef = useRef<TestScript>(null);

  useEffect(() => {
    if (!model) return;
    if (active) {
      scriptRef.current?.setActive(true);
    } else {
      scriptRef.current?.setActive(false);
    }
  }, [active, model]);

  if (!model) return null;
  return (
    <Entity
      position={[label.position[0], label.position[1], label.position[2]]}
    >
      <ScriptComponent
        active={active}
        name={label.name}
        script={TestScript}
        ref={scriptRef}
        scale={scale}
        callback={handleClickLabel}
      />
      <Render asset={model} type="asset" />
    </Entity>
  );
};

class TestScript extends Script {
  callback: (data: any) => void = () => {};
  private _models: any[] | null = null;
  label: any;
  // @ts-ignore
  scale: number;
  private useScreenSpaceScale: boolean = false;
  camera: any;
  private material: StandardMaterial | null = null;
  private bgMaterial: StandardMaterial | null = null;
  color: Color = new Color(0.12, 0.24, 0.43);
  name: string = "";

  initialize() {
    if (!this.entity.children[0]) return;

    this.entity.enabled = false;
    this.camera = this.app.root.children[0];
    this._models = this.entity.children[0].children;
    this.material = new StandardMaterial();
    this.bgMaterial = new StandardMaterial();

    this.bgMaterial.emissive.set(1, 1, 1);
    this.bgMaterial.blendType = BLEND_NORMAL;
    this.bgMaterial.useTonemap = false;
    this.bgMaterial.useLighting = false;
    this.bgMaterial.useSkybox = false;

    this.material.emissive.set(this.color.r, this.color.g, this.color.b);
    this.material.blendType = BLEND_NORMAL;
    this.material.useTonemap = false;
    this.material.useLighting = false;
    this.material.useSkybox = false;
    this.material.cull = 0;

    this.applyBillboardTransform();
    this.applyMaterial();

    if (!this.entity) return;

    this.entity.on("click", () => {
      console.log("CLICKED");
      if (this.callback) {
        this.callback({ id: this.name, position: this.entity.getPosition() });
      }
    });
  }

  applyMaterial() {
    if (!this.material || !this._models) return;

    this._models.forEach((model) => {
      const children = model.children;

      children.forEach((child: any) => {
        if (child && child.render && child.render.meshInstances) {
          const render = child.render as RenderComponent;
          const name = render.entity.name;

          render.meshInstances.forEach((mi: any) => {
            if (name === "bg") {
              mi.material = this.material;
            } else {
              mi.material = this.bgMaterial;
            }
            mi.material.update();
          });
        }
      });
    });
  }

  public setActive(active: boolean) {
    this.entity.enabled = active;
    this.app.renderNextFrame = true;
  }

  applyBillboardTransform() {
    const cameraPosition = this.camera.getPosition();

    this.entity.lookAt(cameraPosition, Vec3.UP);
    this.entity.rotateLocal(-90, 0, 0);

    const baseScale = this.scale;
    let scale = baseScale;

    if (this.useScreenSpaceScale) {
      const distance = this.entity.getPosition().distance(cameraPosition);
      scale = baseScale * (distance / 10);
    }

    this.entity.setLocalScale(
      scale,
      scale,
      scale * -1,
    );
  }

  update() {
    if (!this.entity || !this.entity.enabled || !this.camera) return;
    this.applyBillboardTransform();
  }
}

export default Billboard;

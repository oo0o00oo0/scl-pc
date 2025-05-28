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
import { useEffect } from "react";
import { useState } from "react";

const LabelsShape = ({
  avaiableIds,
  handleClickLabel,
  activeUnit,
  url,
  positionData,
  scale,
  isAmenity = false,
}: {
  avaiableIds: string[];
  handleClickLabel: (data: {
    id: string;
    position: Vec3;
  }) => void;
  activeUnit: string | null;
  url: string;
  positionData: any;
  isAmenity?: boolean;
  scale: number;
}) => {
  const [delayedUnits, setDelayedUnits] = useState<string[]>([]);

  console.log(positionData);

  useEffect(() => {
    if (avaiableIds) {
      setTimeout(() => {
        setDelayedUnits(avaiableIds);
      }, 1000);
    } else {
      setDelayedUnits([]);
    }
  }, [avaiableIds]);

  return (
    <Entity name="billboard">
      {positionData.map((label: any) => {
        const shouldShow = activeUnit
          ? label.name === activeUnit && delayedUnits.includes(label.name)
          : delayedUnits.includes(label.name);

        return (shouldShow || isAmenity) && (
          <Billboard
            scale={scale}
            url={url}
            key={label.name}
            label={label}
            handleClickLabel={handleClickLabel}
          />
        );
      })}
    </Entity>
  );
};

const Billboard = ({
  label,
  handleClickLabel,
  url,
  scale,
}: {
  label: any;
  handleClickLabel: (data: {
    id: string;
    position: Vec3;
  }) => void;
  url: string;
  scale: number;
}) => {
  const { asset: model } = useModel(url);

  if (!model) return null;
  return (
    <Entity
      scale={[0, 0, 0]}
      enabled={false}
      position={[label.position[0], 0.7, label.position[2]]}
    >
      <ScriptComponent
        name={label.name}
        script={TestScript}
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
  scale: number;
  private useScreenSpaceScale: boolean = false;
  camera: any;
  private material: StandardMaterial | null = null;
  private bgMaterial: StandardMaterial | null = null;
  color: Color = new Color(0.12, 0.24, 0.43);
  name: string = "";

  initialize() {
    if (!this.entity.children[0]) return;

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
    this.entity.enabled = true;

    this.entity.on("click", () => {
      if (this.callback) {
        this.callback({ id: this.name, position: this.entity.getPosition() });
      }
    });
  }

  private applyMaterial() {
    if (!this.material || !this._models) return;

    this._models.forEach((model) => {
      const children = model.children;

      children.forEach((child: any) => {
        const render = child.render as RenderComponent;
        const name = render.entity.name;

        if (render?.meshInstances) {
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
    this.applyBillboardTransform();
  }
}

export default LabelsShape;

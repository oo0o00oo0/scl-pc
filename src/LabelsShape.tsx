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
import { plotPositionData } from "../../data/data";

const LabelsShape = ({
  avaiableIds,
  setActiveUnit,
  activeUnit,
  setActiveCameraTarget,
  setActiveCameraPosition,
}: {
  avaiableIds: string[];
  setActiveCameraTarget: (target: Vec3) => void;
  setActiveCameraPosition: (position: Vec3) => void;
  setActiveUnit: (id: string | null) => void;
  activeUnit: string | null;
}) => {
  return (
    <Entity name="billboard">
      {plotPositionData.map((label) => {
        const shouldShow = activeUnit
          ? label.name === activeUnit && avaiableIds.includes(label.name)
          : avaiableIds.includes(label.name);

        return shouldShow && (
          <Billboard
            key={label.name}
            label={label}
            activeUnit={activeUnit}
            setActiveUnit={setActiveUnit}
            setActiveCameraTarget={setActiveCameraTarget}
            setActiveCameraPosition={setActiveCameraPosition}
          />
        );
      })}
    </Entity>
  );
};

const Billboard = ({
  label,
  setActiveUnit,
  activeUnit,
  setActiveCameraTarget,
  setActiveCameraPosition,
}: {
  label: any;
  setActiveUnit: (id: string | null) => void;
  activeUnit: string | null;
  setActiveCameraTarget: (target: Vec3) => void;
  setActiveCameraPosition: (position: Vec3) => void;
}) => {
  const { asset: model } = useModel("test2.glb");

  const handleModelClick = (data: any) => {
    if (!activeUnit) {
      setActiveCameraTarget(data.position);
      setActiveUnit(data.id);
    } else {
      setActiveCameraPosition(new Vec3(0, 0, 0));
      setActiveUnit(null);
    }
  };

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
        callback={handleModelClick}
      />
      <Render asset={model} type="asset" />
    </Entity>
  );
};

class TestScript extends Script {
  callback: (data: any) => void = () => {};
  private _models: any[] | null = null;
  label: any;
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
    console.log("initialize", this.entity);

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

    const baseScale = .3;
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

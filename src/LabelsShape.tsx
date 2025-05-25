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
import { plotPositionData } from "../data/data";

const LabelsShape = ({
  avaiableIds,
  setActiveUnit,
  activeUnit,
}: {
  avaiableIds: string[];
  setActiveUnit: (id: string | null) => void;
  activeUnit: string | null;
}) => {
  return (
    <Entity name="billboard">
      {plotPositionData.map((label) => {
        // If activeUnit exists, only show that label
        // Otherwise, show all labels that are in availableIds
        const shouldShow = activeUnit
          ? label.name === activeUnit && avaiableIds.includes(label.name)
          : avaiableIds.includes(label.name);

        return shouldShow && (
          <Billboard
            key={label.name}
            label={label}
            activeUnit={activeUnit}
            setActiveUnit={setActiveUnit}
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
}: {
  label: any;
  setActiveUnit: (id: string | null) => void;
  activeUnit: string | null;
}) => {
  const { asset: model } = useModel("test2.glb");

  // const app = useApp();

  const handleModelClick = (data: any) => {
    console.log("handleModelClick", data);
    if (!activeUnit) {
      setActiveUnit(data.id);
    } else {
      setActiveUnit(null);
    }
  };

  if (!model) return null;
  return (
    <Entity position={[label.position[0], 0.5, label.position[2]]}>
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
  private size: Vec3 = new Vec3(0.5, 0.5, 0.5);
  camera: any;
  private material: StandardMaterial | null = null;
  private bgMaterial: StandardMaterial | null = null;
  color: Color = new Color(0.12, 0.24, 0.43);
  name: string = "";

  initialize() {
    this.app.on("update", this.updateFromCamera, this);

    if (!this.entity.children[0]) return;

    // this.entity.layer = UILayer.id;

    this.camera = this.app.root.children[0];
    this._models = this.entity.children[0].children;
    this.material = new StandardMaterial();
    this.bgMaterial = new StandardMaterial();

    this.bgMaterial.diffuse.set(0, 0, 0);
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
    // this.material.depthTest = false;
    // this.material.depthWrite = false;

    this.applyMaterial();

    this.entity.on("click", () => {
      if (this.callback) this.callback({ id: this.name });
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

  updateFromCamera() {
    // if (!this.entity || !this.entity.enabled || !this.camera) return;
    const cameraPosition = this.camera.getPosition();
    // console.log("updateFromCamera", cameraPosition);

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
}

export default LabelsShape;

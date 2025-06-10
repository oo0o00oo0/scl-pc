/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity } from "@playcanvas/react";
import {
  Render,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import { Color, RenderComponent, Script } from "playcanvas";
import { useModel } from "@playcanvas/react/hooks";

// const diriyahModelData = {
//   "1": { x: 0, y: 0, z: 0 },
//   "2": { x: 0, y: 0, z: 0 },
//   "3": { x: 0, y: 0, z: 0 },
//   "4": { x: 0, y: 0, z: 0 },
//   "5": { x: 0, y: 0, z: 0 },
// };
interface LabelsShapeProps {
  url: string;
  handleModelClick: (data: any) => void;
  activeDistrict: string | null;
}

const OverlaysShape = ({
  url,
  handleModelClick,
  activeDistrict,
}: LabelsShapeProps) => {
  const { asset: model } = useModel(url);

  // const values = Object.values(diriyahModelData);
  return (
    <>
      {
        /* {values.map((value) => (
        <Entity position={[value.x, value.y, value.z]} scale={[1, 1, 1]}>
          <Render type={"box"}>
          </Render>
        </Entity>
      ))} */
      }

      <Entity position={[0, 3.1, 0]} scale={[1, 0.1, 1]}>
        <Render asset={model as any} type={"asset"}>
          <ScriptComponent
            script={TestScript}
            callback={handleModelClick}
            activeDistrict={activeDistrict === "" ? null : activeDistrict}
          />
        </Render>
      </Entity>
    </>
  );
};

class TestScript extends Script {
  callback: (data: any) => void = () => {};
  activeDistrict: string | null = null;

  private _activeDistrict: string | null = null;
  private readonly selectedColor = new Color(0.01, 0.01, 0.01);
  private readonly defaultColor = new Color(0.01, 0.01, 0.01);
  // private readonly selectedColor = new Color(0.42, 0.82, 0.61);
  // private readonly defaultColor = new Color(0.38, 0.1, 0.62);
  private _models: any[] | null = null;
  private isActive = false;

  updateModels(models: any[]) {
    // Set isActive based on whether any district is currently active
    this.isActive = this.activeDistrict !== null;

    models.forEach((model) => {
      const isSelected = this.activeDistrict === model.name;

      const render = model.render as RenderComponent;
      const colour = isSelected ? this.selectedColor : this.defaultColor;

      if (render?.meshInstances) {
        let needsUpdate = false;

        render.meshInstances.forEach((mi) => {
          // Always update when activeDistrict changes, not just when emissive color differs
          if (
            mi.material.name && mi.material.name !== `${model.name}_material`
          ) {
            mi.material = mi.material.clone();
            mi.material.name = `${model.name}_material`;
          }

          mi.material.emissive = new Color(0.1, 0.1, 0.1);
          // Set opacity: 0 if no active district OR if this is the selected district, 0.8 for non-selected when there's an active district
          // console.log(isSelected, model.name);
          // @ts-ignore
          mi.material.opacity = (!this.isActive || isSelected) ? 0 : 0.8;

          mi.material.emissive.copy(colour);
          needsUpdate = true;
        });

        if (needsUpdate) {
          render.meshInstances.forEach((mi) => {
            mi.material.update();
          });

          this.app.renderNextFrame = true;
          this.app.fire("render");
        }
      }
    });
  }

  initialize() {
    const immediateLayer = this.app.scene.layers.getLayerByName("Immediate");
    this._models = this.entity.children[0].children;

    this._models.forEach((model) => {
      model.on("click", () => {
        if (this.callback) {
          this.callback({ id: model.name });
        }
      });

      const render = model.render as RenderComponent;

      if (immediateLayer && render?.meshInstances) {
        render.layers = [immediateLayer.id];
        render.meshInstances.forEach((mi) => {
          mi.material = mi.material.clone();
          mi.material.name = `${model.name}_material`;
          mi.material.blendType = 4;

          mi.material.update();
        });
      }
    });

    if (this.activeDistrict) this.updateModels(this._models);
  }

  update() {
    if (this.activeDistrict !== this._activeDistrict) {
      this._activeDistrict = this.activeDistrict;
      if (this._models) {
        this.updateModels(this._models);
      }
    }
  }
}

export default OverlaysShape;

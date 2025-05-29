/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Entity } from "@playcanvas/react";
import {
  Render,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import { Color, RenderComponent, Script } from "playcanvas";
import { useModel } from "@playcanvas/react/hooks";
import { diriyahData } from "../../data/diriyahdata";

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

  const values = Object.values(diriyahData);
  console.log(values);

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

      <Entity position={[0, 2.5, 0]} scale={[1, 1, 1]}>
        <Render asset={model as any} type={"asset"}>
          <ScriptComponent
            script={TestScript}
            callback={handleModelClick}
            activeDistrict={activeDistrict}
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
  private readonly selectedColor = new Color(0.42, 0.82, 0.61);
  private readonly defaultColor = new Color(0.38, 0.1, 0.62);
  private _models: any[] | null = null;

  updateModels(models: any[]) {
    models.forEach((model) => {
      const isSelected = this.activeDistrict === model.name;

      const render = model.render as RenderComponent;
      const colour = isSelected ? this.selectedColor : this.defaultColor;

      if (render?.meshInstances) {
        let needsUpdate = false;

        render.meshInstances.forEach((mi) => {
          if (!mi.material.emissive.equals(colour)) {
            if (
              mi.material.name && mi.material.name !== `${model.name}_material`
            ) {
              mi.material = mi.material.clone();
              mi.material.name = `${model.name}_material`;
            }

            mi.material.emissive.copy(colour);
            needsUpdate = true;
          }
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
      console.log(model.name);
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

          mi.material.emissive.copy(
            this.activeDistrict === model.name
              ? this.selectedColor
              : this.defaultColor,
          );
          mi.material.blendType = 7;
          mi.material.emissiveIntensity = 0.5;
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

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Render,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import { BLEND_NORMAL, Color, Script } from "playcanvas";
import { Entity } from "@playcanvas/react";
import { type RenderComponent } from "playcanvas";
import { useAppStore } from "@/state/appStore";
import { useModel } from "@playcanvas/react/hooks";

// @ts-ignore

const backupData = [
  { Plot: "123", Availability: "AVAILABLE" },
  { Plot: "456", Availability: "UNAVAILABLE" },
];

declare module "playcanvas" {
  interface Material {
    emissive: Color;
    blendType: number;
    emissiveIntensity: number;
    opacity: number;
    update(): void;
  }
}

const Overlays = () => {
  const { asset: model } = useModel("/models/overlays.glb");

  const selectedUnit = useAppStore((state: any) => state.selectedUnit);

  // const setStoreState = useAppStore((state: any) => state.setStoreState);

  const handleModelClick = (data: any) => {
    console.log("CLICKED", data, selectedUnit);
    // setStoreState({ selectedUnit: data });
  };

  return (
    <Entity scale={[-1, 1, -1]}>
      <Render asset={model as any} type={"asset"}>
        <ScriptComponent
          script={TestScript}
          callback={handleModelClick}
          activePlot={selectedUnit?.unit}
        />
      </Render>
    </Entity>
  );
};

class TestScript extends Script {
  callback: (data: any) => void = () => {};

  private readonly selectedColor = new Color(0.90, 0.91, 0.92);
  // private readonly defaultColor = new Color(0, 0, 0);
  private _models: any[] | null = null;
  private _activePlot: string | null = null;

  set activePlot(v: string | null) {
    if (this._activePlot !== v) {
      this._activePlot = v;

      if (this._models) this.updateModels(this._models);
    }
  }
  get activePlot() {
    return this._activePlot;
  }

  updateModels(models: any[]) {
    console.log("UPDATING MODELS", this._activePlot);
    models.forEach((model) => {
      const isSelected = this.activePlot === model.name.split(".")[1];

      const render = model.render as RenderComponent;

      model.enabled = true;

      if (render?.meshInstances) {
        let needsUpdate = false;

        render.meshInstances.forEach((mi) => {
          if (mi.material.opacity !== (isSelected ? 0.7 : 0.0)) {
            mi.material.opacity = isSelected ? 0.7 : 0.0;
            needsUpdate = true;
          }
        });

        if (needsUpdate) {
          render.meshInstances.forEach((mi) => mi.material.update());
          this.app.renderNextFrame = true;
        }
      }
    });
  }

  initialize() {
    const immediateLayer = this.app.scene.layers.getLayerByName("Immediate");
    this._models = this.entity.children[0].children;

    this._models.forEach((model) => {
      model.on("click", () => {
        const name = model.name;

        if (this.callback) this.callback(name);

        this.activePlot = name.split(".")[1];
        this.updateModels(this._models!);
      });

      const render = model.render as RenderComponent;

      if (immediateLayer && render?.meshInstances) {
        render.layers = [immediateLayer.id];
        render.meshInstances.forEach((mi) => {
          // mi.material.emissive.copy(
          //   enabled ? this.defaultColor : this.unavailableColor,
          // );
          mi.material.emissive.copy(this.selectedColor);

          mi.material.opacity = 0.0;
          mi.material.blendType = BLEND_NORMAL;
          mi.material.update();
        });
      }
    });

    if (this._activePlot) this.updateModels(this._models);
  }
}

export default Overlays;

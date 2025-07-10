/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Render,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import { BLEND_NORMAL, Color, Script } from "playcanvas";
import { Entity } from "@playcanvas/react";
import { type RenderComponent } from "playcanvas";
import { useAppStore } from "@/state/appStore";

declare module "playcanvas" {
  interface Material {
    emissive: Color;
    blendType: number;
    emissiveIntensity: number;
    opacity: number;
    update(): void;
  }
}

interface OverlaysProps {
  data: any[];
  model: any;
  handleModelClick: (data: any) => void;
  activePlot: string | null;
  disable: boolean;
}

const Overlays = (
  { data, model, handleModelClick, activePlot, disable }: OverlaysProps,
) => {
  if (data.length === 0) return null;

  return (
    <Entity scale={[-1, 1, -1]}>
      <Render asset={model as any} type={"asset"}>
        <ScriptComponent
          availableIDS={data.map((unit: any) => unit.unit.replace(" ", ""))}
          script={TestScript}
          callback={handleModelClick}
          activePlot={activePlot}
          disable={disable}
        />
      </Render>
    </Entity>
  );
};

class TestScript extends Script {
  callback: (data: any) => void = () => {};

  // private readonly selectedColor = new Color(0.90, 0.91, 0.92);
  private readonly selectedColor = new Color(0.24, 0.30, 0.30);
  // private readonly defaultColor = new Color(0, 0, 0);
  private _models: any[] | null = null;
  private _activePlot: string | null = null;
  private _availableIDS: string[] = [];
  private _disable: boolean = false;
  set availableIDS(v: string[]) {
    this._availableIDS = v;
  }
  get availableIDS() {
    return this._availableIDS;
  }

  set disable(v: boolean) {
    this._disable = v;
    if (this._models) this.updateModels(this._models);
  }
  get disable() {
    return this._disable;
  }

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
    models.forEach((model) => {
      const isSelected = this.activePlot === model.name;

      const render = model.render as RenderComponent;

      model.enabled = !this._disable;

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

        // this.updateModels(this._models!);
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

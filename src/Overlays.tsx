/* eslint-disable @typescript-eslint/no-explicit-any */
import { useModel } from "./hooks/use-asset";
import {
  Render,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import { Color, Script } from "playcanvas";
import { Entity } from "@playcanvas/react";
import { type RenderComponent } from "playcanvas";
import projectStore from "../state/store";
const backupData = [
  { Plot: "123", Availability: "AVAILABLE" },
  { Plot: "456", Availability: "UNAVAILABLE" },
];

declare module "playcanvas" {
  interface Material {
    emissive: Color;
    blendType: number;
    emissiveIntensity: number;
    update(): void;
  }
}

const Overlays = () => {
  const { data: model } = useModel("pin.glb");
  const setStoreState = projectStore((state) => state.setStoreState);
  const activeUnit = { Plot: "123" };

  const handleModelClick = (data: any) => {
    setStoreState({ activeZone: data });
  };

  const activePlot = activeUnit?.Plot ?? null;

  return (
    <Entity scale={[-100, -100, 100]}>
      <Render asset={model as any} type={"box"}>
        <ScriptComponent
          script={TestScript}
          callback={handleModelClick}
          activePlot={activePlot}
        />
      </Render>
    </Entity>
  );
};

export default Overlays;

class TestScript extends Script {
  callback: (data: any) => void = () => {};

  private _activePlot: string | null = null;
  set activePlot(v: string | null) {
    if (this._activePlot !== v) {
      this._activePlot = v;
      this.selectedModel = v;

      if (this._models) this.updateModels(this._models);
    }
  }
  get activePlot() {
    return this._activePlot;
  }

  selectedModel: string | null = null;
  private readonly selectedColor = new Color(0.42, 0.82, 0.61);
  private readonly defaultColor = new Color(0.38, 0.1, 0.62);
  private readonly unavailableColor = new Color(
    0.38,
    0.1,
    0.62 * Math.random(),
  );
  private _models: any[] | null = null;

  updateModels(models: any[]) {
    models.forEach((model) => {
      const isSelected = this.selectedModel === model.name;

      const render = model.render as RenderComponent;
      const data = backupData.find((item) => item.Plot === model.name);
      const enabled = data?.Availability === "AVAILABLE";

      const colour = isSelected
        ? this.selectedColor
        : enabled
        ? this.defaultColor
        : this.unavailableColor;

      if (render?.meshInstances) {
        let needsUpdate = false;

        render.meshInstances.forEach((mi) => {
          if (!mi.material.emissive.equals(colour)) {
            mi.material.emissive.copy(colour);
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
    // Renders mesh's on top of the splat
    const immediateLayer = this.app.scene.layers.getLayerByName("Immediate");
    this._models = this.entity.children[0].children;

    this._models.forEach((model) => {
      model.on("click", () => {
        const name = model.name;

        if (this.callback) this.callback(name);

        this.selectedModel = name;
        this.updateModels(this._models!);
      });

      const render = model.render as RenderComponent;
      const data = backupData.find((item) => item.Plot === model.name);
      const enabled = data?.Availability === "AVAILABLE";

      if (immediateLayer && render?.meshInstances) {
        render.layers = [immediateLayer.id];
        render.meshInstances.forEach((mi) => {
          mi.material.emissive.copy(
            enabled ? this.defaultColor : this.unavailableColor,
          );
          mi.material.blendType = 7;
          mi.material.emissiveIntensity = 0.5;
          mi.material.update();
        });
      }
    });

    if (this._activePlot) this.updateModels(this._models);
  }
}

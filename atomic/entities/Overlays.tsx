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
import { useFilteredUnits } from "@/hooks/useUnits";
import { useFiltersStore } from "@/state/filtersStore";
import { useLocation } from "@tanstack/react-router";

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
  const { pathname } = useLocation();
  const { asset: model } = useModel("/models/overlays.glb");
  const { filters } = useFiltersStore();
  const { setStoreState } = useAppStore();
  const { data: response } = useFilteredUnits(
    filters,
  );

  const { data } = response;

  const selectedUnit = useAppStore((state: any) => state.selectedUnit);

  const handleModelClick = (unitName: any) => {
    if (pathname === "/residences") {
      const unit = data.find((unit: any) =>
        unit.unit.replace(" ", "") === unitName
      );
      setStoreState({ selectedUnit: unit });
    }
  };
  if (data.length === 0) return null;

  return (
    <Entity scale={[-1, 1, -1]}>
      <Render asset={model as any} type={"asset"}>
        <ScriptComponent
          availableIDS={data.map((unit: any) => unit.unit.replace(" ", ""))}
          script={TestScript}
          callback={handleModelClick}
          activePlot={selectedUnit?.unit.replace(" ", "")}
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

  set availableIDS(v: string[]) {
    this._availableIDS = v;
  }
  get availableIDS() {
    return this._availableIDS;
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

    console.log("_availableIDS", this._availableIDS);

    this._models.forEach((model) => {
      model.on("click", () => {
        const name = model.name;
        console.log("name", name);

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

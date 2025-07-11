/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Render,
  Script as ScriptComponent,
} from "@playcanvas/react/components";
import { BLEND_NORMAL, Color, Script, Vec2, Vec3 } from "playcanvas";
import { Entity } from "@playcanvas/react";
import { type RenderComponent } from "playcanvas";

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
  handleModelClick: (name: string, data?: any) => void;
  activeID: string | null;
  visible: boolean;
  onInit: (data: any[]) => void;
  disabled: boolean;
}

const Overlays = (
  { data, model, handleModelClick, activeID, visible, onInit, disabled }:
    OverlaysProps,
) => {
  if (data.length === 0) return null;

  return (
    <Entity scale={[-1, 1, -1]}>
      <Render asset={model as any} type={"asset"}>
        <ScriptComponent
          availableIDS={data}
          script={OverlaysScript}
          callback={handleModelClick}
          activeID={activeID}
          visible={visible}
          onInit={onInit}
          disabled={disabled}
        />
      </Render>
    </Entity>
  );
};

class OverlaysScript extends Script {
  private _visible: boolean = false;
  private _disabled: boolean = false;
  callback: (name: string, data?: any) => void = () => {};
  onInit: (data: any[]) => void = () => {};

  // private readonly selectedColor = new Color(0.90, 0.91, 0.92);
  private readonly selectedColor = new Color(0.24, 0.30, 0.30);
  // private readonly defaultColor = new Color(0, 0, 0);
  private models: any[] | null = null;
  private _activeID: string | null = null;
  private _availableIDS: string[] = [];
  private clickPosition: Vec2 = new Vec2(0, 0);
  private modelData: any[] = [];

  set availableIDS(v: string[]) {
    this._availableIDS = v;
  }

  set visible(v: boolean) {
    this._visible = v;
    if (this.models) this.updateModels();
  }

  set activeID(v: string | null) {
    if (this._activeID !== v) {
      this._activeID = v;
      if (this.models) this.updateModels();
    }
  }

  set disabled(v: boolean) {
    this._disabled = v;
    if (this.models) this.updateModels();
  }

  get activeID() {
    return this._activeID;
  }

  updateModels() {
    const models = this.models;

    if (!models) return;

    models.forEach((model) => {
      const isSelected = this.activeID === model.name && this._visible;
      if (this._disabled) {
        model.enabled = false;
        return;
      } else {
        model.enabled = true;
      }
      const render = model.render as RenderComponent;
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
    this.models = this.entity.children[0].children;
    this.modelData = this.models.map((model) => getModelVertecies(model));
    console.log("this.modelData", this.modelData);
    this.onInit(this.modelData);

    this.models.forEach((model) => {
      model.on("pointerdown", (e: any) => {
        const downVec = new Vec2(e.nativeEvent.clientX, e.nativeEvent.clientY);
        this.clickPosition.copy(downVec);
      });
    });

    this.models.forEach((model) => {
      model.on("pointerup", (e: any) => {
        const upVec = new Vec2(e.nativeEvent.clientX, e.nativeEvent.clientY);
        const distance = upVec.distance(this.clickPosition);
        if (distance > 2) return;
        const name = model.name;

        const modelData = this.modelData.find((data) => data.name === name);

        if (this.callback) this.callback(name, modelData);
      });

      const render = model.render as RenderComponent;

      if (immediateLayer && render?.meshInstances) {
        render.layers = [immediateLayer.id];
        render.meshInstances.forEach((mi) => {
          mi.material.emissive.copy(this.selectedColor);

          mi.material.opacity = 0.0;
          mi.material.blendType = BLEND_NORMAL;
          mi.material.update();
        });
      }
    });

    if (this._activeID) this.updateModels();
  }
}

const getModelVertecies = (model: any) => {
  const positions: number[] = [];

  const render = model.render as RenderComponent;
  const meshInstances = render?.meshInstances;

  meshInstances?.map((mi) => {
    mi.mesh.getPositions(positions);
  });

  const partition = positions.reduce(
    (acc: number[][], curr: number, index: number) => {
      if (index % 3 === 0) {
        acc.push([]);
      }
      acc[acc.length - 1].push(curr);
      return acc;
    },
    [],
  );

  const vertecies = partition.map((p) => new Vec3(p[0] * -1, p[1], p[2] * -1));

  const sumPoint = vertecies.reduce(
    (acc, curr) => acc.add(curr),
    new Vec3(0, 0, 0),
  );

  const averagePoint = new Vec3(
    sumPoint.x / vertecies.length,
    sumPoint.y / vertecies.length,
    sumPoint.z / vertecies.length,
  );

  return {
    name: model.name,
    vertices: vertecies,
    sum: sumPoint,
    center: averagePoint,
  };
};

export default Overlays;

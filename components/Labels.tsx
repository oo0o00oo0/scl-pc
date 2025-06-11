/* eslint-disable @typescript-eslint/ban-ts-comment */
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
import { useState } from "react";
import { useApp, useModel, useTexture } from "@playcanvas/react/hooks";

const labels = [
  {
    id: "1",
    name: "label1",
    texture: "labels/home-marker.webp",
    position: [0, 2, 0],
  },
  {
    id: "2",
    name: "label2",
    texture: "labels/home-marker.webp",
    position: [2, 2, 0],
  },
];

const Labels = () => {
  const [selectedObject, setSelectedObject] = useState<any>(null);
  return (
    <Entity name="labels">
      {labels.map((label) => (
        <Billboard
          key={label.id}
          label={label}
          selectedObject={selectedObject}
          setSelectedObject={setSelectedObject}
        />
      ))}
    </Entity>
  );
};

const Billboard = ({
  label,
  selectedObject,
  setSelectedObject,
}: {
  label: any;
  selectedObject: any;
  setSelectedObject: (id: string) => void;
}) => {
  const { asset: model } = useModel("/test2.glb");
  const { asset: texture, loading: labelLoading } = useTexture(label.texture);

  const app = useApp();
  const camera = app?.root.children[0];

  const handleModelClick = (data: any) => {
    console.log("clicked", data);
    setSelectedObject(data.id);
    console.log("Current selected:", selectedObject);
  };

  return (
    <Entity name="billboard" position={label.position}>
      {!labelLoading && texture && (
        <ScriptComponent
          script={TestScript}
          callback={handleModelClick}
          label={texture}
          camera={camera}
        />
      )}
      {/* @ts-ignore */}
      <Render asset={model} type="plane" />
    </Entity>
  );
};

class TestScript extends Script {
  callback: (data: any) => void = () => {};

  selectedModel: string | null = null;
  private _models: any[] | null = null;
  label: any;
  private useScreenSpaceScale: boolean = false;
  private size: Vec3 = new Vec3(1, 1, 1);
  camera: any;
  private material: StandardMaterial | null = null;
  color: Color = new Color(0.12, 0.24, 0.43);

  initialize() {
    if (!this.entity.children[0]) return;

    this._models = this.entity.children[0].children;
    this.material = new StandardMaterial();

    this.material.diffuse.set(0, 0, 0);
    this.material.emissive.set(this.color.r, this.color.g, this.color.b);
    this.material.blendType = BLEND_NORMAL;
    this.material.useTonemap = false;
    this.material.useLighting = false;
    this.material.useSkybox = false;
    this.material.cull = 0;

    this.applyMaterial();

    if (this.label) {
      if (this.label.resource) {
        this.updateTexture();
      } else {
        this.label.on("load", () => {
          console.log("Texture loaded, updating material");
          this.updateTexture();
        });

        if (this.label.loaded) {
          console.log("Asset already loaded, updating material");
          this.updateTexture();
        }
      }
    } else {
      console.warn("No label asset provided to TestScript");
    }

    this.entity.on("click", () => {
      if (this.callback) this.callback({ id: this.entity.name });
    });
  }

  applyMaterial() {
    if (!this._models || !this.material) return;

    this._models.forEach((model) => {
      const render = model.render as RenderComponent;
      if (render?.meshInstances) {
        render.meshInstances.forEach((mi) => {
          mi.material = this.material!;
        });
      }
    });
  }

  updateTexture() {
    if (!this.material || !this.label?.resource) return;
    this.material.diffuseMap = this.label.resource;
    this.material.update();
  }

  update() {
    if (!this.entity || !this.entity.enabled || !this.camera) return;
    const cameraPosition = this.camera.getPosition();

    this.entity.lookAt(cameraPosition, Vec3.UP);
    this.entity.rotateLocal(-90, 0, 0);

    const baseScale = 2;
    let scale = baseScale;

    if (this.useScreenSpaceScale) {
      const distance = this.entity.getPosition().distance(cameraPosition);
      scale = baseScale * (distance / 10);
    }

    // Apply scale while maintaining the size proportions
    this.entity.setLocalScale(
      scale * this.size.x,
      scale * this.size.y,
      scale * this.size.z * -1,
    );
  }
}

export default Labels;

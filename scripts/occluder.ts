import {
  Color,
  Material,
  Mesh,
  MeshInstance,
  RenderComponent,
  Script,
} from "playcanvas";

class Occluder extends Script {
  initialize() {
    const immediateLayer = this.app.scene.layers.getLayerByName("Immediate");
    const entity = this.entity;
    const renderComponents = entity.findComponents("render");

    renderComponents.forEach((renderComp: any) => {
      console.log(immediateLayer);
      renderComp.layers = [immediateLayer?.id];
      renderComp.meshInstances.forEach((meshInstance: MeshInstance) => {
        const material = meshInstance.material as Material;

        material.emissive.set(1, 1, 1);
        // material.redWrite = false;
        // material.greenWrite = false;
        // material.blueWrite = false;
        // material.alphaWrite = false;
        // material.depthTest = true;
        // material.depthWrite = true;
        material.update();
      });
      console.log(renderComp);
    });
  }
}

export default Occluder;

import { Script } from "playcanvas";
import { easeInOutQuad } from "../utils";

class LandscapeScript extends Script {
  private animating: boolean = false;
  private targetOpacity: number = 0;
  private currentOpacity: number = 0;
  private startOpacity: number = 0;
  private animationDuration: number = 50;
  private elapsedTime: number = 0;
  private onComplete: () => void = () => {};
  private material: any;
  private _opacityOverride: number = 1;

  // initialize() {
  // }

  update(dt: number) {
    if (!this.animating) return;

    this.elapsedTime += dt * 1000;
    const progress = Math.min(this.elapsedTime / this.animationDuration, 1);

    const easedProgress = easeInOutQuad(progress);

    this.currentOpacity = this.startOpacity +
      (this.targetOpacity - this.startOpacity) * easedProgress;

    const reachedTarget = progress >= 1;

    if (reachedTarget) {
      this.animating = false;
      this.currentOpacity = this.targetOpacity;
      this.onComplete?.();
    }

    this.material.setParameter(
      "uSplatOpacity",
      this.currentOpacity * this._opacityOverride,
    );

    this.app.renderNextFrame = true;
  }

  public animateToOpacity(
    targetOpacity: number,
    durationMs: number = 1000,
    onComplete: () => void,
  ): void {
    this.onComplete = onComplete;
    this.targetOpacity = Math.max(0, Math.min(1, targetOpacity));
    this.animationDuration = Math.max(16, durationMs);

    this.startOpacity = this.currentOpacity;
    this.elapsedTime = 0;
    this.animating = true;
  }

  public initializeMaterial(vertex: string, onInitialize?: () => void): void {
    const gsplatComponent = this.entity.findComponent("gsplat") as any;
    const material = gsplatComponent?.material;

    material.getShaderChunks("glsl").set("gsplatVS", vertex);
    material.setParameter("uSplatOpacity", 0);

    this.material = material;

    onInitialize?.();
  }
}

export default LandscapeScript;

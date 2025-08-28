import { Script } from "playcanvas";
import { easeInOutQuad } from "../utils";

class LandscapeScript extends Script {
  private animating: boolean = false;
  private targetOpacity: number = 0;
  private currentOpacity: number = 0;
  private startOpacity: number = 0;
  private animationDuration: number = 50; // milliseconds
  private elapsedTime: number = 0;
  private onComplete: () => void = () => {};
  private material: any;
  private _opacityOverride: number = 1;
  private _url: string = "";

  set url(url: string) {
    this._url = url;
  }

  get url(): string {
    return this._url;
  }

  get opacity() {
    return this.currentOpacity;
  }

  initialize() {
  }

  update(dt: number) {
    if (!this.animating) return;

    this.elapsedTime += dt * 1000; // Convert dt to milliseconds
    const progress = Math.min(this.elapsedTime / this.animationDuration, 1);

    // Apply easing to the progress
    const easedProgress = easeInOutQuad(progress);

    // Calculate current opacity based on eased progress
    this.currentOpacity = this.startOpacity +
      (this.targetOpacity - this.startOpacity) * easedProgress;

    const reachedTarget = progress >= 1;

    if (reachedTarget) {
      this.animating = false;
      this.currentOpacity = this.targetOpacity;
      this.onComplete?.();

      // If faded out completely, disable the entity
      if (this.targetOpacity === 0) {
        this.entity.enabled = false;
      }
      this.app.autoRender = false;
    }

    // Always update material parameter while animating or when reaching target
    if (this.material?.setParameter) {
      this.material.setParameter(
        "uSplatOpacity",
        this.currentOpacity * this._opacityOverride,
      );
    }

    // [RENDER:ANIM] Request render during animation
    this.app.renderNextFrame = true;
  }

  public animateToOpacity(
    targetOpacity: number,
    durationMs: number = 1000,
    onComplete: () => void,
  ): void {
    console.log(this.url);
    console.log("TARGET", targetOpacity);
    console.log("----");
    this.onComplete = onComplete;
    this.targetOpacity = Math.max(0, Math.min(1, targetOpacity));
    this.animationDuration = Math.max(16, durationMs);

    if (!this.entity.enabled) {
      this.entity.enabled = true;
    }

    this.startOpacity = this.currentOpacity;
    this.elapsedTime = 0;
    this.animating = true;
  }

  public getCurrentOpacity(): number {
    return this.currentOpacity;
  }

  public isAnimating(): boolean {
    return this.animating;
  }

  public initializeMaterial(vertex: string, onInitialize?: () => void): void {
    const gsplatComponent = this.entity.findComponent("gsplat") as any;
    const material = gsplatComponent?.material;
    this.material = material;

    this.material.getShaderChunks("glsl").set("gsplatVS", vertex);
    this.material.setParameter("uSplatOpacity", 0);

    onInitialize?.();
  }
}

export default LandscapeScript;

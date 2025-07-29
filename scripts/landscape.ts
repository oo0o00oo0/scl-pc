import { Script } from "playcanvas";
import { easeInOutQuad } from "../utils";

class LandscapeScript extends Script {
  private animating: boolean = false;
  private targetOpacity: number = 0;
  private currentOpacity: number = 0;
  private startOpacity: number = 0;
  private animationDuration: number = 50; // milliseconds
  private elapsedTime: number = 0;

  initialize() {
    this.entity.enabled = false;
    // this.entity.on("gsplat:ready", () => {
    //   this.currentOpacity = 0;
    //   this.targetOpacity = 0;
    //   // [RENDER:INIT] Request render after gsplat ready
    //   this.app.renderNextFrame = true;
    // });
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

      // If faded out completely, disable the entity
      if (this.targetOpacity === 0) {
        this.entity.enabled = false;
      }

      this.app.autoRender = false;
    }

    // Always update material parameter while animating or when reaching target
    const gsplatComponent = this.entity.findComponent("gsplat") as any;
    const material = gsplatComponent?.material;

    if (material?.setParameter) {
      material.setParameter("uSplatOpacity", this.currentOpacity);
    }

    // [RENDER:ANIM] Request render during animation
    this.app.renderNextFrame = true;
  }

  public animateToOpacity(
    targetOpacity: number,
    durationMs: number = 1000,
  ): void {
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
}

export default LandscapeScript;

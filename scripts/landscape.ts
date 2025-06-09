import { Entity as PcEntity, Script } from "playcanvas";
import { easeInOutQuad, lerpRate } from "../utils";

class LandscapeScript extends Script {
  private animating: boolean = false;
  private targetOpacity: number = 0;
  private currentOpacity: number = 0;
  private startOpacity: number = 0;
  private animationDuration: number = 50; // milliseconds
  private elapsedTime: number = 0;

  initialize() {
    this.entity.enabled = false;
    this.entity.on("gsplat:ready", (_: PcEntity) => {
      // Don't automatically set opacity to 1 - let the animation system control it
      // Just initialize the current and target opacity to 0 to match the initial state
      this.currentOpacity = 0;
      this.targetOpacity = 0;
      this.app.renderNextFrame = true;
    });
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
      console.log("setting opacity", this.currentOpacity);
      material.setParameter("uSplatOpacity", this.currentOpacity);
    }

    this.app.renderNextFrame = true;
  }

  public animateToOpacity(
    targetOpacity: number,
    durationMs: number = 1000,
    instant: boolean = false,
  ): void {
    this.targetOpacity = Math.max(0, Math.min(1, targetOpacity)); // Clamp between 0 and 1
    this.animationDuration = Math.max(16, durationMs); // Minimum 16ms (1 frame at 60fps)

    // Enable entity to ensure update() runs
    if (!this.entity.enabled) {
      this.entity.enabled = true;
    }

    if (instant) {
      this.currentOpacity = this.targetOpacity;
      this.animating = false;

      const gsplatComponent = this.entity.findComponent("gsplat") as any;
      const material = gsplatComponent?.material;

      if (material?.setParameter) {
        console.log("setting opacity", this.currentOpacity);
        material.setParameter("uSplatOpacity", this.currentOpacity);
      }

      this.app.renderNextFrame = true;

      // If animating to 0, disable entity after setting opacity
      if (this.targetOpacity === 0) {
        // this.entity.enabled = false;
      }
    } else {
      this.startOpacity = this.currentOpacity;
      this.elapsedTime = 0;
      this.animating = true;
    }
  }

  public getCurrentOpacity(): number {
    return this.currentOpacity;
  }

  public isAnimating(): boolean {
    return this.animating;
  }

  // animateIn() {
  //   this.entity.enabled = true;
  //   this.animateToOpacity(1);
  //   this.app.autoRender = false;
  // }

  // animateOut() {
  //   this.animateToOpacity(0);
  //   // Don't disable entity immediately - let animation complete
  //   this.app.autoRender = false;
  // }
}

export default LandscapeScript;

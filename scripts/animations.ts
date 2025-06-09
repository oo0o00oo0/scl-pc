import { Color, Script } from "playcanvas";
import type { MeshInstance } from "playcanvas";
import { lerpRate } from "../utils";

const COLOR_CHANGE_THRESHOLD = 0.001;

const COLOR_DAMPING = 0.95;

class Animations extends Script {
  private meshInstance: MeshInstance | null = null;
  private currentColor: Color = new Color(1, 0.5, 0);
  private targetColor: Color = new Color(1, 0.5, 0);
  private animating: boolean = false;
  public damping: number = COLOR_DAMPING;

  initialize() {
    const render = this.entity.render;
    if (render && render.meshInstances.length > 0) {
      this.meshInstance = render.meshInstances[0];
    }
  }

  update(dt: number) {
    if (!this.meshInstance || !this.meshInstance.material) return;
    if (!this.animating) return;

    const rate = lerpRate(this.damping, dt);

    const prevColor = new Color(
      this.currentColor.r,
      this.currentColor.g,
      this.currentColor.b,
    );

    this.currentColor.lerp(this.currentColor, this.targetColor, rate);

    const hasSignificantColorChange =
      Math.abs(this.currentColor.r - prevColor.r) > COLOR_CHANGE_THRESHOLD ||
      Math.abs(this.currentColor.g - prevColor.g) > COLOR_CHANGE_THRESHOLD ||
      Math.abs(this.currentColor.b - prevColor.b) > COLOR_CHANGE_THRESHOLD;

    const reachedTarget = Math.abs(this.currentColor.r - this.targetColor.r) <
        COLOR_CHANGE_THRESHOLD &&
      Math.abs(this.currentColor.g - this.targetColor.g) <
        COLOR_CHANGE_THRESHOLD &&
      Math.abs(this.currentColor.b - this.targetColor.b) <
        COLOR_CHANGE_THRESHOLD;

    if (reachedTarget) {
      this.animating = false;
      this.currentColor.copy(this.targetColor);
    }

    if (hasSignificantColorChange || reachedTarget) {
      const material = this.meshInstance.material as any;

      if (material.setParameter) {
        material.setParameter("uColor", [
          this.currentColor.r,
          this.currentColor.g,
          this.currentColor.b,
          1.0,
        ]);
      } else if (material.diffuse) {
        material.diffuse.copy(this.currentColor);
        material.update();
      }

      this.app.renderNextFrame = true;
    }
  }

  public animateToColor(targetColor: Color, instant: boolean = false): void {
    this.targetColor.copy(targetColor);

    if (instant) {
      this.currentColor.copy(targetColor);
      this.animating = false;

      if (this.meshInstance?.material) {
        const material = this.meshInstance.material as any;
        if (material.setParameter) {
          material.setParameter("uColor", [
            this.currentColor.r,
            this.currentColor.g,
            this.currentColor.b,
            1.0,
          ]);
        } else if (material.diffuse) {
          material.diffuse.copy(this.currentColor);
          material.update();
        }
        this.app.renderNextFrame = true;
      }
    } else {
      this.animating = true;
    }
  }

  public getCurrentColor(): Color {
    return new Color(
      this.currentColor.r,
      this.currentColor.g,
      this.currentColor.b,
    );
  }

  public isAnimating(): boolean {
    return this.animating;
  }
}

export default Animations;

import { Color, Script } from "playcanvas";
import type { MeshInstance } from "playcanvas";

// Color change threshold - only render if color changes by more than this amount
const COLOR_CHANGE_THRESHOLD = 0.001;

// Animation damping - similar to camera-controls (0 = instant, closer to 1 = slower)
// const COLOR_DAMPING = 0.95;
const COLOR_DAMPING = 0.95;

/**
 * Calculate the lerp rate with damping, similar to camera-controls
 */
const lerpRate = (damping: number, dt: number): number => {
  return 1 - Math.pow(damping, dt * 60); // 60fps normalized
};

class Animations extends Script {
  private meshInstance: MeshInstance | null = null;
  private currentColor: Color = new Color(1, 0.5, 0); // Current animated color
  private targetColor: Color = new Color(1, 0.5, 0); // Target color to animate to
  private animating: boolean = false;

  // Public property that can be set from outside
  public damping: number = COLOR_DAMPING;

  initialize() {
    // Get the mesh instance from the render component
    const render = this.entity.render;
    if (render && render.meshInstances.length > 0) {
      this.meshInstance = render.meshInstances[0];
    }
  }

  update(dt: number) {
    if (!this.meshInstance || !this.meshInstance.material) return;
    if (!this.animating) return;

    // Calculate lerp rate based on damping and delta time
    const rate = lerpRate(this.damping, dt);

    // Lerp current color towards target
    const prevColor = new Color(
      this.currentColor.r,
      this.currentColor.g,
      this.currentColor.b,
    );
    this.currentColor.lerp(this.currentColor, this.targetColor, rate);
    console.log("rendering");
    // Check if color has changed significantly
    const hasSignificantColorChange =
      Math.abs(this.currentColor.r - prevColor.r) > COLOR_CHANGE_THRESHOLD ||
      Math.abs(this.currentColor.g - prevColor.g) > COLOR_CHANGE_THRESHOLD ||
      Math.abs(this.currentColor.b - prevColor.b) > COLOR_CHANGE_THRESHOLD;

    // Check if we've reached the target (within threshold)
    const reachedTarget = Math.abs(this.currentColor.r - this.targetColor.r) <
        COLOR_CHANGE_THRESHOLD &&
      Math.abs(this.currentColor.g - this.targetColor.g) <
        COLOR_CHANGE_THRESHOLD &&
      Math.abs(this.currentColor.b - this.targetColor.b) <
        COLOR_CHANGE_THRESHOLD;

    if (reachedTarget) {
      this.animating = false;
      // Snap to exact target
      this.currentColor.copy(this.targetColor);
    }

    // Only update and render if there's a significant change
    if (hasSignificantColorChange || reachedTarget) {
      // Try to access material properties safely
      const material = this.meshInstance.material as any;

      // Update material color - works for both standard and custom materials
      if (material.setParameter) {
        // For custom shader materials
        material.setParameter("uColor", [
          this.currentColor.r,
          this.currentColor.g,
          this.currentColor.b,
          1.0,
        ]);
      } else if (material.diffuse) {
        // For standard materials
        material.diffuse.copy(this.currentColor);
        material.update();
      }

      // Only force a render frame when there's a significant change
      this.app.renderNextFrame = true;
    }
  }

  /**
   * Animate to a target color
   * @param targetColor - The Color object to animate towards
   * @param instant - If true, immediately set to target without animation
   */
  public animateToColor(targetColor: Color, instant: boolean = false): void {
    this.targetColor.copy(targetColor);

    if (instant) {
      this.currentColor.copy(targetColor);
      this.animating = false;

      // Update material immediately
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

  /**
   * Get the current animated color
   */
  public getCurrentColor(): Color {
    return new Color(
      this.currentColor.r,
      this.currentColor.g,
      this.currentColor.b,
    );
  }

  /**
   * Check if currently animating
   */
  public isAnimating(): boolean {
    return this.animating;
  }
}

export default Animations;

import { Entity } from "@playcanvas/react";
import { EnvAtlas } from "@playcanvas/react/components";
import { useApp, useEnvAtlas } from "@playcanvas/react/hooks";
import { useEffect, useRef } from "react";
import { Quat, Script, Vec3 } from "playcanvas";
import { Script as ScriptPC } from "@playcanvas/react/components";
import { easeInOutQuad } from "@/libs/utils";
import projectStore from "@/state/store";

const Environment = ({ url }: { url: string }) => {
  const { asset } = useEnvAtlas(url);
  const scriptRef = useRef<EnvAnimationScript>(null);
  const app = useApp();
  const activeScene = projectStore((state) => state.activeScene);

  useEffect(() => {
    // let t = 0;

    // scriptRef.current?.animateToIntensity(10, 1000); // const handleSwitchIntensity = setInterval(() => {
    scriptRef.current?.setSkyboxRotationY(activeScene?.skyboxPosition || 0);
    // setTimeout(() => {
    //   scriptRef.current?.animateToIntensity(1, 400);
    // }, 400);
  }, [app, asset, activeScene]);

  if (!asset) return null;

  return (
    <Entity>
      <EnvAtlas asset={asset} />
      <ScriptPC script={EnvAnimationScript} ref={scriptRef} />
    </Entity>
  );
};

export default Environment;

class EnvAnimationScript extends Script {
  private animating: boolean = false;
  private targetIntensity: number = 0;
  private currentIntensity: number = 0;
  private startIntensity: number = 0;
  private animationDuration: number = 1000; // milliseconds
  private elapsedTime: number = 0;

  initialize() {
    // Access the PlayCanvas application
  }

  public animateToIntensity(intensity: number, durationMs: number = 1000) {
    // this.targetIntensity = Math.max(0, Math.min(1, intensity)); // Clamp between 0 and 1
    this.targetIntensity = intensity; // Clamp between 0 and 1
    this.animationDuration = Math.max(16, durationMs); // Minimum 16ms (1 frame at 60fps)

    this.animating = true;
    this.startIntensity = this.currentIntensity;
    this.elapsedTime = 0;
  }

  update(dt: number) {
    if (!this.animating) return;

    this.elapsedTime += dt * 1000; // Convert dt to milliseconds

    const progress = Math.min(this.elapsedTime / this.animationDuration, 1);
    const easedProgress = easeInOutQuad(progress);

    this.currentIntensity = this.startIntensity +
      (this.targetIntensity - this.startIntensity) * easedProgress;

    // Update the intensity every frame!
    this.app.scene.skyboxIntensity = this.currentIntensity;

    if (progress >= 1) {
      this.animating = false;
      this.currentIntensity = this.targetIntensity;
      this.app.scene.skyboxIntensity = this.currentIntensity;
      this.app.scene.skyboxLuminance = this.currentIntensity;
    }

    this.app.renderNextFrame = true;
  }

  setSkyboxRotationY(angleDegrees: number) {
    console.log("setSkyboxRotationY", angleDegrees);
    const angleRad = angleDegrees;
    const quat = new Quat();
    quat.setFromAxisAngle(Vec3.UP, angleRad);
    this.app.scene.skyboxRotation = quat;
  }
}

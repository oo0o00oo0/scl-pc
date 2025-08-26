import type { Vec3 } from "playcanvas";

export interface AzimuthConstraint {
  type: "unlimited" | "range";
  center?: number; // Center direction in degrees (0 = forward)
  range?: number; // How many degrees left/right from center (e.g., 45 = ±45°)
}

export interface CameraConstraints {
  pitchRange?: { min: number; max: number };
  azimuth?: AzimuthConstraint;
  enableZoom?: boolean;
}

export interface CamState {
  position: Vec3;
  target: Vec3;
  delay?: number;
  isScrollTarget?: boolean;
  cameraConstraints: CameraConstraints;
}

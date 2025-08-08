export interface AzimuthConstraint {
  type: "unlimited" | "range" | "sector";

  // For 'range' type: allows rotation within +/- degrees from center
  center?: number; // Center direction in degrees (0 = forward)
  range?: number; // How many degrees left/right from center (e.g., 45 = ±45°)

  // For 'sector' type: allows rotation between two specific directions
  fromAngle?: number; // Start angle in degrees
  toAngle?: number; // End angle in degrees
}

export interface CameraConstraints {
  pitchRange: { min: number; max: number };
  azimuth: AzimuthConstraint;
  enableZoom: boolean;
}

export interface CamState {
  position: any; // Vec3
  target: any; // Vec3
  delay?: number;
  isScroll?: boolean;
  cameraConstraints: CameraConstraints;
}

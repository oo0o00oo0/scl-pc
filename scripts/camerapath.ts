import { Curve, CURVE_SPLINE, Entity, math, Script, Vec3 } from "playcanvas";

export class CameraPath extends Script {
  time: number = 0;
  points: any[] = [];

  // Curve objects for position interpolation
  px!: Curve;
  py!: Curve;
  pz!: Curve;

  // Curve objects for target look-at position
  tx!: Curve;
  ty!: Curve;
  tz!: Curve;

  // Curve objects for up vector
  ux!: Curve;
  uy!: Curve;
  uz!: Curve;

  // Cached Vec3 objects
  lookAt!: Vec3;
  up!: Vec3;

  // UI elements
  div!: HTMLDivElement;
  resumeFlythroughButton!: HTMLButtonElement;
  pathSlider!: HTMLInputElement;

  // Control flags
  flyingThrough!: boolean;

  // Note: html and css assets are no longer needed as UI is built programmatically

  /**
   * Path Root.
   *
   * @attribute
   * @title Path Root
   * @type {pc.Entity}
   */
  pathRoot?: Entity;

  /**
   * Manual path points - alternative to using pathRoot
   * Define your camera path as an array of {position, lookAt?, up?} objects
   */
  manualPathPoints?: Array<{
    position: { x: number; y: number; z: number };
    lookAt?: { x: number; y: number; z: number };
    up?: { x: number; y: number; z: number };
  }>;

  /**
   * Duration in seconds.
   *
   * @attribute
   * @title Duration Secs
   * @type {number}
   */
  duration: number = 10;

  /**
   * Start time in seconds.
   *
   * @attribute
   * @title Start Time (Secs)
   * @type {number}
   * @description Start the path from a specific point in time.
   */
  startTime: number = 0;

  initialize(): void {
    console.log(this.points);
    // Generate the camera path using pc.Curve: http://developer.playcanvas.com/en/api/pc.Curve.html
    this.createPath();
    // this.addUi();

    this.time = math.clamp(this.startTime, 0, this.duration);

    this.lookAt = new Vec3();
    this.up = new Vec3();

    this.flyingThrough = false;
  }

  update(): void {
    // Use the time set by scroll position (normalized 0-1)
    const percent = math.clamp(this.time, 0, 1);

    // Check if curves are initialized
    if (!this.px || !this.py || !this.pz) {
      console.warn("Position curves not initialized!");
      return;
    }

    // Get interpolated values
    const newX = this.px.value(percent);
    const newY = this.py.value(percent);
    const newZ = this.pz.value(percent);

    // Interpolate position
    this.entity.setPosition(newX, newY, newZ);

    // Interpolate look-at target
    this.lookAt.set(
      this.tx.value(percent),
      this.ty.value(percent),
      this.tz.value(percent),
    );

    // Interpolate up vector
    this.up.set(
      this.ux.value(percent),
      this.uy.value(percent),
      this.uz.value(percent),
    );

    // Make the camera look at the interpolated target position
    this.entity.lookAt(this.lookAt, this.up);
  }

  createPath(): void {
    const curveMode = CURVE_SPLINE;
    // const curveMode = CURVE_LINEAR;

    // Create curves for position
    this.px = new Curve();
    this.px.type = curveMode;
    this.py = new Curve();
    this.py.type = curveMode;
    this.pz = new Curve();
    this.pz.type = curveMode;

    // Create curves for target look-at position
    this.tx = new Curve();
    this.tx.type = curveMode;
    this.ty = new Curve();
    this.ty.type = curveMode;
    this.tz = new Curve();
    this.tz.type = curveMode;

    // Create curves for the 'up' vector
    this.ux = new Curve();
    this.ux.type = curveMode;
    this.uy = new Curve();
    this.uy.type = curveMode;
    this.uz = new Curve();
    this.uz.type = curveMode;

    this.createTestPath();
  }

  /**
   * Creates a simple test path around the current camera position when no path nodes are available
   */

  createTestPath(): void {
    // const centerPos = new Vec3(-5.055642, 0.78553, 3.346625);
    const centerPos = new Vec3(2.749073, 4, 5.169055);

    for (let i = 0; i < this.points.length; i++) {
      const pt = this.points[i];
      const t = i / (this.points.length - 1);
      this.px.add(t, pt.x);
      this.py.add(t, pt.y);
      this.pz.add(t, pt.z);
      this.tx.add(t, centerPos.x);
      this.ty.add(t, centerPos.y);
      this.tz.add(t, centerPos.z);
      this.ux.add(t, 0);
      this.uy.add(t, 1);
      this.uz.add(t, 0);
      // Removed the extra i++ here - it was causing the loop to skip every other point
    }

    console.log("Camera path created with", this.points.length, "points");
    console.log("Position curve X:", this.px);
  }

  setTime(time: number): void {
    console.log("SET TIME", time);
    this.time = time;
    // Force an update when time changes
    this.update();
  }

  getCurvePointFromTime(time: number, animate: boolean = false): Vec3 {
    const percent = math.clamp(time, 0, 1);
    const targetPosition = new Vec3(
      this.px.value(percent),
      this.py.value(percent),
      this.pz.value(percent),
    );

    if (animate && this.entity) {
      // Calculate target look-at position
      this.lookAt.set(
        this.tx.value(percent),
        this.ty.value(percent),
        this.tz.value(percent),
      );

      // Calculate up vector
      this.up.set(
        this.ux.value(percent),
        this.uy.value(percent),
        this.uz.value(percent),
      );

      // Animate the camera to the target position
      this.entity.setPosition(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z,
      );
      this.entity.lookAt(this.lookAt, this.up);

      // Update internal time to maintain consistency
      this.time = time;
    }

    return targetPosition;
  }

  /**
   * Clean up UI elements when the script is destroyed
   */
  destroy(): void {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  }
}

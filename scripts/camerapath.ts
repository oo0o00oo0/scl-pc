import {
  Curve,
  // CURVE_LINEAR,
  CURVE_SPLINE,
  Entity,
  math,
  Script,
  Vec3,
} from "playcanvas";

type V3 = { x: number; y: number; z: number };

export class CameraPath extends Script {
  // timeline
  time: number = 0;

  // optional: raw points/planes if you want to populate from elsewhere
  points: any[] = [];
  planes: any[] = [];

  // Curves: position
  px!: Curve;
  py!: Curve;
  pz!: Curve;

  // Curves: forward/Z direction (used to compute target procedurally)
  fx!: Curve;
  fy!: Curve;
  fz!: Curve;

  // Optional curves: up vector (defaults to 0,1,0 if not used)
  ux!: Curve;
  uy!: Curve;
  uz!: Curve;

  // Optional curves: explicit target (only used if you tell it to)
  tx!: Curve;
  ty!: Curve;
  tz!: Curve;

  // Cached objects
  lookAt!: Vec3;
  up!: Vec3;

  // UI (unused here)
  div!: HTMLDivElement;
  resumeFlythroughButton!: HTMLButtonElement;
  pathSlider!: HTMLInputElement;

  // flags
  flyingThrough!: boolean;

  // attributes
  pathRoot?: Entity;

  manualPathPoints?: Array<{
    position: V3;
    lookAt?: V3;
    up?: V3;
  }>;

  duration: number = 10;
  startTime: number = 0;

  // config: if set, overrides dynamic look distance
  private _fixedLookDist?: number;

  // temp
  private _tmpDir = new Vec3();

  initialize(): void {
    this.createPath();
    this.time = math.clamp(this.startTime, 0, this.duration);
    this.lookAt = new Vec3();
    this.up = new Vec3(0, 1, 0);
    this.flyingThrough = false;
  }

  update(): void {
    const t = math.clamp(this.time, 0, 1);

    if (!this.px || !this.py || !this.pz) {
      console.warn("CameraPath: position curves not initialized");
      return;
    }

    // position
    const x = this.px.value(t);
    const y = this.py.value(t);
    const z = this.pz.value(t);
    this.entity.setPosition(x, y, z);

    // target (procedural from direction curves)
    this.getTargetFromTime(t, this.lookAt);

    // up (optional curves; else default)
    if (this.ux && this.uy && this.uz) {
      this.up.set(this.ux.value(t), this.uy.value(t), this.uz.value(t));
    } else {
      this.up.set(0, 1, 0);
    }

    this.entity.lookAt(this.lookAt, this.up);
  }

  /** Allocate all curves (defaults to spline). */
  private _allocCurves(curveMode = CURVE_SPLINE) {
    // position
    this.px = new Curve();
    this.px.type = curveMode;
    this.py = new Curve();
    this.py.type = curveMode;
    this.pz = new Curve();
    this.pz.type = curveMode;

    // forward (Z) direction
    this.fx = new Curve();
    this.fx.type = curveMode;
    this.fy = new Curve();
    this.fy.type = curveMode;
    this.fz = new Curve();
    this.fz.type = curveMode;

    // optional up
    this.ux = new Curve();
    this.ux.type = curveMode;
    this.uy = new Curve();
    this.uy.type = curveMode;
    this.uz = new Curve();
    this.uz.type = curveMode;

    // optional explicit target (kept for compatibility)
    this.tx = new Curve();
    this.tx.type = curveMode;
    this.ty = new Curve();
    this.ty.type = curveMode;
    this.tz = new Curve();
    this.tz.type = curveMode;
  }

  createPath(): void {
    this._allocCurves(CURVE_SPLINE);

    // If you want a test path, you can still populate here.
    // Otherwise, call setPathFromGhData(...) after construction.
  }

  setTime(time: number): void {
    this.time = time;
    this.update();
  }

  getCurvePointFromTime(time: number, out?: Vec3): Vec3 {
    const t = math.clamp(time, 0, 1);
    const v = out ?? new Vec3();
    return v.set(this.px.value(t), this.py.value(t), this.pz.value(t));
  }

  getUpFromTime(time: number, out?: Vec3): Vec3 {
    const t = math.clamp(time, 0, 1);
    const v = out ?? new Vec3();
    if (!this.ux || !this.uy || !this.uz) return v.set(0, 1, 0);
    return v.set(this.ux.value(t), this.uy.value(t), this.uz.value(t));
  }

  /**
   * Target computed procedurally from forward direction curves.
   * If _fixedLookDist is set, it is used; otherwise we estimate from local arc length.
   */
  getTargetFromTime(time: number, out?: Vec3): Vec3 {
    const t = math.clamp(time, 0, 1);
    const v = out ?? new Vec3();

    // pos(t)
    const px = this.px.value(t), py = this.py.value(t), pz = this.pz.value(t);

    // dir(t) — normalize (fallback to +Z if degenerate)
    this._tmpDir.set(this.fx.value(t), this.fy.value(t), this.fz.value(t));
    if (this._tmpDir.lengthSq() < 1e-12) this._tmpDir.set(0, 0, 1);
    else this._tmpDir.normalize();

    // lookDist(t): fixed or derived from local segment length
    let lookDist = this._fixedLookDist;
    if (lookDist == null) {
      // Use a tiny epsilon based on key count if possible; otherwise a small constant
      const keys = (this.px as any).keys as number[] | undefined;
      const eps = keys && keys.length > 1 ? 1 / (keys.length - 1) : 1 / 100;
      const t2 = math.clamp(t + eps, 0, 1);
      const nx = this.px.value(t2),
        ny = this.py.value(t2),
        nz = this.pz.value(t2);
      lookDist = Math.max(0.001, Math.hypot(nx - px, ny - py, nz - pz));
    }

    v.set(
      px + this._tmpDir.x * lookDist,
      py + this._tmpDir.y * lookDist,
      pz + this._tmpDir.z * lookDist,
    );
    return v;
  }

  /** Convenience: position + target (+ up) in one call */
  getPoseFromTime(time: number) {
    const position = this.getCurvePointFromTime(time);
    const target = this.getTargetFromTime(time);
    const up = this.getUpFromTime(time);
    return { position, target, up };
  }

  /**
   * Set curves directly from RC/Gh-like data.
   * Each record supports:
   *  - O: {x,y,z}            // camera/world position (required)
   *  - Target?: {x,y,z}      // optional explicit target (kept for compat)
   *  - Z?: {x,y,z}           // forward direction (preferred)
   *
   * Axis remap applied to BOTH position and direction:
   *   map: { x:-x, y:z, z:y }
   */
  setPathFromGhData(
    records: Array<{ O: any; Target?: any; Z?: any }>,
    curveType = CURVE_SPLINE,
    fixedLookDist?: number,
  ): void {
    if (!records || records.length < 2) {
      console.warn("setPathFromGhData: need at least 2 records");
      return;
    }

    this._allocCurves(curveType);
    this._fixedLookDist = fixedLookDist;

    const n = records.length;

    const v = (x: any) =>
      x && typeof x === "object"
        ? ("x" in x && "y" in x && "z" in x
          ? { x: +x.x, y: +x.y, z: +x.z }
          : Array.isArray(x) && x.length >= 3
          ? { x: +x[0], y: +x[1], z: +x[2] }
          : null)
        : null;

    const mapPos = (p: V3) => ({ x: -p.x, y: p.z, z: p.y });
    const mapDir = (d: V3) => ({ x: -d.x, y: d.z, z: d.y });

    // Pre-map positions (used for fallback direction and arc-length estimates)
    const P: V3[] = records.map((r) => {
      const O = v(r.O);
      return O ? mapPos(O) : { x: 0, y: 0, z: 0 };
    });

    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);

      // --- position keys ---
      const Oraw = v(records[i].O);
      if (!Oraw) continue;
      const O = mapPos(Oraw);
      this.px.add(t, O.x);
      this.py.add(t, O.y);
      this.pz.add(t, O.z);

      // --- forward/Z direction keys ---
      const Zraw = v(records[i].Z);
      if (Zraw) {
        const D = mapDir(Zraw);
        this.fx.add(t, D.x);
        this.fy.add(t, D.y);
        this.fz.add(t, D.z);
      } else {
        // fallback: approximate forward from neighbor delta
        const j = Math.max(0, Math.min(n - 1, i < n - 1 ? i + 1 : i - 1));
        const N = P[j];
        this.fx.add(t, N.x - O.x);
        this.fy.add(t, N.y - O.y);
        this.fz.add(t, N.z - O.z);
      }

      // --- optional explicit target (kept for compatibility only) ---
      const Traw = v(records[i].Target);
      if (Traw) {
        const Tm = mapPos(Traw);
        this.tx.add(t, Tm.x);
        this.ty.add(t, Tm.y);
        this.tz.add(t, Tm.z);
      } else {
        // add something to keep arrays consistent (won’t be used by default)
        this.tx.add(t, O.x);
        this.ty.add(t, O.y);
        this.tz.add(t, O.z);
      }

      // --- up vector (optional; default 0,1,0) ---
      this.ux.add(t, 0);
      this.uy.add(t, 1);
      this.uz.add(t, 0);
    }
  }

  destroy(): void {
    if (this.div && this.div.parentNode) {
      this.div.parentNode.removeChild(this.div);
    }
  }
}

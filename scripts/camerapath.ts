import { Curve, CURVE_SPLINE, Entity, math, Script, Vec3 } from "playcanvas";

type V3 = { x: number; y: number; z: number };

type CurveSet = {
  px: Curve;
  py: Curve;
  pz: Curve; // position
  fx: Curve;
  fy: Curve;
  fz: Curve; // forward/Z (for target)
  ux: Curve;
  uy: Curve;
  uz: Curve; // up (optional; default 0,1,0)
  tx: Curve;
  ty: Curve;
  tz: Curve; // explicit target (compat only)
  keyCount: number; // cached for epsilon
};

export class CameraPath extends Script {
  // timeline
  time: number = 0;

  // active chunk to drive this.entity (optional)
  currentChunkIndex: number = 0;

  // all curve-sets (one per chunk)
  private chunks: CurveSet[] = [];

  // cache
  // @ts-ignore
  private lookAt!: Vec3;
  // @ts-ignore
  private up!: Vec3;
  private _tmpDir = new Vec3();

  // config
  duration: number = 10;
  startTime: number = 0;
  private _fixedLookDist?: number;

  // optional attributes you had before
  pathRoot?: Entity;

  initialize(): void {
    this.time = math.clamp(this.startTime, 0, this.duration);
    this.lookAt = new Vec3();
    this.up = new Vec3(0, 1, 0);
  }

  /** Drive the attached camera using currentChunkIndex + time */
  update(): void {
    if (!this.chunks.length) return;

    const t = math.clamp(this.time, 0, 1);
    const i = math.clamp(this.currentChunkIndex, 0, this.chunks.length - 1);

    const pos = this.getCurvePoint(i, t);
    const tgt = this.getTarget(i, t, this._fixedLookDist);
    const up = this.getUp(i, t);

    this.entity.setPosition(pos);
    this.entity.lookAt(tgt, up);
  }

  /** Load a single flat array (back-compat) as one chunk */
  setPathFromGhData(
    records: Array<{ O: any; Target?: any; Z?: any }>,
    curveType = CURVE_SPLINE,
    fixedLookDist?: number,
  ): void {
    this.setPathFromGhChunks([records], curveType, fixedLookDist);
  }

  /** Load many chunks: ghChunks = [ [ {O,Z,...}, ... ], [ ... ], ... ] */
  setPathFromGhChunks(
    ghChunks: Array<Array<{ O: any; Target?: any; Z?: any }>>,
    curveType = CURVE_SPLINE,
    fixedLookDist?: number,
  ): void {
    this._fixedLookDist = fixedLookDist;
    this.chunks = [];

    for (const records of ghChunks) {
      const set = this._buildCurveSet(records, curveType);
      if (set) this.chunks.push(set);
    }
  }

  /** Change which chunk drives update()/the entity */
  setActiveChunk(index: number) {
    this.currentChunkIndex = math.clamp(
      index | 0,
      0,
      Math.max(0, this.chunks.length - 1),
    );
  }

  /** Helper: build one curve set from a record list */
  private _buildCurveSet(
    records: Array<{ O: any; Target?: any; Z?: any }>,
    curveType = CURVE_SPLINE,
  ): CurveSet | null {
    if (!records || records.length < 2) {
      console.warn("CameraPath: need at least 2 records per chunk");
      return null;
    }

    const mk = () => {
      const c = new Curve();
      c.type = curveType;
      return c;
    };
    const set: CurveSet = {
      px: mk(),
      py: mk(),
      pz: mk(),
      fx: mk(),
      fy: mk(),
      fz: mk(),
      ux: mk(),
      uy: mk(),
      uz: mk(),
      tx: mk(),
      ty: mk(),
      tz: mk(),
      keyCount: records.length,
    };

    const v = (x: any) =>
      x && typeof x === "object"
        ? ("x" in x && "y" in x && "z" in x
          ? { x: +x.x, y: +x.y, z: +x.z }
          : Array.isArray(x) && x.length >= 3
          ? { x: +x[0], y: +x[1], z: +x[2] }
          : null)
        : null;

    // your axis remap
    const mapPos = (p: V3) => ({ x: -p.x, y: p.z, z: p.y });
    const mapDir = (d: V3) => ({ x: -d.x, y: d.z, z: d.y });

    // pre-mapped positions for fallback dir
    const P: V3[] = records.map((r) => {
      const O = v(r.O);
      return O ? mapPos(O) : { x: 0, y: 0, z: 0 };
    });

    const n = records.length;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);

      const Oraw = v(records[i].O);
      if (!Oraw) continue;
      const O = mapPos(Oraw);
      set.px.add(t, O.x);
      set.py.add(t, O.y);
      set.pz.add(t, O.z);

      const Zraw = v(records[i].Z);
      if (Zraw) {
        const D = mapDir(Zraw);
        set.fx.add(t, D.x);
        set.fy.add(t, D.y);
        set.fz.add(t, D.z);
      } else {
        const j = Math.max(0, Math.min(n - 1, i < n - 1 ? i + 1 : i - 1));
        const N = P[j];
        set.fx.add(t, N.x - O.x);
        set.fy.add(t, N.y - O.y);
        set.fz.add(t, N.z - O.z);
      }

      const Traw = v(records[i].Target);
      if (Traw) {
        const Tm = mapPos(Traw);
        set.tx.add(t, Tm.x);
        set.ty.add(t, Tm.y);
        set.tz.add(t, Tm.z);
      } else {
        set.tx.add(t, O.x);
        set.ty.add(t, O.y);
        set.tz.add(t, O.z);
      }

      // default up
      set.ux.add(t, 0);
      set.uy.add(t, 1);
      set.uz.add(t, 0);
    }

    return set;
  }

  // ---------- Sampling by (chunkIndex, time) ----------

  getCurvePoint(index: number, time: number, out?: Vec3): Vec3 {
    const s = this._set(index);
    const t = math.clamp(time, 0, 1);
    const v = out ?? new Vec3();
    return v.set(s.px.value(t), s.py.value(t), s.pz.value(t));
  }

  getUp(index: number, time: number, out?: Vec3): Vec3 {
    const s = this._set(index);
    const t = math.clamp(time, 0, 1);
    const v = out ?? new Vec3();
    // if you later make up optional, keep default 0,1,0 here
    return v.set(s.ux.value(t), s.uy.value(t), s.uz.value(t));
  }

  /**
   * Target computed from forward (Z) curves.
   * If fixedLookDist provided (arg or ctor-level), it’s used; else we
   * estimate from local arc length.
   */
  getTarget(
    index: number,
    time: number,
    fixedLookDist?: number,
    out?: Vec3,
  ): Vec3 {
    const s = this._set(index);
    const t = math.clamp(time, 0, 1);
    const v = out ?? new Vec3();

    const px = s.px.value(t), py = s.py.value(t), pz = s.pz.value(t);

    this._tmpDir.set(s.fx.value(t), s.fy.value(t), s.fz.value(t));
    if (this._tmpDir.lengthSq() < 1e-12) this._tmpDir.set(0, 0, 1);
    else this._tmpDir.normalize();

    let lookDist = fixedLookDist ?? this._fixedLookDist;
    if (lookDist == null) {
      const eps = s.keyCount > 1 ? 1 / (s.keyCount - 1) : 1 / 100;
      const t2 = math.clamp(t + eps, 0, 1);
      const nx = s.px.value(t2), ny = s.py.value(t2), nz = s.pz.value(t2);
      lookDist = Math.max(0.001, Math.hypot(nx - px, ny - py, nz - pz));
    }

    v.set(
      px + this._tmpDir.x * lookDist,
      py + this._tmpDir.y * lookDist,
      pz + this._tmpDir.z * lookDist,
    );
    return v;
  }

  /** One-shot convenience */
  getPose(index: number, time: number) {
    const position = this.getCurvePoint(index, time);
    const target = this.getTarget(index, time, 1);
    // const up = this.getUp(index, time);
    return {
      position,
      target,
      // up
    };
  }

  // ---------- tiny helpers ----------

  private _set(index: number): CurveSet {
    if (!this.chunks.length) throw new Error("CameraPath: no chunks loaded");
    const i = math.clamp(index | 0, 0, this.chunks.length - 1);
    return this.chunks[i];
  }
}

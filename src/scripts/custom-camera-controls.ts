import { Mat4, math, Plane, Quat, Ray, Script, Vec2, Vec3 } from "playcanvas";
import type { AppBase, CameraComponent } from "playcanvas";

// -----------------------------------------------------------------------------
// Utility constants / helpers
// -----------------------------------------------------------------------------

const tmpVa = new Vec2();
const tmpV1 = new Vec3();
const tmpV2 = new Vec3();
const tmpM1 = new Mat4();
const tmpQ1 = new Quat();
const tmpR1 = new Ray();
const tmpP1 = new Plane();

const PASSIVE: AddEventListenerOptions = { passive: false };
const ZOOM_SCALE_SCENE_MULT = 10;
const MOVEMENT_THRESHOLD = 0.001; // Adjust this value as needed for sensitivity

/**
 * Quad ease in-out function
 */
const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

/**
 * Calculate the lerp rate with quad easing.
 *
 * @param damping - The damping.
 * @param dt - The delta time (in seconds).
 * @returns The lerp rate with quad easing applied.
 */
const lerpRate = (damping: number, dt: number): number => {
  const baseRate = 1 - Math.pow(damping, dt * 450);
  return easeInOutQuad(baseRate);
};

// -----------------------------------------------------------------------------
// CameraControls
// -----------------------------------------------------------------------------

/**
 * Camera control script supporting orbit / pan / fly modes with smooth damping
 * and clamp hooks. Converted from JavaScript to TypeScript, keeping behaviour
 * unchanged.
 */
class CameraControls extends Script {
  // ---------------------------------------------------------------------------
  // Static events
  // ---------------------------------------------------------------------------

  /** Fired to clamp the position (Vec3). */
  public static readonly EVENT_CLAMP_POSITION = "clamp:position";

  /** Fired to clamp the angles (Vec2). */
  public static readonly EVENT_CLAMP_ANGLES = "clamp:angles";

  /** Fired when the camera moves or rotates. */
  public static readonly EVENT_CAMERA_MOVE = "camera:move";

  // ---------------------------------------------------------------------------
  // Private fields
  // ---------------------------------------------------------------------------

  private _camera: CameraComponent | null = null;

  private _origin: Vec3 = new Vec3();
  private _position: Vec3 = new Vec3();
  private _dir: Vec2 = new Vec2();
  private _angles: Vec3 = new Vec3();

  private _pitchRange: Vec2 = new Vec2(-360, 360);

  private _zoomMin = 0;
  private _zoomMax = 0;
  private _zoomDist = 0;
  private _cameraDist = 0;

  private _pointerEvents: Map<number, PointerEvent> = new Map();
  private _lastPinchDist = -1;
  private _lastPosition: Vec2 = new Vec2();

  private _orbiting = false;
  private _panning = false;
  private _flying = false;
  private _moving = false;

  private _key: Record<string, boolean> = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    crouch: false,
  };

  private _element: HTMLElement = (this.app as AppBase).graphicsDevice
    .canvas as HTMLElement;

  private _cameraTransform: Mat4 = new Mat4();
  private _baseTransform: Mat4 = new Mat4();

  private _focusing = false;

  // We need a stable reference for removeEventListener.
  private readonly _onWindowResize = () => this._checkAspectRatio();

  // ---------------------------------------------------------------------------
  // Public (inspector‑editable) fields – default values provided.
  // ---------------------------------------------------------------------------

  /** The scene size – pan / zoom / fly speeds are relative to this. */
  public sceneSize = 100;

  /** Enable orbit camera controls. */
  public enableOrbit = true;
  /** Enable pan camera controls. */
  public enablePan = true;
  /** Enable fly camera controls. */
  public enableFly = true;

  /** Rotation speed (°/px). */
  public rotateSpeed = 0.2;
  /** Rotation damping (0 = none, →1 = slow). */
  public rotateDamping = 0.97;

  /** Fly move speed (× sceneSize). */
  public moveSpeed = 2;
  /** Fast fly speed (with sprint key). */
  public moveFastSpeed = 4;
  /** Slow fly speed (with crouch key). */
  public moveSlowSpeed = 1;
  /** Movement damping. */
  public moveDamping = 0.98;

  /** Zoom speed (relative to scene size). */
  public zoomSpeed = 0.005;
  /** Touch‑pinch zoom sensitivity. */
  public zoomPinchSens = 5;
  /** Zoom damping. */
  public zoomDamping = 0.98;

  /** Minimum zoom scale (normalised 0‑1). */
  public zoomScaleMin = 0;

  /** Focus transition damping. */
  public focusDamping = 0.97;

  /** Initial look-at target (x, y, z) */
  public initialTarget = new Vec3(0, 0, 0);

  /** Whether to apply initial focus on startup */
  public applyInitialFocus = true;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  public initialize(): void {
    console.log("initialize");
    // Bind handlers once.
    this._onWheel = this._onWheel.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onContextMenu = this._onContextMenu.bind(this);

    window.addEventListener("resize", this._onWindowResize, false);

    if (!this.entity.camera) {
      throw new Error("CameraControls script requires a camera component");
    }
    this.attach(this.entity.camera);

    // Apply any pre‑set values now that the camera exists.
    this.focusPoint = this._origin ?? this.focusPoint;
    this.pitchRange = this._pitchRange ?? this.pitchRange;
    this.zoomMin = this._zoomMin ?? this.zoomMin;
    this.zoomMax = this._zoomMax ?? this.zoomMax;

    if (this.applyInitialFocus) {
      const currentPosition = this.entity.getPosition();
      this.focus(this.initialTarget, currentPosition, false);
    }
  }

  public update(dt: number): void {
    if ((this.app as any).xr?.active) return;
    if (!this._camera) return;

    this._move(dt);

    if (!this._flying) {
      this._smoothZoom(dt);
    }
    this._smoothTransform(dt);
    this._updateTransform();
  }

  public destroy(): void {
    window.removeEventListener("resize", this._onWindowResize, false);
    this.detach();
  }

  // ---------------------------------------------------------------------------
  // Property accessors (focus point, pitch range, zoom min / max, etc.)
  // ---------------------------------------------------------------------------

  public set element(value: HTMLElement) {
    this._element = value;

    const camera = this._camera;
    this.detach();
    this.attach(camera!);
  }
  public get element(): HTMLElement {
    return this._element;
  }

  // Focus point --------------------------------------------------------------
  public set focusPoint(point: Vec3) {
    if (!this._camera) {
      if (point instanceof Vec3) {
        this._origin.copy(point);
      }
      return;
    }
    this.focus(point, this.entity.getPosition(), false);
  }
  public get focusPoint(): Vec3 {
    return this._origin;
  }

  // Pitch range --------------------------------------------------------------
  public set pitchRange(value: Vec2) {
    if (!(value instanceof Vec2)) return;
    this._pitchRange.copy(value);
    this._clampAngles(this._dir);
    this._smoothTransform(-1);
  }
  public get pitchRange(): Vec2 {
    return this._pitchRange;
  }

  // Zoom min / max -----------------------------------------------------------
  public set zoomMin(value: number) {
    this._zoomMin = value ?? this._zoomMin;
    this._zoomDist = this._clampZoom(this._zoomDist);
    this._smoothZoom(-1);
  }
  public get zoomMin(): number {
    return this._zoomMin;
  }

  public set zoomMax(value: number) {
    this._zoomMax = value ?? this._zoomMax;
    this._zoomDist = this._clampZoom(this._zoomDist);
    this._smoothZoom(-1);
  }
  public get zoomMax(): number {
    return this._zoomMax;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private _focusDir(out: Vec3): Vec3 {
    return out.copy(this.entity.forward).mulScalar(this._zoomDist);
  }

  private _clampAngles(angles: Vec2): void {
    const min = this._pitchRange.x === -360 ? -Infinity : this._pitchRange.x;
    const max = this._pitchRange.y === 360 ? Infinity : this._pitchRange.y;
    angles.x = math.clamp(angles.x, min, max);
    this.fire(CameraControls.EVENT_CLAMP_ANGLES, angles);
  }

  private _clampPosition(position: Vec3): void {
    if (this._flying) {
      tmpV1.set(0, 0, 0);
    } else {
      this._focusDir(tmpV1);
    }
    position.sub(tmpV1);
    this.fire(CameraControls.EVENT_CLAMP_POSITION, position);
    position.add(tmpV1);
  }

  private _clampZoom(value: number): number {
    const min = (this._camera?.nearClip ?? 0) + this.zoomMin * this.sceneSize;
    const max = this.zoomMax <= this.zoomMin
      ? Infinity
      : this.zoomMax * this.sceneSize;
    return math.clamp(value, min, max);
  }

  // ---------------------------------------------------------------------------
  // Event handlers (context menu, pointer, wheel, keyboard)
  // ---------------------------------------------------------------------------

  private _onContextMenu(event: MouseEvent): void {
    event.preventDefault();
  }

  private _isStartMousePan(event: PointerEvent): boolean {
    if (!this.enablePan) return false;
    if (event.shiftKey) return true;

    if (!this.enableOrbit && !this.enableFly) {
      return event.button === 0 || event.button === 1 || event.button === 2;
    }
    if (!this.enableOrbit || !this.enableFly) {
      return event.button === 1 || event.button === 2;
    }
    return event.button === 1;
  }

  private _isStartFly(event: PointerEvent): boolean {
    if (!this.enableFly) return false;

    if (!this.enableOrbit && !this.enablePan) {
      return event.button === 0 || event.button === 1 || event.button === 2;
    }
    if (!this.enableOrbit) {
      return event.button === 0;
    }
    return event.button === 2;
  }

  private _isStartOrbit(event: PointerEvent): boolean {
    if (!this.enableOrbit) return false;

    if (!this.enableFly && !this.enablePan) {
      return event.button === 0 || event.button === 1 || event.button === 2;
    }
    return event.button === 0;
  }

  private _onPointerDown(event: PointerEvent): void {
    if (!this._camera) return;

    this._element.setPointerCapture(event.pointerId);
    this._pointerEvents.set(event.pointerId, event);

    this._focusing = false; // reset focusing on user input

    const startTouchPan = this.enablePan && this._pointerEvents.size === 2;
    const startMousePan = this._isStartMousePan(event);
    const startFly = this._isStartFly(event);
    const startOrbit = this._isStartOrbit(event);

    if (startTouchPan) {
      // two‑finger pan
      this._lastPinchDist = this._getPinchDist();
      this._getMidPoint(this._lastPosition);
      this._panning = true;
    }
    if (startMousePan) {
      this._lastPosition.set(event.clientX, event.clientY);
      this._panning = true;
    }
    if (startFly) {
      this._zoomDist = this._cameraDist;
      this._origin.copy(this.entity.getPosition());
      this._position.copy(this._origin);
      this._cameraTransform.setTranslate(0, 0, 0);
      this._flying = true;
    }
    if (startOrbit) {
      this._orbiting = true;
    }
  }

  private _onPointerMove(event: PointerEvent): void {
    if (this._pointerEvents.size === 0) return;

    this._pointerEvents.set(event.pointerId, event);

    if (this._pointerEvents.size === 1) {
      if (this._panning) {
        this._pan(tmpVa.set(event.clientX, event.clientY));
      } else if (this._orbiting || this._flying) {
        this._look(event);
      }
      return;
    }

    // Touch gestures (two pointers)
    if (this._pointerEvents.size === 2) {
      if (this._panning) {
        this._pan(this._getMidPoint(tmpVa));
      }

      // pinch zoom
      const pinchDist = this._getPinchDist();
      if (this._lastPinchDist > 0) {
        this._zoom((this._lastPinchDist - pinchDist) * this.zoomPinchSens);
      }
      this._lastPinchDist = pinchDist;
    }
  }

  private _onPointerUp(event: PointerEvent): void {
    this._element.releasePointerCapture(event.pointerId);
    this._pointerEvents.delete(event.pointerId);

    if (this._pointerEvents.size < 2) {
      this._lastPinchDist = -1;
      this._panning = false;
    }
    if (this._orbiting) this._orbiting = false;
    if (this._panning) this._panning = false;
    if (this._flying) {
      this._focusDir(tmpV1);
      this._origin.add(tmpV1);
      this._position.add(tmpV1);
      this._flying = false;
    }
  }

  private _onWheel(event: WheelEvent): void {
    this._focusing = false;
    event.preventDefault();
    this._zoom(event.deltaY);
  }

  private _onKeyDown(event: KeyboardEvent): void {
    this._focusing = false;
    event.stopPropagation();
    switch (event.key.toLowerCase()) {
      case "w":
      case "arrowup":
        this._key.forward = true;
        break;
      case "s":
      case "arrowdown":
        this._key.backward = true;
        break;
      case "a":
      case "arrowleft":
        this._key.left = true;
        break;
      case "d":
      case "arrowright":
        this._key.right = true;
        break;
      case "q":
        this._key.up = true;
        break;
      case "e":
        this._key.down = true;
        break;
      case "shift":
        this._key.sprint = true;
        break;
      case "control":
        this._key.crouch = true;
        break;
    }
  }

  private _onKeyUp(event: KeyboardEvent): void {
    event.stopPropagation();
    switch (event.key.toLowerCase()) {
      case "w":
      case "arrowup":
        this._key.forward = false;
        break;
      case "s":
      case "arrowdown":
        this._key.backward = false;
        break;
      case "a":
      case "arrowleft":
        this._key.left = false;
        break;
      case "d":
      case "arrowright":
        this._key.right = false;
        break;
      case "q":
        this._key.up = false;
        break;
      case "e":
        this._key.down = false;
        break;
      case "shift":
        this._key.sprint = false;
        break;
      case "control":
        this._key.crouch = false;
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Core behaviour – look / move / pan / zoom / smoothing
  // ---------------------------------------------------------------------------

  private _look(event: PointerEvent): void {
    if (event.target !== (this.app as AppBase).graphicsDevice.canvas) return;
    const movementX = (event as any).movementX || 0;
    const movementY = (event as any).movementY || 0;
    this._dir.x -= movementY * this.rotateSpeed;
    this._dir.y -= movementX * this.rotateSpeed;
    this._clampAngles(this._dir);
  }

  private _move(dt: number): void {
    if (!this.enableFly) return;

    tmpV1.set(0, 0, 0);
    if (this._key.forward) tmpV1.add(this.entity.forward);
    if (this._key.backward) tmpV1.sub(this.entity.forward);
    if (this._key.left) tmpV1.sub(this.entity.right);
    if (this._key.right) tmpV1.add(this.entity.right);
    if (this._key.up) tmpV1.add(this.entity.up);
    if (this._key.down) tmpV1.sub(this.entity.up);

    tmpV1.normalize();
    this._moving = tmpV1.length() > 0;
    const speed = this._key.crouch
      ? this.moveSlowSpeed
      : this._key.sprint
      ? this.moveFastSpeed
      : this.moveSpeed;
    tmpV1.mulScalar(this.sceneSize * speed * dt);
    this._origin.add(tmpV1);

    if (this._moving) {
      console.log("moving");
      (this.app as any).renderNextFrame = true;
      this._clampPosition(this._origin);
    }
  }

  private _getMidPoint(out: Vec2): Vec2 {
    const events = Array.from(this._pointerEvents.values());
    const a = events[0];
    const b = events[1];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return out.set(b.clientX + dx * 0.5, b.clientY + dy * 0.5);
  }

  private _getPinchDist(): number {
    const events = Array.from(this._pointerEvents.values());
    const a = events[0];
    const b = events[1];
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private _screenToWorldPan(pos: Vec2, point: Vec3): void {
    if (!this._camera) return;

    const mouseW = this._camera.screenToWorld(pos.x, pos.y, 1);
    const cameraPos = this.entity.getPosition();

    const focusDir = this._focusDir(tmpV1);
    const focalPos = tmpV2.add2(cameraPos, focusDir);
    const planeNormal = focusDir.mulScalar(-1).normalize();

    const plane = tmpP1.setFromPointNormal(focalPos, planeNormal);
    const ray = tmpR1.set(cameraPos, mouseW.sub(cameraPos).normalize());

    plane.intersectsRay(ray, point);
  }

  private _pan(pos: Vec2): void {
    if (!this.enablePan) return;

    const start = new Vec3();
    const end = new Vec3();

    this._screenToWorldPan(this._lastPosition, start);
    this._screenToWorldPan(pos, end);

    tmpV1.sub2(start, end);
    this._origin.add(tmpV1);

    this._lastPosition.copy(pos);
  }

  private _zoom(delta: number): void {
    if (!this.enableOrbit && !this.enablePan) return;
    if (this._flying) return;
    if (!this._camera) return;

    const distNormalized = this._zoomDist /
      (ZOOM_SCALE_SCENE_MULT * this.sceneSize);
    const scale = math.clamp(distNormalized, this.zoomScaleMin, 1);
    this._zoomDist += delta * this.zoomSpeed * this.sceneSize * scale;
    this._zoomDist = this._clampZoom(this._zoomDist);
  }

  private _smoothZoom(dt: number): void {
    const a = dt === -1
      ? 1
      : lerpRate(this._focusing ? this.focusDamping : this.zoomDamping, dt);

    this._cameraDist = math.lerp(this._cameraDist, this._zoomDist, a);
    this._cameraTransform.setTranslate(0, 0, this._cameraDist);
  }

  private _smoothTransform(dt: number): void {
    const ar = dt === -1
      ? 1
      : lerpRate(this._focusing ? this.focusDamping : this.rotateDamping, dt);
    const am = dt === -1
      ? 1
      : lerpRate(this._focusing ? this.focusDamping : this.moveDamping, dt);

    this._angles.x = math.lerp(this._angles.x, this._dir.x, ar);
    this._angles.y = math.lerp(this._angles.y, this._dir.y, ar);
    this._position.lerp(this._position, this._origin, am);
    this._baseTransform.setTRS(
      this._position,
      tmpQ1.setFromEulerAngles(this._angles),
      Vec3.ONE,
    );
  }

  private _updateTransform(): void {
    tmpM1.copy(this._baseTransform).mul(this._cameraTransform);
    const newPosition = tmpM1.getTranslation();
    const newRotation = tmpM1.getEulerAngles();
    const currentPosition = this.entity.getPosition();
    // const currentRotation = this.entity.getRotation();

    const hasSignificantMove =
      Math.abs(newPosition.x - currentPosition.x) > MOVEMENT_THRESHOLD ||
      Math.abs(newPosition.y - currentPosition.y) > MOVEMENT_THRESHOLD ||
      Math.abs(newPosition.z - currentPosition.z) > MOVEMENT_THRESHOLD;
    // Math.abs(newRotation.x - currentRotation.x) > MOVEMENT_THRESHOLD ||
    // Math.abs(newRotation.y - currentRotation.y) > MOVEMENT_THRESHOLD ||
    // Math.abs(newRotation.z - currentRotation.z) > MOVEMENT_THRESHOLD;

    if (hasSignificantMove) {
      this.app.renderNextFrame = true;
      this.entity.setPosition(newPosition);
      this.entity.setEulerAngles(newRotation);
      this.fire(CameraControls.EVENT_CAMERA_MOVE, newPosition, newRotation);
    }
  }

  // ---------------------------------------------------------------------------
  // API – focus / resetZoom / refocus
  // ---------------------------------------------------------------------------

  public focus(point: Vec3, start?: Vec3 | null, smooth = true): void {
    if (!this._camera) return;
    if (this._flying) return;

    if (!start) {
      this._origin.copy(point);
      if (!smooth) this._position.copy(point);
      return;
    }

    this._focusing = smooth;

    tmpV1.sub2(start, point);
    const elev =
      Math.atan2(tmpV1.y, Math.sqrt(tmpV1.x * tmpV1.x + tmpV1.z * tmpV1.z)) *
      math.RAD_TO_DEG;
    const azim = Math.atan2(tmpV1.x, tmpV1.z) * math.RAD_TO_DEG;
    this._clampAngles(this._dir.set(-elev, azim));

    this._origin.copy(point);

    this._cameraTransform.setTranslate(0, 0, 0);

    const pos = this.entity.getPosition();
    const rot = this.entity.getRotation();
    this._baseTransform.setTRS(pos, rot, Vec3.ONE);

    this._zoomDist = this._clampZoom(tmpV1.length());

    if (!smooth) {
      this._smoothZoom(-1);
      this._smoothTransform(-1);
    }

    this._updateTransform();
  }

  public resetZoom(zoomDist = 0, smooth = true): void {
    this._zoomDist = zoomDist;
    if (!smooth) this._cameraDist = zoomDist;
  }

  public refocus(
    point: Vec3,
    start: Vec3 | null = null,
    zoomDist?: number,
    smooth = true,
  ): void {
    if (typeof zoomDist === "number") {
      this.resetZoom(zoomDist, smooth);
    }
    this.focus(point, start, smooth);
  }

  // ---------------------------------------------------------------------------
  // Attach / detach camera component and events
  // ---------------------------------------------------------------------------

  public attach(camera: CameraComponent | null): void {
    if (this._camera === camera || !camera) return;
    this._camera = camera;

    // Canvas event listeners
    this._element.addEventListener("wheel", this._onWheel, PASSIVE);
    this._element.addEventListener("pointerdown", this._onPointerDown);
    this._element.addEventListener("pointermove", this._onPointerMove);
    this._element.addEventListener("pointerup", this._onPointerUp);
    this._element.addEventListener("contextmenu", this._onContextMenu);

    // Keyboard events on window (for fly mode)
    // window.addEventListener("keydown", this._onKeyDown, false);
    // window.addEventListener("keyup", this._onKeyUp, false);
  }

  public detach(): void {
    if (!this._camera) return;

    // Remove canvas events
    this._element.removeEventListener("wheel", this._onWheel, PASSIVE);
    this._element.removeEventListener("pointermove", this._onPointerMove);
    this._element.removeEventListener("pointerdown", this._onPointerDown);
    this._element.removeEventListener("pointerup", this._onPointerUp);
    this._element.removeEventListener("contextmenu", this._onContextMenu);

    // Keyboard events
    // window.removeEventListener("keydown", this._onKeyDown, false);
    // window.removeEventListener("keyup", this._onKeyUp, false);

    this._camera = null;

    this._dir.x = this._angles.x;
    this._dir.y = this._angles.y;
    this._origin.copy(this._position);

    this._pointerEvents.clear();
    this._lastPinchDist = -1;
    this._panning = false;
    this._key = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      sprint: false,
      crouch: false,
    };
  }

  // ---------------------------------------------------------------------------
  // Misc helpers
  // ---------------------------------------------------------------------------

  private _checkAspectRatio(): void {
    const { height, width } = (this.app as AppBase).graphicsDevice;
    if (this.entity.camera) {
      this.entity.camera.horizontalFov = height > width;
    }
    (this.app as any).renderNextFrame = true;
  }
}

export default CameraControls;

import {
  Curve,
  CURVE_LINEAR,
  CURVE_SPLINE,
  Entity,
  math,
  Script,
  Vec3,
} from "playcanvas";

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
    this.addUi();

    this.time = math.clamp(this.startTime, 0, this.duration);

    this.lookAt = new Vec3();
    this.up = new Vec3();

    this.flyingThrough = false;
  }

  update(): void {
    let percent;

    percent = parseFloat(this.pathSlider.value) /
      parseFloat(this.pathSlider.max);

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

    // Update UI slider position if flying through automatically
    // if (this.flyingThrough && this.pathSlider) {
    //   console.log("update path slider");
    //   this.pathSlider.value = (percent * 100).toString();
    // }
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
    const centerPos = new Vec3(-0.637896, 8.462717, 0.262912);

    for (let i = 0; i < this.points.length; i++) {
      const pt = this.points[i];
      const t = i / (this.points.length - 1);
      this.px.add(t, pt.x);
      this.py.add(t, pt.y);
      this.pz.add(t, pt.z);
      this.tx.add(t, centerPos.x * Math.random());
      this.ty.add(t, centerPos.y * Math.random());
      this.tz.add(t, centerPos.z * Math.random());
      this.ux.add(t, 0);
      this.uy.add(t, 1);
      this.uz.add(t, 0);
      i++;
    }

    console.log(this.px);
  }

  addUi(): void {
    // Create and add CSS styles
    const style = document.createElement("style");
    document.head.appendChild(style);
    style.innerHTML = `
      .camera-path-container {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        padding: 15px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
        min-width: 300px;
      }
      
      .camera-path-title {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: bold;
      }
      
      .camera-path-controls {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .camera-path-slider-container {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .camera-path-slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: #333;
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }
      
      .camera-path-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
      }
      
      .camera-path-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #fff;
        cursor: pointer;
        border: none;
      }
      
      .camera-path-button {
        background: #007acc;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s;
      }
      
      .camera-path-button:hover {
        background: #005a99;
      }
      
      .camera-path-button:disabled {
        background: #555;
        cursor: not-allowed;
      }
      
      .camera-path-info {
        font-size: 11px;
        color: #ccc;
        margin-top: 5px;
      }
    `;

    // Create main container
    this.div = document.createElement("div");
    this.div.classList.add("camera-path-container");
    document.body.appendChild(this.div);

    // Create title
    const title = document.createElement("h3");
    title.classList.add("camera-path-title");
    title.textContent = "Camera Path Controls";
    this.div.appendChild(title);

    // Create controls container
    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("camera-path-controls");
    this.div.appendChild(controlsContainer);

    // Create slider container
    const sliderContainer = document.createElement("div");
    sliderContainer.classList.add("camera-path-slider-container");
    controlsContainer.appendChild(sliderContainer);

    // Create slider label
    const sliderLabel = document.createElement("label");
    sliderLabel.textContent = "Path Position:";
    sliderLabel.style.fontSize = "12px";
    sliderContainer.appendChild(sliderLabel);

    // Create path slider
    this.pathSlider = document.createElement("input");
    this.pathSlider.type = "range";
    this.pathSlider.min = "0";
    this.pathSlider.max = "100";
    this.pathSlider.value = "0";
    this.pathSlider.classList.add("camera-path-slider");
    sliderContainer.appendChild(this.pathSlider);

    // Create resume button
    this.resumeFlythroughButton = document.createElement("button");
    this.resumeFlythroughButton.classList.add("camera-path-button");
    this.resumeFlythroughButton.textContent = "Resume Auto Flythrough";
    controlsContainer.appendChild(this.resumeFlythroughButton);

    // Create info text
    const infoText = document.createElement("div");
    infoText.classList.add("camera-path-info");
    infoText.textContent =
      `Duration: ${this.duration}s | Use slider to control manually`;
    controlsContainer.appendChild(infoText);

    this.pathSlider.addEventListener("input", () => {
      // this.flyingThrough = false;
      this.time =
        (parseFloat(this.pathSlider.value) / parseFloat(this.pathSlider.max)) *
        this.duration;
    });

    // Update slider position based on current time
    this.pathSlider.addEventListener("mousedown", () => {
      // this.flyingThrough = false;
    });
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

import React, { useState } from "react";
import {
  DISTANCE_SCALING_PRESETS,
  DistanceScaledSplat,
} from "../components/DistanceScaledSplat";
import { DistanceScalingConfig } from "../utils/splatScaling";
import { type Asset } from "playcanvas";

interface DistanceScalingExampleProps {
  splatAsset: Asset;
}

/**
 * Example component showing how to use distance-based splat scaling
 */
export function DistanceScalingExample(
  { splatAsset }: DistanceScalingExampleProps,
) {
  const [activePreset, setActivePreset] = useState<
    keyof typeof DISTANCE_SCALING_PRESETS
  >("linearFade");
  const [customConfig, setCustomConfig] = useState<DistanceScalingConfig>({
    maxDistance: 10.0,
    minScale: 0.1,
    maxScale: 2.0,
    curve: "linear",
    invert: false,
  });

  const handlePresetChange = (
    preset: keyof typeof DISTANCE_SCALING_PRESETS,
  ) => {
    setActivePreset(preset);
    setCustomConfig(DISTANCE_SCALING_PRESETS[preset]);
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Your 3D scene with distance-scaled splats */}
      <DistanceScaledSplat
        asset={splatAsset}
        active={true}
        distanceScaling={customConfig}
        useDistanceScaledShader={true}
        onEntityReady={() => console.log("Distance-scaled splat ready!")}
      />

      {/* UI Controls */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontSize: "12px",
          maxWidth: "300px",
        }}
      >
        <h3>Distance Scaling Controls</h3>

        {/* Preset Selection */}
        <div style={{ marginBottom: "15px" }}>
          <label>Preset:</label>
          <select
            value={activePreset}
            onChange={(e) =>
              handlePresetChange(
                e.target.value as keyof typeof DISTANCE_SCALING_PRESETS,
              )}
            style={{ marginLeft: "10px", padding: "5px" }}
          >
            <option value="closeupEmphasis">Closeup Emphasis</option>
            <option value="atmosphericDepth">Atmospheric Depth</option>
            <option value="linearFade">Linear Fade</option>
            <option value="subtleScale">Subtle Scale</option>
          </select>
        </div>

        {/* Custom Controls */}
        <div style={{ display: "grid", gap: "10px" }}>
          <div>
            <label>Max Distance: {customConfig.maxDistance}</label>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={customConfig.maxDistance || 10}
              onChange={(e) =>
                setCustomConfig({
                  ...customConfig,
                  maxDistance: parseFloat(e.target.value),
                })}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Min Scale: {customConfig.minScale}</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={customConfig.minScale || 0.1}
              onChange={(e) =>
                setCustomConfig({
                  ...customConfig,
                  minScale: parseFloat(e.target.value),
                })}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Max Scale: {customConfig.maxScale}</label>
            <input
              type="range"
              min="1.0"
              max="5.0"
              step="0.1"
              value={customConfig.maxScale || 2.0}
              onChange={(e) =>
                setCustomConfig({
                  ...customConfig,
                  maxScale: parseFloat(e.target.value),
                })}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Curve Type:</label>
            <select
              value={customConfig.curve || "linear"}
              onChange={(e) =>
                setCustomConfig({
                  ...customConfig,
                  curve: e.target.value as any,
                })}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              <option value="linear">Linear</option>
              <option value="exponential">Exponential</option>
              <option value="inverse">Inverse</option>
              <option value="logarithmic">Logarithmic</option>
            </select>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={customConfig.invert || false}
                onChange={(e) =>
                  setCustomConfig({
                    ...customConfig,
                    invert: e.target.checked,
                  })}
                style={{ marginRight: "10px" }}
              />
              Invert Scaling
            </label>
          </div>

          {customConfig.curve === "exponential" && (
            <div>
              <label>Power: {customConfig.power}</label>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={customConfig.power || 2.0}
                onChange={(e) =>
                  setCustomConfig({
                    ...customConfig,
                    power: parseFloat(e.target.value),
                  })}
                style={{ width: "100%" }}
              />
            </div>
          )}
        </div>

        <div style={{ marginTop: "15px", fontSize: "10px", opacity: 0.7 }}>
          Distance scaling modifies splat size based on distance from origin
          (0,0,0). Use different curves and settings to achieve various visual
          effects.
        </div>
      </div>
    </div>
  );
}

/**
 * Simple function-based approach for quick distance scaling
 */
export function quickDistanceScale(
  entity: any, // PlayCanvas Entity
  maxDistance: number = 10.0,
  minScale: number = 0.1,
  maxScale: number = 2.0,
) {
  // Apply basic linear distance scaling
  const meshInstances = entity.render?.meshInstances;
  if (meshInstances) {
    meshInstances.forEach((meshInstance: any) => {
      if (meshInstance.material) {
        meshInstance.material.setParameter("uMaxDistance", maxDistance);
        meshInstance.material.setParameter("uMinScale", minScale);
        meshInstance.material.setParameter("uMaxScale", maxScale);
        meshInstance.material.setParameter("uScalePower", 1.0);
        meshInstance.material.setParameter("uScaleCurve", 0); // Linear
        meshInstance.material.setParameter("uInvertScale", 0); // No invert
      }
    });
  }
}

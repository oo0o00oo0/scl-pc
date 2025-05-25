import { useApp } from "@playcanvas/react/hooks";
import { useCallback, useEffect, useRef } from "react";

/**
 * Hook for capturing screenshots in a PlayCanvas React application
 * @param cameraEntity - The camera entity to use for taking screenshots
 * @returns Object with takeScreenshot function
 */
export const useScreenshot = (cameraEntity: pc.Entity) => {
  const app = useApp();

  const renderTargetRef = useRef<pc.RenderTarget | null>(null);
  const colorTextureRef = useRef<pc.Texture | null>(null);
  const depthTextureRef = useRef<pc.Texture | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const pixelsRef = useRef<Uint8Array | null>(null);
  const lastWidthRef = useRef<number>(0);
  const lastHeightRef = useRef<number>(0);
  const secsSinceSameSizeRef = useRef<number>(0);
  const unScaledTextureWidthRef = useRef<number>(0);
  const unScaledTextureHeightRef = useRef<number>(0);

  // Create a new render texture
  const createNewRenderTexture = useCallback(() => {
    if (!app) return;

    const device = app.graphicsDevice;

    // Clean up old textures
    if (
      colorTextureRef.current && depthTextureRef.current &&
      renderTargetRef.current
    ) {
      const oldRenderTarget = renderTargetRef.current;
      const oldColorTexture = colorTextureRef.current;
      const oldDepthTexture = depthTextureRef.current;

      renderTargetRef.current = null;
      colorTextureRef.current = null;
      depthTextureRef.current = null;

      oldRenderTarget.destroy();
      oldColorTexture.destroy();
      oldDepthTexture.destroy();
    }

    // Create new textures
    const colorBuffer = new pc.Texture(device, {
      width: device.width,
      height: device.height,
      format: pc.PIXELFORMAT_R8_G8_B8_A8,
      autoMipmap: true,
    });

    const depthBuffer = new pc.Texture(device, {
      format: pc.PIXELFORMAT_DEPTHSTENCIL,
      width: device.width,
      height: device.height,
      mipmaps: false,
      addressU: pc.ADDRESS_CLAMP_TO_EDGE,
      addressV: pc.ADDRESS_CLAMP_TO_EDGE,
    });

    colorBuffer.minFilter = pc.FILTER_LINEAR;
    colorBuffer.magFilter = pc.FILTER_LINEAR;

    const renderTarget = new pc.RenderTarget({
      colorBuffer: colorBuffer,
      depthBuffer: depthBuffer,
      samples: 4, // Enable anti-alias
    });

    cameraEntity.camera.renderTarget = renderTarget;

    unScaledTextureWidthRef.current = device.width;
    unScaledTextureHeightRef.current = device.height;

    colorTextureRef.current = colorBuffer;
    depthTextureRef.current = depthBuffer;
    renderTargetRef.current = renderTarget;

    if (!canvasRef.current) {
      // Create a canvas context to render the screenshot to
      canvasRef.current = window.document.createElement("canvas");
      contextRef.current = canvasRef.current.getContext("2d");
    }

    canvasRef.current.width = colorBuffer.width;
    canvasRef.current.height = colorBuffer.height;

    // The render is upside down and back to front so we need to correct it
    if (contextRef.current) {
      contextRef.current.globalCompositeOperation = "copy";
      contextRef.current.setTransform(1, 0, 0, 1, 0, 0);
      contextRef.current.scale(1, -1);
      contextRef.current.translate(0, -canvasRef.current.height);
    }

    pixelsRef.current = new Uint8Array(
      colorBuffer.width * colorBuffer.height * 4,
    );
  }, [app, cameraEntity]);

  // Take a screenshot and download it
  const takeScreenshot = useCallback((filename: string = "screenshot") => {
    if (
      !app || !renderTargetRef.current || !colorTextureRef.current ||
      !depthTextureRef.current ||
      !canvasRef.current || !contextRef.current || !pixelsRef.current
    ) {
      console.error("Screenshot resources not initialized");
      return;
    }

    // Enable camera for screenshot
    cameraEntity.enabled = true;

    const colorBuffer = renderTargetRef.current.colorBuffer;
    const depthBuffer = renderTargetRef.current.depthBuffer;

    // Clear context
    contextRef.current.save();
    contextRef.current.setTransform(1, 0, 0, 1, 0, 0);
    contextRef.current.clearRect(0, 0, colorBuffer.width, colorBuffer.height);
    contextRef.current.restore();

    const gl = app.graphicsDevice.gl;
    const fb = gl.createFramebuffer();
    const pixels = pixelsRef.current;

    // Get texture implementations
    const colorGlTexture = colorBuffer.impl
      ? colorBuffer.impl._glTexture
      : colorBuffer._glTexture;
    const depthGlTexture = depthBuffer.impl
      ? depthBuffer.impl._glTexture
      : depthBuffer._glTexture;

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      colorGlTexture,
      0,
    );
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_STENCIL_ATTACHMENT,
      gl.TEXTURE_2D,
      depthGlTexture,
      0,
    );
    gl.readPixels(
      0,
      0,
      colorBuffer.width,
      colorBuffer.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels,
    );

    gl.deleteFramebuffer(fb);

    // Create image data
    const palette = contextRef.current.getImageData(
      0,
      0,
      colorBuffer.width,
      colorBuffer.height,
    );
    palette.data.set(new Uint8ClampedArray(pixels));

    contextRef.current.putImageData(palette, 0, 0);
    contextRef.current.drawImage(canvasRef.current, 0, 0);

    const b64 = canvasRef.current.toDataURL("image/png").replace(
      "image/png",
      "image/octet-stream",
    );

    // Create and trigger download link
    const link = document.createElement("a");
    link.setAttribute("download", filename + ".png");
    link.setAttribute("href", b64);
    link.click();

    // Disable camera after screenshot
    cameraEntity.enabled = false;
  }, [app, cameraEntity]);

  // Initialize and set up event listeners
  useEffect(() => {
    if (!app || !cameraEntity) return;

    // Initial setup
    createNewRenderTexture();

    // Disable the screenshot camera initially
    cameraEntity.enabled = false;

    // Ensure it gets rendered first
    cameraEntity.camera.priority = -1;

    // Handle window resize
    const handleResize = () => {
      secsSinceSameSizeRef.current = 0;
    };

    app.graphicsDevice.on("resizecanvas", handleResize);

    // Update function (similar to the original update method)
    const updateHandler = (dt: number) => {
      const device = app.graphicsDevice;

      if (
        device.width === lastWidthRef.current &&
        device.height === lastHeightRef.current
      ) {
        secsSinceSameSizeRef.current += dt;
      }

      if (secsSinceSameSizeRef.current > 0.25) {
        if (
          unScaledTextureWidthRef.current !== device.width ||
          unScaledTextureHeightRef.current !== device.height
        ) {
          createNewRenderTexture();
        }
      }

      lastWidthRef.current = device.width;
      lastHeightRef.current = device.height;
    };

    // Register update handler
    app.on("update", updateHandler);

    // Cleanup
    return () => {
      app.graphicsDevice.off("resizecanvas", handleResize);
      app.off("update", updateHandler);

      if (renderTargetRef.current) {
        renderTargetRef.current.destroy();
        renderTargetRef.current = null;
      }

      if (colorTextureRef.current) {
        colorTextureRef.current.destroy();
        colorTextureRef.current = null;
      }

      if (depthTextureRef.current) {
        depthTextureRef.current.destroy();
        depthTextureRef.current = null;
      }

      canvasRef.current = null;
      contextRef.current = null;
    };
  }, [app, cameraEntity, createNewRenderTexture]);

  return { takeScreenshot };
};

// Example component using the hook
const Screenshot = () => {
  // This component doesn't render anything
  return null;
};

export default Screenshot;

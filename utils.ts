export const lerpRate = (damping: number, dt: number): number => {
  const t = 1 - Math.pow(damping, dt * 60);
  // Fast ease-in-out - much more subtle curve
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
};

// Alternative easing functions you can use:
export const easeInOutSine = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2;
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const easeInOutQuart = (t: number): number => {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
};

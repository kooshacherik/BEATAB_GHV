// client/src/utils/EasingFunctions.js
/**
 * A collection of common easing functions.
 * Reference: https://easings.net/
 */
export const Easing = {
  Linear: {
    None: (t) => t,
  },
  Quadratic: {
    In: (t) => t * t,
    Out: (t) => t * (2 - t),
    InOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  },
  Cubic: {
    In: (t) => t * t * t,
    Out: (t) => (--t) * t * t + 1,
    InOut: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  },
  Quartic: {
    In: (t) => t * t * t * t,
    Out: (t) => 1 - (--t) * t * t * t,
    InOut: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t),
  },
  Quintic: {
    In: (t) => t * t * t * t * t,
    Out: (t) => 1 + (--t) * t * t * t * t,
    InOut: (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t),
  },
  Sine: {
    In: (t) => 1 - Math.cos(t * Math.PI / 2),
    Out: (t) => Math.sin(t * Math.PI / 2),
    InOut: (t) => -0.5 * (Math.cos(Math.PI * t) - 1),
  },
  Exponential: {
    In: (t) => (t === 0) ? 0 : Math.pow(2, 10 * (t - 1)),
    Out: (t) => (t === 1) ? 1 : 1 - Math.pow(2, -10 * t),
    InOut: (t) => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      if ((t /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1));
      return 0.5 * (2 - Math.pow(2, -10 * (--t)));
    },
  },
  Circular: {
    In: (t) => -(Math.sqrt(1 - t * t) - 1),
    Out: (t) => Math.sqrt(1 - (--t) * t),
    InOut: (t) => {
      if ((t /= 0.5) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
      return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    },
  },
  Elastic: {
    In: (t) => {
      let s = 1.70158;
      let p = 0;
      let a = 1;
      if (t === 0) return 0;
      if (t === 1) return 1;
      if (!p) p = 0.3;
      if (a < Math.abs(1)) {
        a = 1;
        s = p / 4;
      } else s = p / (2 * Math.PI) * Math.asin(1 / a);
      return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
    },
    Out: (t) => {
      let s = 1.70158;
      let p = 0;
      let a = 1;
      if (t === 0) return 0;
      if (t === 1) return 1;
      if (!p) p = 0.3;
      if (a < Math.abs(1)) {
        a = 1;
        s = p / 4;
      } else s = p / (2 * Math.PI) * Math.asin(1 / a);
      return a * Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    },
    InOut: (t) => {
      let s = 1.70158;
      let p = 0;
      let a = 1;
      if (t === 0) return 0;
      if ((t /= 0.5) === 2) return 1;
      if (!p) p = 0.3 * 1.5;
      if (a < Math.abs(1)) {
        a = 1;
        s = p / 4;
      } else s = p / (2 * Math.PI) * Math.asin(1 / a);
      if (t < 1) return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
      return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p) * 0.5 + 1;
    },
  },
  Back: {
    In: (t) => {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    Out: (t) => {
      const s = 1.70158;
      return (t = t - 1) * t * ((s + 1) * t + s) + 1;
    },
    InOut: (t) => {
      const s = 1.70158;
      if ((t /= 0.5) < 1) return 0.5 * (t * t * (((s *= 1.525) + 1) * t - s));
      return 0.5 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2);
    },
  },
  Bounce: {
    In: (t) => 1 - Easing.Bounce.Out(1 - t),
    Out: (t) => {
      if (t < (1 / 2.75)) {
        return (7.5625 * t * t);
      } else if (t < (2 / 2.75)) {
        return (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
      } else if (t < (2.5 / 2.75)) {
        return (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
      } else {
        return (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
      }
    },
    InOut: (t) => {
      if (t < 0.5) return Easing.Bounce.In(t * 2) * 0.5;
      return Easing.Bounce.Out(t * 2 - 1) * 0.5 + 0.5;
    },
  },
};
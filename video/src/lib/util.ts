import {interpolate, Easing} from 'remotion';

export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Deterministik sözde rastgele (0..1) */
export const rand = (seed: number) => {
	const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
	return x - Math.floor(x);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** frame'i [a,b] aralığında 0..1'e eşler (kenetli) */
export const prog = (f: number, a: number, b: number, ease: (t: number) => number = Easing.inOut(Easing.cubic)) =>
	interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

export const lin = (f: number, a: number, b: number) =>
	interpolate(f, [a, b], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

/** a'da girip b'de çıkan opaklık (fade karesi kadar yumuşak) */
export const window01 = (f: number, a: number, b: number, fade = 12) =>
	Math.min(lin(f, a, a + fade), 1 - lin(f, b - fade, b));

export const mixColor = (c1: string, c2: string, t: number) => {
	const p = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
	const a = p(c1);
	const b = p(c2);
	const r = a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))));
	return `rgb(${r[0]},${r[1]},${r[2]})`;
};

export const sec = (s: number) => Math.round(s * FPS);

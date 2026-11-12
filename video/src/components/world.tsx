import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {H, W, clamp, lerp, mixColor, rand} from '../lib/util';

/* ------------------------------------------------------------------ */
/*  Gökyüzü, yıldızlar, ay, sis                                        */
/* ------------------------------------------------------------------ */

export const Sky: React.FC<{top: string; mid: string; bottom: string}> = ({top, mid, bottom}) => (
	<AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bottom} 100%)`}} />
);

export const Stars: React.FC<{opacity?: number; count?: number; seed?: number; maxY?: number}> = ({
	opacity = 1,
	count = 220,
	seed = 1,
	maxY = 0.7,
}) => {
	const f = useCurrentFrame();
	const stars = useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => ({
				x: rand(seed + i * 3.1) * W,
				y: rand(seed + i * 7.7) * H * maxY,
				r: 0.6 + rand(seed + i * 1.3) * 1.6,
				p: rand(seed + i * 9.9) * 6.28,
			})),
		[count, seed, maxY]
	);
	return (
		<svg width={W} height={H} style={{position: 'absolute', opacity}}>
			{stars.map((s, i) => (
				<circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={0.45 + 0.4 * Math.sin(f / 18 + s.p)} />
			))}
		</svg>
	);
};

export const Moon: React.FC<{x: number; y: number; r?: number; glow?: number}> = ({x, y, r = 60, glow = 1}) => (
	<svg width={W} height={H} style={{position: 'absolute'}}>
		<defs>
			<radialGradient id="moonglow">
				<stop offset="0%" stopColor="#dfe8ff" stopOpacity={0.45 * glow} />
				<stop offset="100%" stopColor="#dfe8ff" stopOpacity={0} />
			</radialGradient>
			<radialGradient id="moonbody" cx="40%" cy="38%">
				<stop offset="0%" stopColor="#fbfbf4" />
				<stop offset="100%" stopColor="#c9ccd6" />
			</radialGradient>
		</defs>
		<circle cx={x} cy={y} r={r * 5} fill="url(#moonglow)" />
		<circle cx={x} cy={y} r={r} fill="url(#moonbody)" />
		<circle cx={x - r * 0.3} cy={y - r * 0.15} r={r * 0.18} fill="#b9bcc8" opacity={0.6} />
		<circle cx={x + r * 0.25} cy={y + r * 0.3} r={r * 0.12} fill="#b9bcc8" opacity={0.5} />
		<circle cx={x + r * 0.35} cy={y - r * 0.35} r={r * 0.08} fill="#b9bcc8" opacity={0.5} />
	</svg>
);

export const Fog: React.FC<{y?: number; h?: number; color?: string; opacity?: number; speed?: number}> = ({
	y = 600,
	h = 300,
	color = '#ffffff',
	opacity = 0.25,
	speed = 0.3,
}) => {
	const f = useCurrentFrame();
	return (
		<div
			style={{
				position: 'absolute',
				left: -200 + Math.sin(f / 200) * 80 * speed,
				top: y,
				width: W + 400,
				height: h,
				background: `radial-gradient(ellipse at 50% 50%, ${color} 0%, transparent 70%)`,
				opacity,
				filter: 'blur(20px)',
			}}
		/>
	);
};

/* ------------------------------------------------------------------ */
/*  Şehir silüeti                                                      */
/* ------------------------------------------------------------------ */

export type SkylineProps = {
	seed: number;
	baseY: number;
	minH: number;
	maxH: number;
	color: string;
	x0?: number;
	width?: number;
	windows?: boolean;
	/** 0 gündüz, 1 gece (pencere rengi) */
	night?: number;
	/** 0..1: pencerelerin ne kadarı söndü */
	lightsOut?: number;
	/** 0..1: kırık pencere, leke, eksik çatı */
	decay?: number;
	/** 0..1: sarmaşık / bitki */
	growth?: number;
	/** 0..1: binaların çöküşü (yükseklik kaybı) */
	collapse?: number;
	gap?: number;
	scaleW?: number;
};

export const Skyline: React.FC<SkylineProps> = ({
	seed,
	baseY,
	minH,
	maxH,
	color,
	x0 = -50,
	width = W + 100,
	windows = true,
	night = 0,
	lightsOut = 0,
	decay = 0,
	growth = 0,
	collapse = 0,
	gap = 6,
	scaleW = 1,
}) => {
	const blds = useMemo(() => {
		const arr: {x: number; w: number; h: number; k: number; roof: number}[] = [];
		let x = x0;
		let i = 0;
		while (x < x0 + width) {
			const w = (70 + rand(seed + i * 2.3) * 120) * scaleW;
			const h = minH + Math.pow(rand(seed + i * 5.1), 1.4) * (maxH - minH);
			arr.push({x, w, h, k: i, roof: Math.floor(rand(seed + i * 8.8) * 4)});
			x += w + gap + rand(seed + i) * 10;
			i++;
		}
		return arr;
	}, [seed, x0, width, minH, maxH, gap, scaleW]);

	const winDay = '#9fb3c4';
	const winNight = '#ffd27a';
	return (
		<svg width={W} height={H} style={{position: 'absolute', left: 0, top: 0}}>
			{blds.map((b) => {
				const cut = collapse * (rand(seed + b.k * 4.4) > 0.45 ? rand(seed + b.k * 6.6) * 0.75 : 0);
				const h = b.h * (1 - cut);
				const y = baseY - h;
				const cols = Math.max(1, Math.floor((b.w - 14) / 16));
				const rows = Math.max(1, Math.floor((h - 24) / 24));
				const ww = (b.w - 14) / cols;
				const out: React.ReactNode[] = [];
				out.push(<rect key="b" x={b.x} y={y} width={b.w} height={h + 400} fill={color} />);
				if (cut > 0.05) {
					// kırık üst kenar
					const pts = new Array(6)
						.fill(0)
						.map((_, j) => `${b.x + (b.w * j) / 5},${y - rand(seed + b.k * 3 + j) * 30}`)
						.join(' ');
					out.push(<polygon key="jag" points={`${b.x},${y + 1} ${pts} ${b.x + b.w},${y + 1}`} fill={color} />);
				} else if (b.roof === 1) {
					out.push(<rect key="r" x={b.x + b.w * 0.35} y={y - 22} width={b.w * 0.3} height={22} fill={color} />);
				} else if (b.roof === 2) {
					out.push(<rect key="r" x={b.x + b.w * 0.48} y={y - 60} width={3} height={60} fill={color} />);
				}
				if (windows) {
					for (let r = 0; r < rows; r++) {
						for (let c = 0; c < cols; c++) {
							const s = seed + b.k * 131 + r * 17 + c * 3;
							const rr = rand(s);
							const broken = decay > 0 && rand(s + 0.5) < decay * 0.8;
							const lit = night > 0 && rr > lightsOut && rand(s + 1.7) > 0.25;
							let fill = mixColor(winDay, '#1a2230', night);
							let op = 0.55;
							if (lit) {
								fill = winNight;
								op = 0.85 * night;
							}
							if (broken) {
								fill = '#05070a';
								op = 0.9;
							}
							out.push(
								<rect
									key={`w${r}-${c}`}
									x={b.x + 9 + c * ww}
									y={y + 14 + r * 24}
									width={ww - 6}
									height={14}
									fill={fill}
									opacity={op}
								/>
							);
						}
					}
				}
				if (decay > 0.05) {
					// su lekeleri
					for (let j = 0; j < 3; j++) {
						const sx = b.x + rand(seed + b.k * 9 + j) * b.w;
						out.push(
							<rect
								key={`st${j}`}
								x={sx}
								y={y}
								width={6 + rand(seed + j) * 14}
								height={h * decay * rand(seed + b.k + j * 2)}
								fill="#2b1d12"
								opacity={0.35 * decay}
							/>
						);
					}
				}
				if (growth > 0.02) {
					for (let j = 0; j < 5; j++) {
						const vx = b.x + rand(seed + b.k * 2 + j * 5) * b.w;
						const vh = h * clamp(growth * (0.3 + rand(seed + b.k + j * 7) * 0.9));
						out.push(
							<path
								key={`v${j}`}
								d={`M ${vx} ${baseY} C ${vx - 14} ${baseY - vh * 0.33}, ${vx + 14} ${baseY - vh * 0.66}, ${vx} ${baseY - vh}`}
								stroke="#3f6b2f"
								strokeWidth={4 + growth * 10}
								fill="none"
								opacity={0.9}
								strokeLinecap="round"
							/>
						);
					}
				}
				return <g key={b.k}>{out}</g>;
			})}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/*  Araçlar                                                            */
/* ------------------------------------------------------------------ */

export const Car: React.FC<{x: number; y: number; color: string; scale?: number; flip?: boolean; lights?: boolean; rot?: number; wheel?: number}> = ({
	x,
	y,
	color,
	scale = 1,
	flip,
	lights = true,
	rot = 0,
	wheel = 0,
}) => (
	<g transform={`translate(${x},${y}) rotate(${rot}) scale(${flip ? -scale : scale},${scale})`}>
		<ellipse cx={0} cy={4} rx={70} ry={7} fill="#000" opacity={0.35} />
		<path d="M -68 -8 L -66 -28 Q -60 -34 -40 -36 L -26 -56 Q -20 -62 0 -62 L 26 -62 Q 36 -62 44 -50 L 52 -38 Q 66 -36 68 -26 L 70 -8 Z" fill={color} />
		<path d="M -22 -52 L -12 -58 L 0 -58 L 0 -38 L -32 -38 Z M 6 -58 L 24 -58 Q 32 -58 38 -48 L 44 -38 L 6 -38 Z" fill="#20303f" opacity={0.85} />
		{[-40, 42].map((cx) => (
			<g key={cx} transform={`translate(${cx},-8) rotate(${wheel})`}>
				<circle r={14} fill="#111" />
				<circle r={6} fill="#777" />
				<rect x={-1} y={-12} width={2} height={24} fill="#444" />
			</g>
		))}
		{lights && <ellipse cx={66} cy={-26} rx={4} ry={3} fill="#fff6c8" />}
		<rect x={-68} y={-28} width={4} height={6} fill="#c02020" />
	</g>
);

export const Bus: React.FC<{x: number; y: number; scale?: number; color?: string}> = ({x, y, scale = 1, color = '#c9a227'}) => (
	<g transform={`translate(${x},${y}) scale(${scale})`}>
		<rect x={-140} y={-110} width={280} height={100} rx={12} fill={color} />
		{new Array(7).fill(0).map((_, i) => (
			<rect key={i} x={-128 + i * 37} y={-98} width={30} height={36} fill="#22313f" />
		))}
		{[-90, 90].map((cx) => (
			<circle key={cx} cx={cx} cy={-10} r={18} fill="#111" />
		))}
	</g>
);

export const Plane: React.FC<{x: number; y: number; scale?: number; rot?: number; color?: string; lights?: number}> = ({
	x,
	y,
	scale = 1,
	rot = 0,
	color = '#d9dee6',
	lights = 1,
}) => {
	const f = useCurrentFrame();
	return (
		<g transform={`translate(${x},${y}) rotate(${rot}) scale(${scale})`}>
			<path d="M -120 0 Q -120 -14 -100 -14 L 90 -14 Q 125 -12 132 0 Q 125 10 90 10 L -100 10 Q -120 10 -120 0 Z" fill={color} />
			<path d="M -95 -12 L -118 -52 L -100 -52 L -70 -12 Z" fill={color} />
			<path d="M -10 0 L -50 44 L -30 44 L 30 2 Z" fill="#aab2bd" />
			<path d="M -10 -4 L -40 -30 L -26 -30 L 20 -6 Z" fill="#aab2bd" opacity={0.7} />
			{new Array(14).fill(0).map((_, i) => (
				<rect key={i} x={-80 + i * 11} y={-8} width={5} height={5} rx={1} fill="#334" />
			))}
			<path d="M 112 -10 Q 124 -8 128 -2 L 112 -2 Z" fill="#223" />
			<circle cx={-112} cy={-50} r={4} fill="#ff3030" opacity={lights * (f % 30 < 4 ? 1 : 0.2)} />
		</g>
	);
};

export const Train: React.FC<{x: number; y: number; cars?: number; scale?: number}> = ({x, y, cars = 4, scale = 1}) => (
	<g transform={`translate(${x},${y}) scale(${scale})`}>
		{new Array(cars).fill(0).map((_, i) => (
			<g key={i} transform={`translate(${-i * 250},0)`}>
				<path d={i === 0 ? 'M -110 0 L -110 -90 L 90 -90 Q 135 -88 140 -40 L 140 0 Z' : 'M -110 0 L -110 -90 L 135 -90 L 135 0 Z'} fill="#dfe3e8" />
				<rect x={-110} y={-30} width={250} height={8} fill="#c0392b" />
				{new Array(6).fill(0).map((_, j) => (
					<rect key={j} x={-96 + j * 36} y={-76} width={26} height={30} rx={3} fill="#2a3a4a" />
				))}
				{i === 0 && <path d="M 100 -80 Q 128 -78 132 -46 L 100 -46 Z" fill="#2a3a4a" />}
			</g>
		))}
	</g>
);

/* ------------------------------------------------------------------ */
/*  İnsan silüeti                                                      */
/* ------------------------------------------------------------------ */

export const Person: React.FC<{x: number; y: number; scale?: number; phase?: number; walk?: boolean; color?: string; opacity?: number}> = ({
	x,
	y,
	scale = 1,
	phase = 0,
	walk = true,
	color = '#1b222c',
	opacity = 1,
}) => {
	const f = useCurrentFrame();
	const s = walk ? Math.sin(f / 5 + phase) : 0;
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
			<circle cx={0} cy={-150} r={13} fill={color} />
			<path d="M -15 -132 Q 0 -138 15 -132 L 13 -70 L -13 -70 Z" fill={color} />
			<path d={`M -6 -72 L ${-6 + s * 14} -2 M 6 -72 L ${6 - s * 14} -2`} stroke={color} strokeWidth={10} strokeLinecap="round" />
			<path d={`M -14 -128 L ${-16 - s * 10} -80 M 14 -128 L ${16 + s * 10} -80`} stroke={color} strokeWidth={8} strokeLinecap="round" />
		</g>
	);
};

/** İnsanın kaybolduğu yerde kalan kıyafet yığını + parlayan telefon */
export const ClothesPile: React.FC<{x: number; y: number; scale?: number; hue?: number; phone?: number}> = ({x, y, scale = 1, hue = 210, phone = 0}) => {
	const f = useCurrentFrame();
	return (
		<g transform={`translate(${x},${y}) scale(${scale})`}>
			<ellipse cx={0} cy={0} rx={34} ry={9} fill={`hsl(${hue},35%,32%)`} />
			<ellipse cx={-8} cy={-5} rx={20} ry={8} fill={`hsl(${hue + 40},30%,26%)`} />
			<path d="M 4 -4 q 10 -12 22 -2" stroke={`hsl(${hue + 90},30%,40%)`} strokeWidth={6} fill="none" />
			<rect x={10} y={-6} width={14} height={7} rx={2} fill="#2a2a2a" />
			{phone > 0 && (
				<g>
					<rect x={-30} y={-4} width={12} height={5} rx={1} fill="#9fd3ff" opacity={phone * (0.5 + 0.5 * Math.sin(f / 4))} />
					<circle cx={-24} cy={-2} r={14} fill="#9fd3ff" opacity={phone * 0.12} />
				</g>
			)}
		</g>
	);
};

/* ------------------------------------------------------------------ */
/*  Doğa                                                               */
/* ------------------------------------------------------------------ */

export const Tree: React.FC<{x: number; y: number; s?: number; grow?: number; color?: string; seed?: number; dark?: number}> = ({
	x,
	y,
	s = 1,
	grow = 1,
	color = '#3d6b35',
	seed = 1,
	dark = 0,
}) => {
	const f = useCurrentFrame();
	const g = clamp(grow);
	if (g <= 0.01) return null;
	const sway = Math.sin(f / 40 + seed) * 2;
	const c2 = mixColor('#2c4f27', '#0f1a10', dark);
	const c1 = mixColor(color.startsWith('#') ? color : '#3d6b35', '#122014', dark);
	return (
		<g transform={`translate(${x},${y}) scale(${s * g})`}>
			<path d="M -7 0 L -4 -120 L 4 -120 L 7 0 Z" fill={mixColor('#4a3424', '#120d09', dark)} />
			<g transform={`rotate(${sway}, 0, -120)`}>
				{[0, 1, 2, 3, 4, 5].map((i) => (
					<circle
						key={i}
						cx={(rand(seed + i) - 0.5) * 90}
						cy={-130 - rand(seed + i * 3) * 80}
						r={34 + rand(seed + i * 5) * 26}
						fill={i % 2 ? c1 : c2}
					/>
				))}
			</g>
		</g>
	);
};

export const Pine: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = '#1f3a24'}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<rect x={-4} y={-20} width={8} height={20} fill="#3a2a1d" />
		<path d="M 0 -170 L 40 -60 L 18 -60 L 50 -20 L -50 -20 L -18 -60 L -40 -60 Z" fill={color} />
	</g>
);

export const GrassField: React.FC<{y: number; h: number; amount: number; seed?: number; color?: string; x0?: number; x1?: number; density?: number}> = ({
	y,
	h,
	amount,
	seed = 3,
	color = '#4f7a3a',
	x0 = 0,
	x1 = W,
	density = 160,
}) => {
	const f = useCurrentFrame();
	const blades = useMemo(
		() =>
			new Array(density).fill(0).map((_, i) => ({
				x: lerp(x0, x1, rand(seed + i * 1.37)),
				hh: 0.4 + rand(seed + i * 2.71) * 0.6,
				t: rand(seed + i * 9.1),
				c: rand(seed + i * 4.4),
			})),
		[seed, density, x0, x1]
	);
	return (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			{blades.map((b, i) => {
				const grow = clamp((amount - b.t * 0.6) / 0.4);
				if (grow <= 0) return null;
				const hh = h * b.hh * grow;
				const sw = Math.sin(f / 25 + b.x / 80) * 6 * grow;
				return (
					<path
						key={i}
						d={`M ${b.x - 4} ${y} Q ${b.x + sw * 0.5} ${y - hh * 0.6} ${b.x + sw} ${y - hh} Q ${b.x + 2} ${y - hh * 0.5} ${b.x + 4} ${y} Z`}
						fill={mixColor(color, '#7f9a45', b.c * 0.6)}
					/>
				);
			})}
		</svg>
	);
};

/* ------------------------------------------------------------------ */
/*  Hayvanlar                                                          */
/* ------------------------------------------------------------------ */

export const Fox: React.FC<{x: number; y: number; s?: number; walk?: number; flip?: boolean; head?: number}> = ({x, y, s = 1, walk = 0, flip, head = 0}) => {
	const l = Math.sin(walk) * 10;
	return (
		<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
			<path d={`M -60 -48 Q -120 -50 -128 -78 Q -100 -60 -64 -62 Z`} fill="#c8621f" />
			<path d="M -128 -78 Q -122 -70 -110 -66 L -116 -74 Z" fill="#f4efe6" />
			<path d="M -66 -70 Q -40 -82 10 -76 Q 36 -72 40 -56 L 36 -40 Q 0 -34 -40 -38 Q -66 -42 -66 -70 Z" fill="#d06a24" />
			<path d={`M -50 -40 L ${-52 + l} 0 M -36 -40 L ${-34 - l} 0 M 18 -42 L ${20 - l} 0 M 30 -42 L ${30 + l} 0`} stroke="#3b2618" strokeWidth={7} strokeLinecap="round" />
			<g transform={`rotate(${head}, 34, -64)`}>
				<path d="M 30 -60 L 34 -96 L 48 -76 L 62 -98 L 64 -66 L 92 -56 Q 84 -48 60 -46 Q 36 -46 30 -60 Z" fill="#d97026" />
				<path d="M 62 -54 L 92 -56 Q 84 -48 62 -46 Z" fill="#f4efe6" />
				<circle cx={60} cy={-66} r={3} fill="#111" />
				<circle cx={92} cy={-56} r={3} fill="#111" />
			</g>
			<path d="M -10 -38 Q 10 -30 32 -40 L 34 -50 Z" fill="#f4efe6" opacity={0.8} />
		</g>
	);
};

export const Dog: React.FC<{x: number; y: number; s?: number; tail?: number}> = ({x, y, s = 1, tail = 0}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<path d={`M -58 -60 Q -80 ${-90 + tail} -84 ${-96 + tail}`} stroke="#7a5233" strokeWidth={8} fill="none" strokeLinecap="round" />
		<ellipse cx={-10} cy={-60} rx={56} ry={26} fill="#8b5e3c" />
		<path d="M -50 -44 L -52 0 M -32 -40 L -30 0 M 16 -40 L 14 0 M 32 -44 L 34 0" stroke="#6d4a2f" strokeWidth={11} strokeLinecap="round" />
		<path d="M 30 -78 Q 40 -112 70 -108 Q 96 -104 98 -86 Q 96 -70 72 -70 Q 44 -64 30 -78 Z" fill="#9a6a44" />
		<path d="M 48 -104 Q 36 -92 42 -72 Q 54 -84 56 -102 Z" fill="#5a3b24" />
		<circle cx={74} cy={-94} r={3.5} fill="#111" />
		<circle cx={97} cy={-86} r={4} fill="#111" />
	</g>
);

export const Cat: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = '#2b2b30'}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<path d="M -30 -10 Q -60 -30 -50 -70" stroke={color} strokeWidth={7} fill="none" strokeLinecap="round" />
		<ellipse cx={0} cy={-24} rx={30} ry={22} fill={color} />
		<circle cx={20} cy={-52} r={16} fill={color} />
		<path d="M 8 -62 L 10 -80 L 20 -66 Z M 22 -66 L 32 -80 L 33 -60 Z" fill={color} />
		<circle cx={25} cy={-54} r={2.5} fill="#e6d36b" />
	</g>
);

export const Deer: React.FC<{x: number; y: number; s?: number; walk?: number; flip?: boolean; color?: string; antlers?: boolean}> = ({
	x,
	y,
	s = 1,
	walk = 0,
	flip,
	color = '#7b5638',
	antlers = true,
}) => {
	const l = Math.sin(walk) * 12;
	return (
		<g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`}>
			<path d={`M -50 -80 L ${-54 + l} 0 M -36 -80 L ${-32 - l} 0 M 34 -80 L ${36 - l} 0 M 46 -80 L ${46 + l} 0`} stroke={color} strokeWidth={7} strokeLinecap="round" />
			<ellipse cx={0} cy={-96} rx={62} ry={26} fill={color} />
			<path d="M 40 -110 L 62 -160 L 78 -156 L 62 -104 Z" fill={color} />
			<path d="M 60 -164 Q 74 -172 96 -160 Q 88 -150 70 -150 Z" fill={color} />
			{antlers && <path d="M 66 -166 L 60 -196 M 62 -184 L 48 -194 M 72 -166 L 80 -198 M 78 -186 L 92 -192" stroke="#cdb894" strokeWidth={4} strokeLinecap="round" />}
			<path d="M -60 -104 L -70 -96 L -60 -92 Z" fill="#efe6d6" />
		</g>
	);
};

export const Bird: React.FC<{x: number; y: number; s?: number; phase?: number; color?: string}> = ({x, y, s = 1, phase = 0, color = '#1a1d22'}) => {
	const f = useCurrentFrame();
	const w = Math.sin(f / 3 + phase) * 12;
	return <path d={`M ${x - 16 * s} ${y + w * s} Q ${x - 6 * s} ${y - 4 * s} ${x} ${y} Q ${x + 6 * s} ${y - 4 * s} ${x + 16 * s} ${y + w * s}`} stroke={color} strokeWidth={2.4 * s} fill="none" />;
};

export const Cow: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<rect x={-60} y={-90} width={110} height={50} rx={20} fill="#efe9df" />
		<circle cx={-30} cy={-72} r={12} fill="#2a2522" />
		<circle cx={14} cy={-62} r={9} fill="#2a2522" />
		<path d="M -50 -44 L -50 0 M -30 -44 L -30 0 M 26 -44 L 26 0 M 42 -44 L 42 0" stroke="#d8d0c4" strokeWidth={9} />
		<path d="M 46 -88 L 82 -84 Q 90 -64 74 -56 L 50 -62 Z" fill="#efe9df" />
		<ellipse cx={82} cy={-64} rx={9} ry={7} fill="#e2a9a0" />
	</g>
);

/* ------------------------------------------------------------------ */
/*  Dünya küresi (ortografik izdüşüm)                                  */
/* ------------------------------------------------------------------ */

const CONTINENTS: number[][][] = [
	// K. Amerika
	[[-168,66],[-140,70],[-110,72],[-85,70],[-75,62],[-60,55],[-55,48],[-67,44],[-75,38],[-80,32],[-81,25],[-90,29],[-97,26],[-97,20],[-90,16],[-83,10],[-78,8],[-86,13],[-95,16],[-105,20],[-110,24],[-117,32],[-124,40],[-124,48],[-135,58],[-150,60],[-165,62]],
	// Grönland
	[[-50,60],[-40,65],[-22,70],[-20,80],[-40,83],[-60,80],[-70,77],[-55,70]],
	// G. Amerika
	[[-80,10],[-72,12],[-62,10],[-50,0],[-35,-6],[-38,-15],[-48,-25],[-58,-35],[-65,-42],[-68,-52],[-72,-50],[-74,-40],[-71,-30],[-70,-18],[-76,-12],[-81,-5],[-80,2]],
	// Avrupa
	[[-10,36],[-9,43],[-2,44],[-5,48],[2,51],[8,54],[10,58],[5,62],[15,69],[28,71],[40,67],[30,60],[25,57],[22,55],[28,46],[30,41],[26,40],[23,37],[18,40],[15,38],[12,44],[8,44],[3,42],[-2,37]],
	// Britanya
	[[-5,50],[1,51],[-2,56],[-5,58],[-6,55]],
	// Afrika
	[[-17,15],[-17,21],[-10,30],[-6,35],[10,37],[11,33],[20,31],[32,31],[35,28],[43,12],[51,12],[42,0],[40,-10],[40,-16],[35,-24],[32,-29],[20,-35],[18,-30],[12,-17],[13,-6],[9,4],[-8,4],[-14,10]],
	// Madagaskar
	[[44,-25],[50,-15],[49,-12],[44,-17]],
	// Asya
	[[28,41],[36,36],[35,32],[43,13],[52,16],[57,23],[60,25],[67,25],[73,20],[77,8],[80,15],[88,22],[92,22],[98,16],[100,5],[104,1],[104,10],[109,12],[108,21],[115,22],[122,30],[121,40],[127,38],[129,35],[130,42],[140,48],[143,58],[160,60],[170,65],[180,68],[170,70],[140,73],[110,77],[80,73],[68,70],[50,68],[40,67],[30,60],[28,46]],
	// Japonya
	[[130,31],[136,34],[140,36],[142,40],[141,43],[138,38],[133,34]],
	// Endonezya
	[[95,5],[105,-6],[115,-8],[120,-9],[110,-3],[100,0]],
	[[109,2],[118,7],[119,-3],[111,-3]],
	// Avustralya
	[[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[141,-38],[135,-35],[129,-32],[115,-34]],
	// Yeni Zelanda
	[[172,-35],[178,-38],[174,-41],[170,-46],[167,-46],[172,-41]],
];

/** Büyük şehirler [boylam, enlem, büyüklük] */
export const CITIES: number[][] = [
	[-74,40.7,3],[-87.6,41.9,2],[-118.2,34,3],[-122.4,37.8,2],[-95.4,29.8,2],[-80.2,25.8,2],[-77,38.9,2],[-71,42.3,2],[-79.4,43.7,2],[-73.6,45.5,1.5],[-123.1,49.3,1.5],[-99.1,19.4,3],[-84.4,33.7,2],[-97,32.8,2],[-112,33.4,1.5],[-104.9,39.7,1.5],[-90,30,1],[-122.3,47.6,1.5],
	[-46.6,-23.5,3],[-43.2,-22.9,2.5],[-58.4,-34.6,2.5],[-70.6,-33.4,2],[-77,-12,2],[-74,4.7,2],[-66.9,10.5,1.5],[-38.5,-12.9,1.5],[-34.9,-8,1.5],
	[-0.1,51.5,3],[2.35,48.9,3],[13.4,52.5,2],[-3.7,40.4,2.5],[12.5,41.9,2],[9.2,45.5,2],[4.9,52.4,2],[16.4,48.2,1.5],[21,52.2,1.5],[37.6,55.8,3],[30.3,59.9,2],[30.5,50.4,2],[28.9,41,3],[32.9,39.9,2],[27.1,38.4,1.5],[23.7,38,1.5],[18,59.3,1.2],[10.7,59.9,1],[12.6,55.7,1.2],[-9.1,38.7,1.5],[2.2,41.4,2],[6.9,50.9,2],[8.7,50.1,1.5],[11.6,48.1,1.5],[19,47.5,1.5],[26.1,44.4,1.5],
	[31.2,30,3],[3.4,6.5,3],[36.8,-1.3,2],[28,-26.2,2.5],[18.4,-33.9,1.5],[-7.6,33.6,1.5],[3,36.7,1.5],[38.7,9,1.5],[15.3,-4.3,2],[-17.4,14.7,1.2],[32.6,0.3,1.2],[39.2,-6.8,1.2],
	[51.4,35.7,2.5],[46.7,24.7,2],[55.3,25.2,2],[44.4,33.3,2],[35.2,31.8,1.5],[72.9,19.1,3],[77.2,28.6,3],[88.4,22.6,2.5],[80.3,13.1,2],[77.6,13,2],[78.5,17.4,2],[67,24.9,3],[74.3,31.5,2.5],[90.4,23.8,3],
	[116.4,39.9,3],[121.5,31.2,3],[113.3,23.1,3],[114.1,22.5,2.5],[104.1,30.7,2.5],[106.5,29.6,2.5],[114.3,30.6,2],[108.9,34.3,2],[117.2,39.1,2],[126.9,37.6,3],[139.7,35.7,3.5],[135.5,34.7,2.5],[136.9,35.2,2],[130.4,33.6,1.5],[141.3,43.1,1.2],[121.6,25,2],[100.5,13.8,2.5],[106.8,-6.2,3],[106.7,10.8,2.5],[105.8,21,2],[103.8,1.35,2],[101.7,3.1,2],[121,14.6,3],[96.2,16.8,1.5],
	[151.2,-33.9,2],[144.9,-37.8,2],[153,-27.5,1.5],[115.9,-32,1.2],[174.8,-36.8,1.2],
	[69.2,41.3,1.5],[76.9,43.2,1.2],[82.9,55,1.2],[60.6,56.8,1.2],[49.1,55.8,1.2],[44.5,40.2,1],[49.9,40.4,1.2],
];

const D2R = Math.PI / 180;

export const project = (lon: number, lat: number, lon0: number, lat0: number, R: number) => {
	const l = (lon - lon0) * D2R;
	const p = lat * D2R;
	const p0 = lat0 * D2R;
	const x = R * Math.cos(p) * Math.sin(l);
	const y = -R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
	const vis = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
	return {x, y, vis};
};

const densify = (poly: number[][], n = 4) => {
	const out: number[][] = [];
	for (let i = 0; i < poly.length; i++) {
		const a = poly[i];
		const b = poly[(i + 1) % poly.length];
		for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]);
	}
	return out;
};
const DENSE = CONTINENTS.map((c) => densify(c));

export const Earth: React.FC<{
	cx: number;
	cy: number;
	R: number;
	lon0: number;
	lat0?: number;
	/** 0 gündüz, 1 tamamen gece yüzü */
	night?: number;
	/** şehir ışıkları 0..1 (ne kadarı yanıyor) */
	lights?: number;
	land?: string;
	ocean?: string;
	ice?: number;
	atmosphere?: number;
	children?: React.ReactNode;
}> = ({cx, cy, R, lon0, lat0 = 15, night = 0, lights = 0, land = '#3f6b3a', ocean = '#14385e', ice = 1, atmosphere = 1, children}) => {
	const id = `e${Math.round(R)}`;
	const paths = DENSE.map((poly) => {
		let anyVis = false;
		const d = poly
			.map((pt, i) => {
				const p = project(pt[0], pt[1], lon0, lat0, R);
				let {x, y} = p;
				if (p.vis < 0) {
					const m = Math.hypot(x, y) || 1;
					x = (x / m) * R;
					y = (y / m) * R;
				} else anyVis = true;
				return `${i ? 'L' : 'M'}${(cx + x).toFixed(1)},${(cy + y).toFixed(1)}`;
			})
			.join(' ');
		return anyVis ? d + 'Z' : null;
	});
	return (
		<g>
			<defs>
				<radialGradient id={`${id}atm`}>
					<stop offset="80%" stopColor="#6fb6ff" stopOpacity={0} />
					<stop offset="92%" stopColor="#6fb6ff" stopOpacity={0.35 * atmosphere} />
					<stop offset="100%" stopColor="#6fb6ff" stopOpacity={0} />
				</radialGradient>
				<radialGradient id={`${id}shade`} cx="30%" cy="30%" r="80%">
					<stop offset="0%" stopColor="#fff" stopOpacity={0.18} />
					<stop offset="60%" stopColor="#000" stopOpacity={0.05} />
					<stop offset="100%" stopColor="#000" stopOpacity={0.6} />
				</radialGradient>
				<clipPath id={`${id}clip`}>
					<circle cx={cx} cy={cy} r={R} />
				</clipPath>
				<filter id={`${id}glow`} x="-50%" y="-50%" width="200%" height="200%">
					<feGaussianBlur stdDeviation={R / 160} />
				</filter>
			</defs>
			<circle cx={cx} cy={cy} r={R * 1.12} fill={`url(#${id}atm)`} />
			<g clipPath={`url(#${id}clip)`}>
				<circle cx={cx} cy={cy} r={R} fill={ocean} />
				{paths.map((d, i) => d && <path key={i} d={d} fill={land} />)}
				{ice > 0 && (
					<>
						{(() => {
							const n = project(0, 90, lon0, lat0, R);
							const s = project(0, -90, lon0, lat0, R);
							return (
								<>
									{n.vis > 0 && <ellipse cx={cx + n.x} cy={cy + n.y} rx={R * 0.22 * ice} ry={R * 0.22 * ice * Math.max(0.15, n.vis)} fill="#eef4f8" opacity={0.75} />}
									{s.vis > 0 && <ellipse cx={cx + s.x} cy={cy + s.y} rx={R * 0.45 * ice} ry={R * 0.45 * ice * Math.max(0.15, s.vis)} fill="#eef4f8" opacity={0.9} />}
								</>
							);
						})()}
					</>
				)}
				<circle cx={cx} cy={cy} r={R} fill={`url(#${id}shade)`} />
				{night > 0 && <circle cx={cx} cy={cy} r={R} fill="#020510" opacity={night * 0.85} />}
				{lights > 0 && (
					<g filter={`url(#${id}glow)`}>
						{CITIES.map((c, i) => {
							const p = project(c[0], c[1], lon0, lat0, R);
							if (p.vis < 0.05) return null;
							const on = rand(i * 3.3) < lights;
							if (!on) return null;
							return (
								<g key={i}>
									<circle cx={cx + p.x} cy={cy + p.y} r={(R / 260) * c[2] * 2.2 * p.vis} fill="#ffcf73" opacity={0.95} />
									{[0, 1, 2, 3].map((k) => (
										<circle
											key={k}
											cx={cx + p.x + (rand(i * 7 + k) - 0.5) * (R / 30) * c[2]}
											cy={cy + p.y + (rand(i * 11 + k) - 0.5) * (R / 40) * c[2]}
											r={(R / 400) * c[2]}
											fill="#ffd98a"
											opacity={0.8}
										/>
									))}
								</g>
							);
						})}
					</g>
				)}
				{children}
			</g>
		</g>
	);
};

/** Eşdikdörtgen düz dünya haritası (gece ışıkları için) */
export const FlatMap: React.FC<{x: number; y: number; w: number; lights: number; land?: string; seedOff?: number; glow?: number}> = ({x, y, w, lights, land = '#1b2633', seedOff = 0, glow = 1}) => {
	const h = w / 2;
	const P = (lon: number, lat: number) => [x + ((lon + 180) / 360) * w, y + ((90 - lat) / 180) * h];
	return (
		<g>
			<defs>
				<filter id="mapglow" x="-20%" y="-20%" width="140%" height="140%">
					<feGaussianBlur stdDeviation={3} />
				</filter>
			</defs>
			{CONTINENTS.map((c, i) => (
				<path key={i} d={c.map((pt, k) => `${k ? 'L' : 'M'}${P(pt[0], pt[1]).join(',')}`).join(' ') + 'Z'} fill={land} stroke="#2c3d50" strokeWidth={1} />
			))}
			<g filter="url(#mapglow)" opacity={glow}>
				{CITIES.map((c, i) => {
					const on = rand(i * 3.3 + seedOff) >= 1 - lights;
					const [px, py] = P(c[0], c[1]);
					return on ? <circle key={i} cx={px} cy={py} r={c[2] * 3.2} fill="#ffc861" /> : null;
				})}
			</g>
			{CITIES.map((c, i) => {
				const on = rand(i * 3.3 + seedOff) >= 1 - lights;
				const [px, py] = P(c[0], c[1]);
				return on ? <circle key={i} cx={px} cy={py} r={c[2] * 1.1} fill="#fff3cf" /> : null;
			})}
		</g>
	);
};

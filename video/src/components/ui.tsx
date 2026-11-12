import React from 'react';
import {AbsoluteFill, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {H, W, clamp, lin, prog, rand} from '../lib/util';

export const FONT = "'Inter', 'Inter Display', 'DejaVu Sans', sans-serif";
export const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";

/* ------------------------------------------------------------------ */
/*  Plan (shot) — sahne içinde kesme / çapraz geçiş + kamera hareketi  */
/* ------------------------------------------------------------------ */

export const Shot: React.FC<{
	from: number;
	to: number;
	fadeIn?: number;
	fadeOut?: number;
	/** kamera: başlangıç ve bitiş ölçeği */
	zoom?: [number, number];
	/** kamera kayması (px) başlangıç -> bitiş */
	pan?: [number, number, number, number];
	children: React.ReactNode;
	bg?: string;
}> = ({from, to, fadeIn = 12, fadeOut = 12, zoom = [1, 1], pan = [0, 0, 0, 0], children, bg}) => {
	const len = Math.max(1, to - from + fadeOut);
	return (
		<Sequence from={from} durationInFrames={len} layout="none">
			<ShotInner len={len} fadeIn={fadeIn} fadeOut={fadeOut} zoom={zoom} pan={pan} bg={bg}>
				{children}
			</ShotInner>
		</Sequence>
	);
};

const ShotInner: React.FC<{
	len: number;
	fadeIn: number;
	fadeOut: number;
	zoom: [number, number];
	pan: [number, number, number, number];
	bg?: string;
	children: React.ReactNode;
}> = ({len, fadeIn, fadeOut, zoom, pan, bg, children}) => {
	const f = useCurrentFrame();
	const op = Math.min(fadeIn ? lin(f, 0, fadeIn) : 1, fadeOut ? 1 - lin(f, len - fadeOut, len) : 1);
	const t = prog(f, 0, len, Easing.inOut(Easing.sin));
	const s = zoom[0] + (zoom[1] - zoom[0]) * t;
	const x = pan[0] + (pan[2] - pan[0]) * t;
	const y = pan[1] + (pan[3] - pan[1]) * t;
	return (
		<AbsoluteFill style={{opacity: op, background: bg}}>
			<AbsoluteFill style={{transform: `translate(${x}px, ${y}px) scale(${s})`, transformOrigin: '50% 50%'}}>{children}</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/*  Sinematik katmanlar                                                */
/* ------------------------------------------------------------------ */

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.09}) => {
	const f = useCurrentFrame();
	const ox = Math.floor(rand(f * 1.3) * 512);
	const oy = Math.floor(rand(f * 2.7) * 512);
	return (
		<AbsoluteFill
			style={{
				backgroundImage: `url(${staticFile('noise.png')})`,
				backgroundPosition: `${ox}px ${oy}px`,
				opacity,
				mixBlendMode: 'overlay',
				pointerEvents: 'none',
			}}
		/>
	);
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.75}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 45%, rgba(0,0,0,${strength}) 100%)`,
			pointerEvents: 'none',
		}}
	/>
);

export const Letterbox: React.FC<{size?: number}> = ({size = 54}) => (
	<>
		<div style={{position: 'absolute', left: 0, top: 0, width: W, height: size, background: '#000'}} />
		<div style={{position: 'absolute', left: 0, bottom: 0, width: W, height: size, background: '#000'}} />
	</>
);

/** Ekranı kaplayan kısa beyaz/renkli flaş */
export const Flash: React.FC<{at: number; len?: number; color?: string; peak?: number}> = ({at, len = 14, color = '#fff', peak = 1}) => {
	const f = useCurrentFrame();
	const o = interpolate(f, [at, at + 2, at + len], [0, peak, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	if (o <= 0) return null;
	return <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} />;
};

/** Dijital bozulma çizgileri */
export const Glitch: React.FC<{at: number; len?: number}> = ({at, len = 10}) => {
	const f = useCurrentFrame();
	if (f < at || f > at + len) return null;
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{new Array(10).fill(0).map((_, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						left: 0,
						top: rand(f * 13 + i) * H,
						width: W,
						height: 4 + rand(f + i * 7) * 40,
						background: i % 2 ? 'rgba(80,220,255,0.35)' : 'rgba(255,60,90,0.3)',
						transform: `translateX(${(rand(f * 3 + i) - 0.5) * 200}px)`,
						mixBlendMode: 'screen',
					}}
				/>
			))}
		</AbsoluteFill>
	);
};

/* ------------------------------------------------------------------ */
/*  Metin öğeleri                                                      */
/* ------------------------------------------------------------------ */

export const BigText: React.FC<{
	children: React.ReactNode;
	at?: number;
	size?: number;
	y?: number;
	color?: string;
	weight?: number;
	spacing?: number;
	sub?: React.ReactNode;
	out?: number;
	align?: 'center' | 'left';
	x?: number;
}> = ({children, at = 0, size = 120, y = H / 2, color = '#f2efe8', weight = 800, spacing = 0.04, sub, out, align = 'center', x = 0}) => {
	const f = useCurrentFrame();
	const o = Math.min(lin(f, at, at + 18), out !== undefined ? 1 - lin(f, out - 15, out) : 1);
	const blur = (1 - lin(f, at, at + 22)) * 14;
	const tr = (1 - prog(f, at, at + 30)) * 30;
	return (
		<div
			style={{
				position: 'absolute',
				left: align === 'center' ? 0 : x,
				width: align === 'center' ? W : W - x,
				top: y,
				transform: `translateY(-50%) translateY(${tr}px)`,
				textAlign: align,
				opacity: o,
				filter: `blur(${blur}px)`,
				fontFamily: FONT,
			}}
		>
			<div style={{fontSize: size, fontWeight: weight, letterSpacing: `${spacing}em`, color, textShadow: '0 4px 40px rgba(0,0,0,0.6)', lineHeight: 1.05}}>{children}</div>
			{sub && <div style={{marginTop: 22, fontSize: size * 0.24, fontWeight: 400, letterSpacing: '0.3em', color: '#c9c3b6', textTransform: 'uppercase'}}>{sub}</div>}
		</div>
	);
};

/** Bilgi kartı: köşede beliren kaynaklı gerçek */
export const FactCard: React.FC<{at: number; out: number; title: string; body: string; source?: string; x?: number; y?: number; w?: number; accent?: string}> = ({
	at,
	out,
	title,
	body,
	source,
	x = 110,
	y = 150,
	w = 620,
	accent = '#f0b44c',
}) => {
	const f = useCurrentFrame();
	const o = Math.min(lin(f, at, at + 15), 1 - lin(f, out - 15, out));
	if (o <= 0) return null;
	const sl = (1 - prog(f, at, at + 20)) * -40;
	return (
		<div
			style={{
				position: 'absolute',
				left: x + sl,
				top: y,
				width: w,
				opacity: o,
				fontFamily: FONT,
				background: 'rgba(8,12,18,0.72)',
				borderLeft: `4px solid ${accent}`,
				padding: '22px 28px',
				backdropFilter: 'blur(6px)',
				boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
			}}
		>
			<div style={{fontFamily: MONO, fontSize: 18, letterSpacing: '0.2em', color: accent, textTransform: 'uppercase'}}>{title}</div>
			<div style={{fontSize: 34, color: '#f3efe6', fontWeight: 600, marginTop: 8, lineHeight: 1.25}}>{body}</div>
			{source && <div style={{fontFamily: MONO, fontSize: 15, color: '#8d96a3', marginTop: 12}}>Kaynak: {source}</div>}
		</div>
	);
};

/** Küçük etiket (HUD tarzı) */
export const Tag: React.FC<{x: number; y: number; at: number; text: string; color?: string; out?: number; size?: number}> = ({x, y, at, text, color = '#9fe3ff', out = 1e9, size = 20}) => {
	const f = useCurrentFrame();
	const o = Math.min(lin(f, at, at + 10), 1 - lin(f, out - 10, out));
	if (o <= 0) return null;
	const n = Math.floor(lin(f, at, at + 20) * text.length);
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity: o, fontFamily: MONO, fontSize: size, color, letterSpacing: '0.12em', textShadow: '0 0 12px rgba(0,0,0,0.8)'}}>
			<span style={{display: 'inline-block', width: 10, height: 10, background: color, marginRight: 10, borderRadius: 5}} />
			{text.slice(0, n)}
		</div>
	);
};

/** Yatay gösterge çubuğu */
export const Meter: React.FC<{x: number; y: number; w: number; label: string; value: number; color?: string; unit?: string; display?: string}> = ({
	x,
	y,
	w,
	label,
	value,
	color = '#4fd1ff',
	display,
}) => (
	<div style={{position: 'absolute', left: x, top: y, width: w, fontFamily: MONO, color: '#d9e2ea'}}>
		<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 20, letterSpacing: '0.1em'}}>
			<span>{label}</span>
			<span style={{color}}>{display ?? `${Math.round(value * 100)}%`}</span>
		</div>
		<div style={{marginTop: 8, height: 12, background: 'rgba(255,255,255,0.12)'}}>
			<div style={{width: `${clamp(value) * 100}%`, height: '100%', background: color, boxShadow: `0 0 16px ${color}`}} />
		</div>
	</div>
);

export const NoiseImg: React.FC = () => <Img src={staticFile('noise.png')} />;

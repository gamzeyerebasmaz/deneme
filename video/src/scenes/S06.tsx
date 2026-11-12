import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, prog, rand} from '../lib/util';
import {BigText, FONT, MONO, Shot, Tag} from '../components/ui';
import {Street, StreetProps} from '../components/street';
import {Bird, Deer, Fox, GrassField, Sky, Tree} from '../components/world';
import {Sfx} from './S01';

/** Street parametrelerini kare ile canlandırır */
export const LiveStreet: React.FC<{len: number; from: Partial<StreetProps>; to: Partial<StreetProps>; base?: StreetProps}> = ({len, from, to, base}) => {
	const f = useCurrentFrame();
	const t = prog(f, 0, len, (x) => x);
	const p: Record<string, unknown> = {...base};
	for (const k of Object.keys(to) as (keyof StreetProps)[]) {
		const a = (from[k] as number) ?? 0;
		const b = to[k] as number;
		p[k] = a + (b - a) * t;
	}
	return <Street afterVanish cars="parked" {...(p as StreetProps)} />;
};

export const Birds: React.FC<{n?: number; y?: number; speed?: number; color?: string}> = ({n = 7, y = 260, speed = 4, color}) => {
	const f = useCurrentFrame();
	return (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			{new Array(n).fill(0).map((_, i) => (
				<Bird key={i} x={((f * speed + i * 90 + rand(i) * 60) % (W + 300)) - 150} y={y + Math.sin(f / 30 + i) * 20 + (i % 3) * 30} s={1 + rand(i) * 0.6} phase={i} color={color} />
			))}
		</svg>
	);
};

const Park: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#86a9c4" mid="#cfe0d8" bottom="#e9e7cf" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{[100, 420, 1500, 1800].map((x, i) => (
					<Tree key={x} x={x} y={760} s={2.6 + rand(i) * 0.6} seed={i * 4} />
				))}
				<rect y={740} width={W} height={400} fill="#5f8a3e" />
				{/* salıncak */}
				<path d="M 760 760 L 840 420 L 1120 420 L 1200 760" stroke="#7a2f24" strokeWidth={12} fill="none" />
				{[900, 1060].map((x, i) => {
					const a = Math.sin(f / 35 + i) * 6;
					return (
						<g key={x} transform={`rotate(${a}, ${x}, 420)`}>
							<line x1={x - 25} y1={420} x2={x - 25} y2={650} stroke="#555" strokeWidth={3} />
							<line x1={x + 25} y1={420} x2={x + 25} y2={650} stroke="#555" strokeWidth={3} />
							<rect x={x - 32} y={650} width={64} height={10} fill="#3a2a1d" />
						</g>
					);
				})}
				{/* bank */}
				<rect x={300} y={760} width={260} height={14} fill="#6b4b2c" />
				<rect x={300} y={720} width={260} height={12} fill="#6b4b2c" />
				<rect x={320} y={774} width={10} height={50} fill="#333" />
				<rect x={530} y={774} width={10} height={50} fill="#333" />
				{new Array(40).fill(0).map((_, i) => (
					<circle key={i} cx={rand(i * 3) * W} cy={860 + rand(i * 5) * 160} r={6} fill={['#f2d24b', '#e8e8f0', '#c45ab3', '#f08a4b'][i % 4]} opacity={lin(f, i * 2, i * 2 + 20)} />
				))}
			</svg>
			<GrassField y={1080} h={260} amount={0.4 + prog(f, 0, 200) * 0.6} density={200} seed={12} />
			<GrassField y={800} h={140} amount={0.5 + prog(f, 0, 200) * 0.5} density={120} seed={14} color="#5a7f3a" />
			<Birds n={5} y={200} />
		</AbsoluteFill>
	);
};

const FoxStreet: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const x = -200 + (f / len) * (W + 400);
	return (
		<AbsoluteFill>
			<Street afterVanish cars="parked" growth={0.55} trees={0.45} rust={0.15} people night={0.25} signal={false} seed={2} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Fox x={x} y={1000} s={1.4} walk={f / 4} />
			</svg>
			<Birds n={9} y={240} speed={5} />
			<Tag x={110} y={160} at={20} text="KIZIL TİLKİ · VULPES VULPES" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const EmptyPen: React.FC<{regAt: number}> = ({regAt}) => {
	const f = useCurrentFrame();
	const cards = [
		['KENT', 'Tilki · kuzgun · güvercin · fare'],
		['KIRSAL', 'Geyik · yaban domuzu · kurt'],
		['KIYI', 'Martı · fok · deniz kuşları'],
	];
	return (
		<AbsoluteFill>
			<Sky top="#8a98a5" mid="#c9c4b6" bottom="#ddd2bb" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={700} width={W} height={400} fill="#8d8f55" />
				{new Array(18).fill(0).map((_, i) => (
					<rect key={i} x={80 + i * 100} y={640} width={10} height={160} fill="#5a3f26" />
				))}
				<rect x={80} y={680} width={1700} height={8} fill="#5a3f26" />
				<rect x={80} y={740} width={1700} height={8} fill="#5a3f26" />
				<g transform={`rotate(${-20 + Math.sin(f / 25) * 6}, 980, 640)`}>
					<rect x={980} y={660} width={200} height={10} fill="#6b4b2c" />
					<rect x={980} y={720} width={200} height={10} fill="#6b4b2c" />
				</g>
			</svg>
			<GrassField y={1080} h={200} amount={0.9} density={180} seed={21} color="#7a8a45" />
			<Birds n={3} y={300} speed={3} />
			<div style={{position: 'absolute', left: 160, top: 220, display: 'flex', gap: 30}}>
				{cards.map(([t, d], i) => (
					<div key={t} style={{width: 500, background: 'rgba(8,12,18,0.72)', padding: '20px 26px', opacity: lin(f, regAt + i * 15, regAt + i * 15 + 12), borderTop: '3px solid #9fe3ff'}}>
						<div style={{fontFamily: MONO, fontSize: 20, color: '#9fe3ff', letterSpacing: '0.2em'}}>{t}</div>
						<div style={{fontFamily: FONT, fontSize: 30, color: '#f3efe6', marginTop: 8}}>{d}</div>
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

const DeerAvenue: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Street afterVanish cars="parked" growth={0.6} trees={0.5} rust={0.2} people={false} signal={false} seed={7} night={0.1} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Deer x={W + 100 - (f / len) * 900} y={880} s={1.3} walk={f / 5} flip />
				<Deer x={W + 330 - (f / len) * 900} y={900} s={1.1} walk={f / 5 + 1} flip antlers={false} />
			</svg>
		</AbsoluteFill>
	);
};

const Mall: React.FC<{stopAt: number; lookAt: number; goAt: number}> = ({stopAt, lookAt, goAt}) => {
	const f = useCurrentFrame();
	const doorX = 860;
	const walking = f < stopAt || f > goAt;
	let x: number;
	if (f < stopAt) x = -200 + (f / stopAt) * (doorX + 200);
	else if (f < goAt) x = doorX;
	else x = doorX + (f - goAt) * 9;
	const head = f > lookAt && f < goAt ? -18 * prog(f, lookAt, lookAt + 12) : 0;
	return (
		<AbsoluteFill>
			<Sky top="#7f95a6" mid="#c6c6bc" bottom="#d7cdb6" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={200} y={160} width={1520} height={700} fill="#bcb6aa" />
				<rect x={200} y={160} width={1520} height={120} fill="#a39d90" />
				<text x={960} y={245} fill="#3a3a3a" fontSize={72} textAnchor="middle" fontFamily="Inter" fontWeight={800} letterSpacing="20">
					ALIŞVERİŞ MERKEZ
				</text>
				<text x={1430} y={262} fill="#3a3a3a" fontSize={72} fontFamily="Inter" fontWeight={800} opacity={0.25} transform="rotate(14, 1430, 240)">
					İ
				</text>
				{/* cam cephe */}
				<rect x={420} y={340} width={1080} height={520} fill="#2a3a44" />
				{/* mankenler */}
				{[560, 760, 1160, 1360].map((mx, i) => (
					<g key={mx} opacity={0.85}>
						<circle cx={mx} cy={470} r={22} fill="#e8e2d4" />
						<path d={`M ${mx - 34} 500 L ${mx + 34} 500 L ${mx + 26} 640 L ${mx - 26} 640 Z`} fill={['#b23a2e', '#2f5d8a', '#c79a2c', '#3d6b4f'][i]} />
						<path d={`M ${mx - 18} 640 L ${mx - 14} 780 M ${mx + 18} 640 L ${mx + 14} 780`} stroke="#e8e2d4" strokeWidth={10} />
						<rect x={mx - 30} y={780} width={60} height={8} fill="#555" />
					</g>
				))}
				{/* yansıma ve kirli cam */}
				<path d="M 420 340 L 700 340 L 520 860 L 420 860 Z" fill="#fff" opacity={0.07} />
				<path d="M 1100 340 L 1200 340 L 1020 860 L 920 860 Z" fill="#fff" opacity={0.05} />
				{new Array(6).fill(0).map((_, i) => (
					<rect key={i} x={420 + i * 180} y={340} width={8} height={520} fill="#8f8a80" />
				))}
				<path d="M 1240 360 l 40 60 l -30 40 l 50 70" stroke="#d8dde0" strokeWidth={2} fill="none" opacity={0.6} />
				<rect y={860} width={W} height={300} fill="#8a8984" />
			</svg>
			<GrassField y={1080} h={140} amount={0.8} density={150} seed={31} />
			<GrassField y={872} h={80} amount={0.7} density={90} seed={33} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Fox x={x} y={975} s={2.1} walk={walking ? f / 4 : 0} head={head} />
			</svg>
		</AbsoluteFill>
	);
};

export const S06: React.FC = () => {
	const {b, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(3)} zoom={[1.0, 1.08]}>
				<LiveStreet len={b(3)} from={{growth: 0, trees: 0, rust: 0}} to={{growth: 0.6, trees: 0.45, rust: 0.18}} base={{people: true, signal: false, seed: 3}} />
			</Shot>
			<Sfx at={0} src="wind" vol={0.25} len={b(3)} />
			<Shot from={b(3)} to={b(4)} zoom={[1, 1.06]}>
				<Park />
			</Shot>
			<Sfx at={b(3)} src="birds" vol={0.4} len={b(5) - b(3)} />
			<Shot from={b(4)} to={b(5)}>
				<FoxStreet len={b(5) - b(4) + 12} />
			</Shot>
			<Shot from={b(5)} to={b(8)}>
				<EmptyPen regAt={b(7) - b(5)} />
			</Shot>
			<Sfx at={b(5)} src="wind" vol={0.3} len={b(8) - b(5)} />
			<Shot from={b(8)} to={b(9)}>
				<DeerAvenue len={b(9) - b(8) + 12} />
			</Shot>
			<Shot from={b(9)} to={b(13)} zoom={[1, 1.05]}>
				<Mall stopAt={b(10) - b(9) - 10} lookAt={b(11) - b(9)} goAt={b(12) - b(9) + 10} />
			</Shot>
			<Sfx at={b(9)} src="wind" vol={0.2} len={b(13) - b(9)} />
			<Shot from={b(13)} to={dur} zoom={[1.1, 1]}>
				<LiveStreet len={dur - b(13)} from={{growth: 0.6, trees: 0.5}} to={{growth: 0.7, trees: 0.55}} base={{people: true, signal: false, seed: 3, night: 0.35}} />
				<Birds n={12} y={200} speed={3} />
				<BigText at={15} size={70} y={260} weight={300} spacing={0.1}>
					Dünyanın yeni sahipleri
				</BigText>
			</Shot>
		</AbsoluteFill>
	);
};

import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {H, W, clamp, lin, mixColor, rand} from '../lib/util';
import {Car, ClothesPile, GrassField, Moon, Person, Skyline, Sky, Stars, Tree, Bus} from './world';

export type StreetProps = {
	/** 0 sabah, 1 gece */
	night?: number;
	people?: boolean;
	/** kaybolma karesi (yerel); undefined = kaybolma yok */
	vanishAt?: number;
	/** insanlar hiç yok, sadece kıyafetler */
	afterVanish?: boolean;
	cars?: 'flow' | 'coast' | 'parked' | 'none';
	growth?: number;
	decay?: number;
	collapse?: number;
	lightsOut?: number;
	camX?: number;
	trees?: number;
	rust?: number;
	seed?: number;
	signal?: boolean;
};

const CAR_COLORS = ['#b23a2e', '#d8d8d8', '#2f5d8a', '#1d1d1f', '#c79a2c', '#6b7a86', '#3d6b4f', '#8a8f96'];

export const Street: React.FC<StreetProps> = ({
	night = 0,
	people = true,
	vanishAt,
	afterVanish,
	cars = 'flow',
	growth = 0,
	decay = 0,
	collapse = 0,
	lightsOut = 0,
	camX = 0,
	trees = 0,
	rust = 0,
	seed = 0,
	signal = true,
}) => {
	const f = useCurrentFrame();
	const skyTop = mixColor('#6f93b8', '#03060d', night);
	const skyMid = mixColor('#e9b98d', '#0b1424', night);
	const skyBot = mixColor('#f6d7ae', '#141d2c', night);

	const peopleList = useMemo(
		() =>
			new Array(26).fill(0).map((_, i) => ({
				x0: rand(seed + i * 3.7) * (W + 400) - 200,
				front: i % 3 === 0,
				dir: rand(seed + i * 1.9) > 0.5 ? 1 : -1,
				sp: 1.2 + rand(seed + i * 5.3) * 1.3,
				ph: rand(seed + i) * 6,
				hue: Math.floor(rand(seed + i * 8) * 360),
				color: mixColor('#151b24', '#3a2f2a', rand(seed + i * 2.2)),
			})),
		[seed]
	);

	const carList = useMemo(
		() =>
			new Array(9).fill(0).map((_, i) => ({
				lane: i % 2,
				x0: (i * 520 + rand(seed + i) * 200) % (W + 800) - 400,
				c: CAR_COLORS[i % CAR_COLORS.length],
				sp: 7 + rand(seed + i * 2) * 3,
				bus: i === 4,
			})),
		[seed]
	);

	const vanishT = vanishAt === undefined ? 1e9 : vanishAt;
	const gone = afterVanish || f >= vanishT + 6;
	const flicker = vanishAt !== undefined && f >= vanishT && f < vanishT + 6;

	// arabaların konumu
	const carX = (c: (typeof carList)[number], idx: number) => {
		const dir = c.lane === 0 ? 1 : -1;
		let dist: number;
		if (cars === 'flow') dist = f * c.sp;
		else if (cars === 'coast') {
			const t0 = Math.min(f, vanishT);
			const after = Math.max(0, f - vanishT);
			// 2.5 sn içinde yavaşlayarak durur
			const dec = Math.min(after, 75);
			dist = t0 * c.sp + c.sp * (dec - (dec * dec) / 150);
		} else dist = 0;
		let x = c.x0 + dir * dist + camX * -1;
		const span = W + 800;
		x = ((((x + 400) % span) + span) % span) - 400;
		return x + (idx % 3) * 0;
	};

	const roadY = 720;
	const laneY = [812, 892];
	const crackGrow = clamp(growth);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Sky top={skyTop} mid={skyMid} bottom={skyBot} />
			{night < 0.6 && (
				<AbsoluteFill style={{background: `radial-gradient(circle at 62% 58%, rgba(255,214,150,${0.85 * (1 - night)}) 0%, rgba(255,170,90,${0.35 * (1 - night)}) 12%, rgba(255,150,80,0) 38%)`}} />
			)}
			{night > 0.3 && <Stars opacity={(night - 0.3) * 1.4} />}
			{night > 0.5 && <Moon x={1500} y={200} r={50} glow={night} />}
			<div style={{position: 'absolute', left: -camX * 0.15, top: 0}}>
				<Skyline seed={11} baseY={650} minH={240} maxH={560} color={mixColor('#7d8ea3', '#101826', night)} windows={false} collapse={collapse * 0.6} growth={growth * 0.5} />
			</div>
			<AbsoluteFill style={{background: `linear-gradient(180deg, transparent 35%, ${mixColor('#f1c9a0', '#0c1422', night)} 62%, transparent 75%)`, opacity: 0.55}} />
			<div style={{position: 'absolute', left: -camX * 0.35, top: 0}}>
				<Skyline
					seed={22}
					baseY={690}
					minH={170}
					maxH={460}
					color={mixColor('#3e4b5c', '#0b111a', night)}
					night={night}
					lightsOut={lightsOut}
					decay={decay}
					growth={growth * 0.7}
					collapse={collapse}
				/>
			</div>
			<AbsoluteFill style={{background: `linear-gradient(180deg, transparent 45%, ${mixColor('#e8b88c', '#0a101a', night)} 66%, transparent 74%)`, opacity: 0.35}} />
			<div style={{position: 'absolute', left: -camX * 0.6, top: 0}}>
				<Skyline
					seed={33}
					baseY={roadY - 10}
					minH={160}
					maxH={360}
					color={mixColor('#262d38', '#07090d', night)}
					night={night}
					lightsOut={lightsOut}
					decay={decay}
					growth={growth}
					collapse={collapse * 0.7}
					scaleW={1.7}
					gap={18}
				/>
			</div>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{/* kaldırım ve yol */}
				<rect x={0} y={roadY - 12} width={W} height={24} fill={mixColor('#8b8d8f', '#1a1c20', night)} />
				<rect x={0} y={roadY + 12} width={W} height={200} fill={mixColor(mixColor('#3a3d42', '#4a4d47', growth * 0.5), '#0b0c0e', night)} />
				{[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
					<rect key={i} x={((i * 220 - camX) % (W + 220) + W + 220) % (W + 220) - 110} y={roadY + 118} width={110} height={7} fill="#e8e2c8" opacity={0.7 * (1 - growth * 0.8)} />
				))}
				<rect x={0} y={roadY + 212} width={W} height={H - roadY - 212} fill={mixColor('#77797c', '#121316', night)} />
				<rect x={0} y={roadY + 212} width={W} height={8} fill={mixColor('#5d5f62', '#0b0c0e', night)} />
				{/* asfalt çatlakları */}
				{crackGrow > 0 &&
					new Array(14).fill(0).map((_, i) => {
						const cx = rand(i * 9.3 + seed) * W;
						const cy = roadY + 24 + rand(i * 4.1 + seed) * 180;
						const l = 40 + rand(i) * 120;
						return (
							<path
								key={i}
								d={`M ${cx} ${cy} l ${l * 0.3} ${-6} l ${l * 0.3} 8 l ${l * 0.4} -5`}
								stroke="#16181b"
								strokeWidth={3}
								fill="none"
								opacity={clamp(crackGrow * 2)}
							/>
						);
					})}
				{/* trafik ışığı */}
				{signal && (
					<g transform={`translate(${1540 - camX * 0.9}, ${roadY - 10})`}>
						<rect x={-5} y={-300} width={10} height={300} fill={mixColor('#2b2f35', '#5a3b22', rust)} />
						<rect x={-24} y={-380} width={48} height={110} rx={8} fill="#1a1d22" />
						{['#ff3b30', '#ffcc00', '#34c759'].map((c, i) => {
							const phase = Math.floor(f / 90) % 3;
							const on = rust < 0.3 && (lightsOut < 0.95) && (cars === 'flow' ? (phase === 0 ? i === 2 : phase === 1 ? i === 1 : i === 0) : i === 1 && f % 30 < 15);
							return <circle key={c} cx={0} cy={-360 + i * 34} r={12} fill={c} opacity={on ? 1 : 0.15} />;
						})}
					</g>
				)}
			</svg>
			{/* arabalar */}
			{cars !== 'none' && (
				<svg width={W} height={H} style={{position: 'absolute'}}>
					{carList.map((c, i) => {
						const x = carX(c, i);
						const y = laneY[c.lane];
						const wheel = cars === 'parked' ? 0 : (x / 14) * 57;
						const col = rust > 0 ? mixColor(c.c, '#6b3d22', rust) : c.c;
						return c.bus ? (
							<Bus key={i} x={x} y={y} scale={1.4} color={rust > 0 ? mixColor('#c9a227', '#6b3d22', rust) : '#c9a227'} />
						) : (
							<Car key={i} x={x} y={y} color={col} scale={c.lane ? 1.6 : 1.4} flip={c.lane === 1} lights={night > 0.2 && rust < 0.2} wheel={wheel} />
						);
					})}
				</svg>
			)}
			{/* insanlar */}
			{people && (
				<svg width={W} height={H} style={{position: 'absolute'}}>
					{peopleList.map((p, i) => {
						const tt = Math.min(f, vanishT);
						let x = p.x0 + p.dir * tt * p.sp - camX * (p.front ? 1 : 0.8);
						x = ((((x + 200) % (W + 400)) + W + 400) % (W + 400)) - 200;
						const y = p.front ? H - 70 : roadY - 4;
						const s = p.front ? 1.55 : 0.85;
						if (gone) return <ClothesPile key={i} x={x} y={y} scale={s * 1.1} hue={p.hue} phone={i % 4 === 0 ? 1 : 0} />;
						const op = flicker ? (f % 2 ? 0.2 : 0.9) : 1;
						return (
							<g key={i} transform={p.dir < 0 ? `translate(${2 * x},0) scale(-1,1)` : undefined}>
								<Person x={x} y={y} scale={s} phase={p.ph} color={p.color} opacity={op} />
							</g>
						);
					})}
				</svg>
			)}
			{/* bitkiler */}
			{growth > 0 && (
				<>
					<GrassField y={roadY + 14} h={60 + growth * 120} amount={growth} seed={seed + 5} density={140} />
					<GrassField y={H - 60} h={90 + growth * 220} amount={growth} seed={seed + 9} density={160} color="#3f6a33" />
				</>
			)}
			{trees > 0 && (
				<svg width={W} height={H} style={{position: 'absolute'}}>
					{[220, 760, 1290, 1780].map((x, i) => (
						<Tree key={i} x={x - camX * 0.6} y={roadY + 4} s={1.5 + rand(i) * 0.6} grow={clamp(trees * 1.3 - i * 0.12)} seed={i * 7 + 2} dark={night} />
					))}
				</svg>
			)}
			{night > 0 && <AbsoluteFill style={{background: '#0a1430', opacity: night * 0.25, mixBlendMode: 'multiply'}} />}
		</AbsoluteFill>
	);
};

/** Kaybolma anı parıltı parçacıkları */
export const VanishParticles: React.FC<{at: number}> = ({at}) => {
	const f = useCurrentFrame();
	const t = f - at;
	if (t < 0 || t > 50) return null;
	return (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			{new Array(140).fill(0).map((_, i) => {
				const x = rand(i * 3.1) * W;
				const y0 = 700 + rand(i * 5.7) * 360;
				const y = y0 - t * (1 + rand(i) * 3);
				const o = (1 - lin(t, 0, 50)) * 0.8;
				return <circle key={i} cx={x + Math.sin(t / 6 + i) * 6} cy={y} r={1 + rand(i * 9) * 2.5} fill="#fff4dd" opacity={o} />;
			})}
		</svg>
	);
};

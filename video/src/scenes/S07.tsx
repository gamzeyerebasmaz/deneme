import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, mixColor, prog, rand} from '../lib/util';
import {BigText, FONT, MONO, Shot, Tag} from '../components/ui';
import {Street} from '../components/street';
import {GrassField, Skyline, Sky, Tree} from '../components/world';
import {Sfx} from './S01';
import {LiveStreet} from './S06';

export const Rain: React.FC<{amount?: number; angle?: number}> = ({amount = 1, angle = 12}) => {
	const f = useCurrentFrame();
	return (
		<svg width={W} height={H} style={{position: 'absolute'}}>
			{new Array(Math.round(220 * amount)).fill(0).map((_, i) => {
				const x = (rand(i * 3.1) * (W + 300) + f * 4) % (W + 300) - 150;
				const y = (rand(i * 7.3) * H + f * (38 + rand(i) * 14)) % (H + 100) - 50;
				return <line key={i} x1={x} y1={y} x2={x - angle} y2={y + 40} stroke="#cfdbe6" strokeWidth={1.4} opacity={0.35} />;
			})}
		</svg>
	);
};

const Attic: React.FC<{len: number; rotAt: number}> = ({len, rotAt}) => {
	const f = useCurrentFrame();
	const stain = prog(f, 10, len, (t) => t);
	const rot = prog(f, rotAt, len);
	return (
		<AbsoluteFill style={{background: '#1a1714'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{/* çatı kesiti */}
				<path d="M 160 520 L 960 120 L 1760 520 Z" fill="#2a221c" />
				<path d="M 120 540 L 960 100 L 1800 540" stroke="#5a2a20" strokeWidth={36} fill="none" />
				<path d="M 1040 160 L 1120 200" stroke="#1a1714" strokeWidth={40} />
				{/* kirişler */}
				{[440, 700, 960, 1220, 1480].map((x) => (
					<rect key={x} x={x - 14} y={Math.abs(x - 960) * 0.5 + 120} width={28} height={520 - Math.abs(x - 960) * 0.5 - 120 + 420} fill={mixColor('#7a5a3a', '#2e2216', x === 1220 ? rot : rot * 0.3)} />
				))}
				<rect x={160} y={520} width={1600} height={30} fill={mixColor('#7a5a3a', '#3a2a1c', rot * 0.6)} />
				{/* duvar */}
				<rect x={160} y={550} width={1600} height={530} fill="#cfc4ae" />
				<ellipse cx={1120} cy={560} rx={60 + stain * 260} ry={30 + stain * 380} fill="#7a6040" opacity={0.45} />
				<ellipse cx={1120} cy={560} rx={30 + stain * 160} ry={20 + stain * 240} fill="#5a4630" opacity={0.4} />
				{/* damla */}
				{[0, 1].map((k) => {
					const t = ((f + k * 20) % 40) / 40;
					return <ellipse key={k} cx={1100} cy={200 + t * 320} rx={5} ry={8} fill="#9fd3ff" opacity={0.8} />;
				})}
				{/* metal oluk paslanması */}
				<rect x={1600} y={480} width={200} height={26} fill={mixColor('#9aa0a6', '#8a4a22', stain)} />
				{new Array(10).fill(0).map((_, i) => (
					<circle key={i} cx={1610 + i * 19} cy={493} r={3 + rand(i) * 6 * stain} fill="#6b3416" opacity={stain} />
				))}
			</svg>
			<Rain amount={0.4} />
			<Tag x={1240} y={760} at={30} text={`NEM · %${Math.round(55 + stain * 40)}`} color="#9fe3ff" />
			<Tag x={360} y={760} at={rotAt} text="AHŞAP KİRİŞ · ÇÜRÜME" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const RootCrack: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const g = prog(f, 0, len, (t) => t);
	const crack = (k: number) =>
		new Array(10)
			.fill(0)
			.map((_, i) => {
				const x = 300 + i * 140;
				const y = 560 + Math.sin(i * 1.7 + k) * 40 + (rand(i + k) - 0.5) * 30;
				return `${i ? 'L' : 'M'}${x},${y}`;
			})
			.join(' ');
	return (
		<AbsoluteFill style={{background: '#5d5a55'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{new Array(400).fill(0).map((_, i) => (
					<circle key={i} cx={rand(i) * W} cy={rand(i * 3) * H} r={1 + rand(i * 5) * 4} fill={rand(i * 9) > 0.5 ? '#6a6660' : '#4f4c47'} />
				))}
				<path d={crack(0)} stroke="#1a1816" strokeWidth={6 + g * 40} fill="none" strokeLinejoin="round" />
				<path d={crack(0)} stroke="#3a2a1c" strokeWidth={g * 26} fill="none" strokeLinejoin="round" opacity={0.8} />
				{/* kök */}
				<path d={crack(0)} stroke="#7a5a36" strokeWidth={4 + g * 20} fill="none" strokeDasharray={1500} strokeDashoffset={1500 * (1 - g)} strokeLinecap="round" />
				{new Array(6).fill(0).map((_, i) => {
					const x = 400 + i * 220;
					return <path key={i} d={`M ${x} 560 q 20 ${60 + i * 10} ${-10} ${140 + i * 20}`} stroke="#6a4b2c" strokeWidth={3 + g * 8} fill="none" opacity={clamp(g * 2 - i * 0.2)} />;
				})}
				{new Array(8).fill(0).map((_, i) => {
					const x = 340 + i * 170;
					const gg = clamp(g * 1.6 - i * 0.08);
					return <path key={i} d={`M ${x} 560 q -20 -60 0 -${80 * gg + 10} q 30 30 0 ${80 * gg}`} fill="#5f8a3e" opacity={gg} />;
				})}
			</svg>
			<Tag x={110} y={160} at={20} text="KÖK BASINCI · ÇATLAK GENİŞLİYOR" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const Towers: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#5e7385" mid="#a9b2b5" bottom="#c9c2b0" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Skyline seed={131} baseY={1000} minH={200} maxH={480} color="#6c7782" windows={false} />
				{[560, 960, 1360].map((x, i) => {
					const h = [720, 880, 640][i];
					return (
						<g key={x}>
							<rect x={x - 130} y={1000 - h} width={260} height={h} fill={['#39424d', '#2c333c', '#434c57'][i]} />
							{new Array(Math.floor(h / 36)).fill(0).map((_, r) =>
								new Array(8).fill(0).map((_, c) => (
									<rect key={`${r}-${c}`} x={x - 118 + c * 30} y={1000 - h + 14 + r * 36} width={22} height={22} fill={rand(r * 9 + c + i * 100) < 0.12 ? '#06080a' : '#8a9bb0'} opacity={0.55} />
								))
							)}
							<path d={`M ${x - 130} ${1000 - h * 0.2} q 30 -60 0 -${h * 0.3}`} stroke="#3f6b2f" strokeWidth={14} fill="none" />
						</g>
					);
				})}
				<rect y={1000} width={W} height={100} fill="#3a3d35" />
			</svg>
			<GrassField y={1080} h={160} amount={0.8} density={150} seed={40} />
			<Tag x={110} y={160} at={20} text="ÇELİK ÇERÇEVE · BETONARME ÇEKİRDEK" color="#9fe3ff" />
			<Tag x={110} y={205} at={40} text="DURUM: AYAKTA" color="#53d18d" />
		</AbsoluteFill>
	);
};

const Highway: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#3e4a56" mid="#7d8790" bottom="#a3a9a8" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={540} width={W} height={600} fill="#4f5f3c" />
				<path d="M 900 540 L 1020 540 L 1800 1080 L 120 1080 Z" fill="#3a3d40" />
				{new Array(10).fill(0).map((_, i) => {
					const t = ((i / 10 + f / 400) % 1) ** 2;
					const y = 540 + t * 540;
					const w = 4 + t * 26;
					return <rect key={i} x={960 - w / 2} y={y} width={w} height={6 + t * 50} fill="#d8d2b8" opacity={0.5} />;
				})}
				{new Array(16).fill(0).map((_, i) => {
					const t = (i / 16) ** 1.6;
					const side = i % 2 ? 1 : -1;
					return <Tree key={i} x={960 + side * (90 + t * 900)} y={540 + t * 560} s={0.3 + t * 2.4} seed={i * 3} color="#2f5a2a" />;
				})}
			</svg>
			<GrassField y={1080} h={240} amount={0.8} density={120} seed={51} x0={0} x1={400} />
			<GrassField y={1080} h={240} amount={0.8} density={120} seed={52} x0={1520} x1={1920} />
			<Rain amount={1} />
		</AbsoluteFill>
	);
};

const Drip: React.FC<{len: number; textAt: number}> = ({len, textAt}) => {
	const f = useCurrentFrame();
	const period = 54;
	const t = (f % period) / period;
	const fall = t < 0.6 ? 0 : (t - 0.6) / 0.4;
	const hang = t < 0.6 ? t / 0.6 : 1;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%,#1a2026,#030405)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={0} y={0} width={W} height={180} fill="#3a3632" />
				<path d="M 900 180 L 940 170 L 980 182 L 1020 176" stroke="#1a1816" strokeWidth={4} fill="none" />
				{fall === 0 ? (
					<ellipse cx={960} cy={186 + hang * 14} rx={10 + hang * 4} ry={8 + hang * 12} fill="#9fd3ff" opacity={0.9} />
				) : (
					<ellipse cx={960} cy={200 + fall * fall * 620} rx={10} ry={16} fill="#9fd3ff" opacity={0.9} />
				)}
				<ellipse cx={960} cy={840} rx={240} ry={26} fill="#1d3a48" opacity={0.7} />
				{t < 0.2 && f > period &&
					[0, 1, 2].map((k) => <ellipse key={k} cx={960} cy={840} rx={30 + (t / 0.2) * 200 + k * 30} ry={4 + (t / 0.2) * 16} fill="none" stroke="#9fd3ff" strokeWidth={2} opacity={0.6 - (t / 0.2) * 0.5} />)}
				<path d="M 700 860 L 780 900 L 860 870 L 960 930 L 1080 880 L 1200 920" stroke="#0a0c0e" strokeWidth={4 + prog(f, 0, len) * 10} fill="none" />
			</svg>
			<BigText at={textAt} size={80} y={480} weight={300} spacing={0.06}>
				Küçük bir su sızıntısı.
			</BigText>
		</AbsoluteFill>
	);
};

export const S07: React.FC = () => {
	const {b, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(2)} zoom={[1, 1.08]}>
				<LiveStreet len={b(2)} from={{growth: 0.6, trees: 0.5, rust: 0.2, decay: 0}} to={{growth: 0.8, trees: 0.75, rust: 0.55, decay: 0.35}} base={{people: true, signal: false, seed: 3}} />
			</Shot>
			<Sfx at={0} src="wind" vol={0.3} len={b(2)} />
			<Shot from={b(2)} to={b(4)} zoom={[1, 1.1]}>
				<Attic len={b(4) - b(2)} rotAt={b(3) - b(2)} />
			</Shot>
			<Sfx at={b(2)} src="rain" vol={0.35} len={b(4) - b(2)} />
			<Shot from={b(4)} to={b(5)} zoom={[1.1, 1.0]}>
				<RootCrack len={b(5) - b(4)} />
			</Shot>
			<Sfx at={b(4) + 20} src="creak" vol={0.3} len={100} />
			<Shot from={b(5)} to={b(6)}>
				<Street afterVanish cars="parked" growth={0.85} trees={1} rust={0.6} decay={0.4} signal={false} seed={5} />
			</Shot>
			<Shot from={b(6)} to={b(8)} zoom={[1.05, 1]} pan={[0, -20, 0, 20]}>
				<Towers />
			</Shot>
			<Shot from={b(8)} to={b(10)}>
				<Highway />
			</Shot>
			<Sfx at={b(8)} src="rain" vol={0.45} len={b(10) - b(8)} />
			<Sfx at={b(8)} src="wind" vol={0.3} len={b(10) - b(8)} />
			<Shot from={b(10)} to={dur} zoom={[1, 1.06]}>
				<Drip len={dur - b(10)} textAt={b(12) - b(10)} />
			</Shot>
			{new Array(Math.floor((dur - b(10)) / 54)).fill(0).map((_, k) => (
				<Sfx key={k} at={b(10) + k * 54 + 54} src="drip" vol={0.45} len={30} />
			))}
		</AbsoluteFill>
	);
};

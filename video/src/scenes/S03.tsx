import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, prog, rand} from '../lib/util';
import {BigText, FONT, MONO, Shot, Tag} from '../components/ui';
import {FlatMap, Moon, Skyline, Sky, Stars} from '../components/world';
import {Sfx} from './S01';

const Pylon: React.FC<{x: number; y: number; s: number; c: string}> = ({x, y, s, c}) => (
	<g transform={`translate(${x},${y}) scale(${s})`} stroke={c} strokeWidth={4} fill="none">
		<path d="M -40 0 L -8 -300 L 8 -300 L 40 0 M -30 -80 L 30 -80 M -22 -160 L 22 -160 M -14 -230 L 14 -230 M -40 0 L 22 -160 M 40 0 L -22 -160 M -22 -160 L 14 -230 M 22 -160 L -14 -230" />
		<path d="M -70 -230 L 70 -230 M -60 -260 L 60 -260 M -8 -300 L 0 -330 L 8 -300" />
	</g>
);

const Towers: React.FC<{elec: number}> = ({elec}) => {
	const f = useCurrentFrame();
	const xs = [140, 620, 1100, 1580, 2060];
	return (
		<AbsoluteFill>
			<Sky top="#11182a" mid="#5a3a4a" bottom="#e07a45" />
			<AbsoluteFill style={{background: 'radial-gradient(circle at 70% 85%, rgba(255,160,80,0.6), transparent 40%)'}} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<path d={`M 0 860 Q 480 820 960 850 T 1920 840 L 1920 1080 L 0 1080 Z`} fill="#141015" />
				{xs.map((x, i) => (
					<Pylon key={i} x={x - (f * 0.6) % 480} y={880} s={1.5 - i * 0.05} c="#0b0a0e" />
				))}
				{[-345, -390].map((yy, k) =>
					xs.slice(0, 4).map((x, i) => {
						const x1 = x - (f * 0.6) % 480 + (k ? -95 : 95);
						const x2 = xs[i + 1] - (f * 0.6) % 480 + (k ? -95 : 95);
						return <path key={`${k}${i}`} d={`M ${x1} ${880 + yy} Q ${(x1 + x2) / 2} ${880 + yy + 60} ${x2} ${880 + yy}`} stroke="#0b0a0e" strokeWidth={2.5} fill="none" />;
					})
				)}
				{elec > 0 &&
					new Array(6).fill(0).map((_, i) => {
						const t = ((f * 6 + i * 80) % 480) / 480;
						const x = xs[0] - (f * 0.6) % 480 + 95 + t * 480 * 3;
						return <circle key={i} cx={x} cy={880 - 345 + Math.sin(t * Math.PI) * 50} r={5} fill="#9fe3ff" opacity={elec} />;
					})}
			</svg>
		</AbsoluteFill>
	);
};

const Balance: React.FC = () => {
	const f = useCurrentFrame();
	const gen = 0.62 + Math.sin(f / 22) * 0.06 + Math.sin(f / 7) * 0.015;
	const load = 0.62 + Math.sin(f / 22 + 0.4) * 0.06 + Math.sin(f / 9) * 0.015;
	const hz = 50 + (gen - load) * 4;
	const ang = (hz - 50) * 300;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0e1824,#04070b)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{new Array(40).fill(0).map((_, i) => (
					<line key={i} x1={0} x2={W} y1={i * 30} y2={i * 30} stroke="#0f1d2a" />
				))}
				{[{x: 380, v: gen, l: 'ÜRETİM', c: '#f0b44c'}, {x: 640, v: load, l: 'TÜKETİM', c: '#4fd1ff'}].map((b) => (
					<g key={b.l}>
						<rect x={b.x} y={260} width={150} height={560} fill="#0c141d" stroke="#1f2b38" />
						<rect x={b.x} y={260 + 560 * (1 - b.v)} width={150} height={560 * b.v} fill={b.c} opacity={0.85} />
						<text x={b.x + 75} y={870} fill="#cfd8e0" fontSize={26} textAnchor="middle" fontFamily="JetBrains Mono">
							{b.l}
						</text>
					</g>
				))}
				<g transform="translate(1340, 600)">
					<path d="M -300 0 A 300 300 0 0 1 300 0" stroke="#1f2b38" strokeWidth={30} fill="none" />
					<path d="M -60 -294 A 300 300 0 0 1 60 -294" stroke="#53d18d" strokeWidth={30} fill="none" />
					<line x1={0} y1={0} x2={Math.sin((ang * Math.PI) / 180) * 270} y2={-Math.cos((ang * Math.PI) / 180) * 270} stroke="#fff" strokeWidth={6} />
					<circle r={16} fill="#fff" />
					<text y={100} fill="#f3efe6" fontSize={80} textAnchor="middle" fontFamily="JetBrains Mono">
						{hz.toFixed(2)} Hz
					</text>
					<text y={150} fill="#7d8b99" fontSize={24} textAnchor="middle" fontFamily="JetBrains Mono" letterSpacing="4">
						ŞEBEKE FREKANSI
					</text>
				</g>
			</svg>
			<Tag x={380} y={180} at={10} text="DENGE = ÜRETİM ≈ TÜKETİM (HER SANİYE)" color="#9fe3ff" />
		</AbsoluteFill>
	);
};

const ControlRoom: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#0b1118,#05080b)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{new Array(5).fill(0).map((_, i) => (
					<g key={i}>
						<rect x={150 + i * 330} y={170} width={300} height={190} fill="#0e2233" stroke="#24405a" strokeWidth={4} />
						<path d={new Array(30).fill(0).map((_, k) => `${k ? 'L' : 'M'}${165 + i * 330 + k * 9.5},${270 + Math.sin(k / 3 + f / 10 + i) * 30 * (i === 2 ? 1 + lin(f, 40, 120) : 1)}`).join(' ')} stroke={i === 2 && f > 60 ? '#e2483d' : '#4fd1ff'} strokeWidth={3} fill="none" />
					</g>
				))}
				<rect x={100} y={640} width={W - 200} height={60} fill="#1a222b" />
				<rect x={100} y={700} width={W - 200} height={200} fill="#10161d" />
				{new Array(6).fill(0).map((_, i) => (
					<g key={i} transform={`translate(${260 + i * 280}, 860) rotate(${(rand(i) - 0.5) * 30})`}>
						<rect x={-50} y={-160} width={100} height={110} rx={14} fill="#1b1f25" />
						<rect x={-60} y={-60} width={120} height={22} rx={8} fill="#1b1f25" />
						<rect x={-5} y={-40} width={10} height={60} fill="#111" />
					</g>
				))}
				{new Array(10).fill(0).map((_, i) => (
					<circle key={i} cx={180 + i * 170} cy={668} r={7} fill={i === 4 ? '#e2483d' : '#53d18d'} opacity={i === 4 && f % 20 < 10 ? 0.2 : 1} />
				))}
			</svg>
			<Tag x={150} y={110} at={20} text="KONTROL MERKEZİ · OPERATÖR SAYISI: 0" color="#e2483d" />
		</AbsoluteFill>
	);
};

const GridCascade: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const nodes = React.useMemo(
		() =>
			new Array(46).fill(0).map((_, i) => ({
				x: 180 + rand(i * 3.3) * 1560,
				y: 200 + rand(i * 7.7) * 680,
				plant: i % 7 === 0,
			})),
		[]
	);
	const origin = nodes[11];
	const radius = prog(f, 20, len, (t) => t) * 1800;
	const edges: [number, number][] = [];
	nodes.forEach((a, i) => {
		const near = nodes
			.map((b, j) => ({j, d: Math.hypot(a.x - b.x, a.y - b.y)}))
			.filter((o) => o.j !== i)
			.sort((p, q) => p.d - q.d)
			.slice(0, 3);
		near.forEach((o) => i < o.j && edges.push([i, o.j]));
	});
	const dead = (n: {x: number; y: number}, k: number) => Math.hypot(n.x - origin.x, n.y - origin.y) + rand(k * 5) * 250 < radius && rand(k * 9.1) > 0.12;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0c1520,#030508)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{edges.map(([a, b2], k) => {
					const d = dead(nodes[a], a) || dead(nodes[b2], b2);
					return <line key={k} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b2].x} y2={nodes[b2].y} stroke={d ? '#3a1414' : '#2f7fa8'} strokeWidth={d ? 2 : 3} opacity={d ? 0.6 : 0.8} />;
				})}
				{nodes.map((n, k) => {
					const d = dead(n, k);
					return (
						<g key={k}>
							{!d && <circle cx={n.x} cy={n.y} r={n.plant ? 26 : 16} fill="#4fd1ff" opacity={0.15} />}
							<circle cx={n.x} cy={n.y} r={n.plant ? 12 : 7} fill={d ? '#e2483d' : n.plant ? '#f0b44c' : '#9fe3ff'} opacity={d ? 0.7 : 1} />
						</g>
					);
				})}
				<circle cx={origin.x} cy={origin.y} r={radius} fill="none" stroke="#e2483d" strokeWidth={2} opacity={0.25} />
			</svg>
			<Tag x={130} y={110} at={10} text="ARIZA → KORUMA RÖLESİ → YÜK KAYMASI → YENİ ARIZA" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const CityLightsOut: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const out = prog(f, 10, len, (t) => t);
	return (
		<AbsoluteFill>
			<Sky top="#02040a" mid="#0a1322" bottom="#141e30" />
			<Stars opacity={0.3 + out * 0.7} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Skyline seed={71} baseY={1080} minH={380} maxH={820} color="#070a10" night={1} lightsOut={out * 0.7} windows />
			</svg>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Skyline seed={72} baseY={1100} minH={200} maxH={520} color="#040609" night={1} lightsOut={out} scaleW={1.6} gap={14} />
			</svg>
			<AbsoluteFill style={{background: `linear-gradient(180deg, transparent 50%, rgba(255,170,80,${0.18 * (1 - out)}) 100%)`}} />
		</AbsoluteFill>
	);
};

const WorldNight: React.FC<{len: number; keepAt: number}> = ({len, keepAt}) => {
	const f = useCurrentFrame();
	const l = 1 - prog(f, 15, keepAt, (t) => t) * 0.78;
	return (
		<AbsoluteFill style={{background: '#020308'}}>
			<Stars count={120} opacity={0.5} maxY={1} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<FlatMap x={160} y={160} w={1600} lights={l} />
			</svg>
			<Tag x={210} y={110} at={10} text={`GECE IŞIKLARI · ${Math.round(l * 100)}%`} color="#ffc861" />
			<Tag x={1200} y={700} at={keepAt} text="HASTANE JENERATÖRÜ" color="#9fe3ff" />
			<Tag x={500} y={480} at={keepAt + 20} text="GÜNEŞ PANELİ + BATARYA" color="#9fe3ff" />
			<Tag x={1300} y={420} at={keepAt + 40} text="HİDROELEKTRİK · ADA ŞEBEKESİ" color="#9fe3ff" />
			{f > len + 1000 && null}
		</AbsoluteFill>
	);
};

const LastWindow: React.FC<{offAt: number}> = ({offAt}) => {
	const f = useCurrentFrame();
	const on = f < offAt ? 1 : f < offAt + 8 ? (f % 2 ? 0.2 : 1) : 0;
	return (
		<AbsoluteFill style={{background: '#04060a'}}>
			<Stars opacity={0.5} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={460} y={120} width={1000} height={1000} fill="#0b0f15" />
				{new Array(8).fill(0).map((_, r) =>
					new Array(6).fill(0).map((_, c) => {
						const me = r === 3 && c === 3;
						return (
							<g key={`${r}${c}`}>
								<rect x={520 + c * 160} y={170 + r * 120} width={110} height={80} fill={me ? '#ffcf73' : '#10161f'} opacity={me ? on : 1} />
								{me && on > 0 && <rect x={520 + c * 160 - 60} y={170 + r * 120 - 60} width={230} height={200} fill="#ffcf73" opacity={0.12 * on} />}
								{me && <rect x={520 + c * 160 + 60} y={170 + r * 120 + 14} width={30} height={66} fill="#3a2a1a" opacity={on * 0.6} />}
							</g>
						);
					})
				)}
			</svg>
		</AbsoluteFill>
	);
};

const MoonCity: React.FC = () => (
	<AbsoluteFill>
		<Sky top="#050a16" mid="#13213a" bottom="#1d2c47" />
		<Stars count={300} />
		<Moon x={1380} y={260} r={110} glow={1.3} />
		<svg width={W} height={H} style={{position: 'absolute'}}>
			<Skyline seed={81} baseY={1080} minH={300} maxH={700} color="#0c1424" night={0.6} lightsOut={1} />
		</svg>
		<AbsoluteFill style={{background: 'radial-gradient(circle at 72% 24%, rgba(190,210,255,0.18), transparent 50%)'}} />
	</AbsoluteFill>
);

export const S03: React.FC = () => {
	const {b, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(2)} zoom={[1, 1.1]}>
				<Towers elec={1} />
				<BigText at={b(1)} size={180} y={420} spacing={0.2} sub="Medeniyetin görünmez kahramanı">
					ELEKTRİK
				</BigText>
			</Shot>
			<Sfx at={0} src="hum" vol={0.3} len={b(2)} />
			<Shot from={b(2)} to={b(4)}>
				<Balance />
			</Shot>
			<Shot from={b(4)} to={b(5)} zoom={[1.05, 1.15]}>
				<ControlRoom />
			</Shot>
			<Shot from={b(5)} to={b(6)}>
				<GridCascade len={b(6) - b(5)} />
			</Shot>
			<Sfx at={b(5) + 60} src="powerdown" vol={0.5} len={100} />
			<Shot from={b(6)} to={b(7)} zoom={[1, 1.08]}>
				<CityLightsOut len={b(7) - b(6)} />
			</Shot>
			<Shot from={b(7)} to={b(10)} zoom={[1, 1.05]}>
				<WorldNight len={b(10) - b(7)} keepAt={b(9) - b(7)} />
			</Shot>
			<Shot from={b(10)} to={b(12)} zoom={[1, 1.12]}>
				<LastWindow offAt={b(11) - b(10) + 8} />
			</Shot>
			<Sfx at={b(11) + 6} src="powerdown" vol={0.6} len={100} />
			<Shot from={b(12)} to={dur} zoom={[1.08, 1]}>
				<MoonCity />
			</Shot>
		</AbsoluteFill>
	);
};

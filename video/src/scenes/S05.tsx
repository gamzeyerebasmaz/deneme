import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, prog, rand} from '../lib/util';
import {BigText, FONT, FactCard, MONO, Meter, Shot, Tag} from '../components/ui';
import {Skyline, Sky, Stars} from '../components/world';
import {Sfx} from './S01';

/** Kesit: sokak + metro tüneli; kamera aşağı iner */
const CrossSection: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const y = -prog(f, 10, len * 0.7) * 520;
	return (
		<AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
			<div style={{position: 'absolute', left: 0, top: y, width: W, height: H + 600}}>
				<Sky top="#5a6f86" mid="#9aa7b4" bottom="#c4c0b4" />
				<svg width={W} height={H + 600} style={{position: 'absolute'}}>
					<Skyline seed={91} baseY={560} minH={200} maxH={500} color="#2c3440" windows />
					<rect y={560} width={W} height={40} fill="#3b3e44" />
					<rect y={600} width={W} height={1100} fill="#4a3b2c" />
					{new Array(80).fill(0).map((_, i) => (
						<circle key={i} cx={rand(i) * W} cy={620 + rand(i * 3) * 1000} r={4 + rand(i * 5) * 14} fill="#3d3024" />
					))}
					<rect y={720} width={W} height={8} fill="#5e4a36" opacity={0.6} />
					{/* istasyon */}
					<rect x={200} y={900} width={1520} height={300} fill="#1b1f24" />
					<rect x={200} y={900} width={1520} height={300} fill="none" stroke="#5c5f63" strokeWidth={14} />
					<rect x={260} y={1090} width={1400} height={20} fill="#c9a227" />
					<rect x={200} y={1140} width={1520} height={8} fill="#777" />
					{new Array(6).fill(0).map((_, i) => (
						<rect key={i} x={300 + i * 240} y={930} width={60} height={14} fill="#f5f1e6" opacity={0.6} />
					))}
					<rect x={860} y={960} width={200} height={50} fill="#0d4d2f" />
					<text x={960} y={993} fill="#fff" fontSize={26} textAnchor="middle" fontFamily="Inter" fontWeight={700}>
						METRO
					</text>
					{/* merdiven */}
					<path d="M 1500 600 L 1640 900 L 1700 900 L 1560 600 Z" fill="#2a2e33" />
				</svg>
			</div>
			<Tag x={110} y={160} at={40} text="YERALTI · ŞEHRİN GÖRÜNMEYEN YARISI" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const Pumps: React.FC<{stopAt: number}> = ({stopAt}) => {
	const f = useCurrentFrame();
	const run = f < stopAt ? 1 : 1 - lin(f, stopAt, stopAt + 30);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0c1622,#02050a)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={0} y={260} width={W} height={4} fill="#3a556e" />
				<text x={100} y={240} fill="#7d8b99" fontSize={22} fontFamily="JetBrains Mono">
					YÜZEY
				</text>
				<rect x={0} y={760} width={W} height={260} fill="#2a2018" />
				<rect x={0} y={760} width={W} height={60} fill="#2f7fa8" opacity={0.6} />
				{[420, 960, 1500].map((x, i) => (
					<g key={x}>
						<path d={`M ${x} 780 L ${x} 270`} stroke="#2f4a63" strokeWidth={26} />
						<g transform={`translate(${x}, 700) rotate(${f * 12 * run})`}>
							<circle r={50} fill="#1a2633" stroke={run > 0.5 ? '#4fd1ff' : '#e2483d'} strokeWidth={6} />
							{[0, 1, 2, 3].map((k) => (
								<rect key={k} x={-4} y={-46} width={8} height={40} fill={run > 0.5 ? '#4fd1ff' : '#e2483d'} transform={`rotate(${k * 90})`} />
							))}
						</g>
						{new Array(6).fill(0).map((_, k) => {
							const t = ((f * 4 * run + k * 80) % 480) / 480;
							return <path key={k} d={`M ${x - 10} ${640 - t * 360} l 10 -16 l 10 16`} stroke="#9fe3ff" strokeWidth={4} fill="none" opacity={run * (1 - t)} />;
						})}
						<text x={x} y={860} fill={run > 0.5 ? '#53d18d' : '#e2483d'} fontSize={22} textAnchor="middle" fontFamily="JetBrains Mono">
							POMPA {i + 1} · {run > 0.5 ? 'ÇALIŞIYOR' : 'DURDU'}
						</text>
					</g>
				))}
			</svg>
			<FactCard at={20} out={stopAt + 400} x={1200} y={330} w={620} title="Gerçek · NYC metrosu" body="Normal bir günde yaklaşık 13 milyon galon (~49 milyon litre) su dışarı pompalanıyor." source="NY1 / MTA" />
		</AbsoluteFill>
	);
};

const FloodTunnel: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const lvl = prog(f, 0, len, (t) => t);
	const wy = 940 - lvl * 330;
	return (
		<AbsoluteFill style={{background: '#06080a'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<defs>
					<radialGradient id="tun" cx="50%" cy="45%" r="60%">
						<stop offset="0" stopColor="#1f2a30" />
						<stop offset="1" stopColor="#030405" />
					</radialGradient>
				</defs>
				<rect width={W} height={H} fill="url(#tun)" />
				<path d="M 160 1080 L 160 420 Q 960 -40 1760 420 L 1760 1080 Z" fill="#141a1e" />
				<path d="M 560 1080 L 600 520 Q 960 300 1320 520 L 1360 1080 Z" fill="#0a0e11" />
				<ellipse cx={960} cy={560} rx={120} ry={80} fill="#000" />
				{new Array(8).fill(0).map((_, i) => (
					<rect key={i} x={220 + i * 30} y={300 + i * 70} width={14} height={14} fill="#f0d488" opacity={0.25 * (1 - lvl * 0.6)} />
				))}
				{new Array(8).fill(0).map((_, i) => (
					<rect key={i} x={1680 - i * 30} y={300 + i * 70} width={14} height={14} fill="#f0d488" opacity={0.25 * (1 - lvl * 0.6)} />
				))}
				{/* raylar */}
				<path d="M 700 1080 L 930 620 M 1220 1080 L 990 620" stroke="#5d6166" strokeWidth={10} />
				{new Array(10).fill(0).map((_, i) => {
					const t = i / 10;
					const y = 1080 - t * 460;
					const half = 260 - t * 220;
					return <rect key={i} x={960 - half - 20} y={y} width={(half + 20) * 2} height={10 - t * 6} fill="#3a2e24" />;
				})}
				{/* su */}
				<rect x={0} y={wy} width={W} height={H - wy} fill="#0f2a33" opacity={0.92} />
				{new Array(16).fill(0).map((_, i) => (
					<ellipse key={i} cx={(i * 140 + f * 1.5) % W} cy={wy + 20 + (i % 4) * 30} rx={60} ry={2} fill="#6fb6c9" opacity={0.25} />
				))}
				{/* damlalar */}
				{[640, 1080, 1340].map((x, k) => {
					const t = ((f + k * 17) % 40) / 40;
					return <circle key={x} cx={x} cy={200 + k * 30 + t * (wy - 200 - k * 30)} r={4} fill="#9fe3ff" opacity={0.7} />;
				})}
			</svg>
			<Tag x={110} y={160} at={10} text={`SU SEVİYESİ · +${(lvl * 1.9).toFixed(2)} m`} color="#9fe3ff" />
		</AbsoluteFill>
	);
};

const Refinery: React.FC<{fireAt: number}> = ({fireAt}) => {
	const f = useCurrentFrame();
	const fire = lin(f, fireAt, fireAt + 60);
	return (
		<AbsoluteFill>
			<Sky top="#1a1a26" mid="#4a3a40" bottom="#9a6a4a" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={820} width={W} height={300} fill="#121214" />
				{[200, 360, 520].map((x, i) => (
					<g key={x}>
						<rect x={x} y={420 + i * 40} width={34} height={420 - i * 40} fill="#16161a" />
						<rect x={x - 10} y={500 + i * 40} width={54} height={10} fill="#16161a" />
						<rect x={x - 10} y={620 + i * 40} width={54} height={10} fill="#16161a" />
					</g>
				))}
				<path d="M 800 820 L 800 300 L 830 300 L 830 820 Z" fill="#16161a" />
				<path d={`M 815 300 q ${-10 + Math.sin(f / 4) * 8} -40 0 ${-70 - Math.sin(f / 3) * 10} q 14 30 0 70 Z`} fill="#ffa040" opacity={0.9} />
				{[1100, 1380, 1660].map((x, i) => (
					<g key={x}>
						<ellipse cx={x} cy={700} rx={120} ry={22} fill="#26262c" />
						<rect x={x - 120} y={700} width={240} height={120} fill="#1e1e23" />
						<ellipse cx={x} cy={700} rx={120} ry={22} fill="#2c2c33" />
					</g>
				))}
				{new Array(9).fill(0).map((_, i) => (
					<circle key={i} cx={200 + i * 190} cy={400 + (i % 3) * 60} r={5} fill="#e2483d" opacity={(f + i * 9) % 40 < 20 ? 1 : 0.15} />
				))}
				{/* uzak yangın ve buhar */}
				{fire > 0 &&
					new Array(18).fill(0).map((_, i) => {
						const t = (f - fireAt + i * 10) % 180;
						return <circle key={i} cx={1380 + Math.sin(i) * 30 + t * 0.5} cy={680 - t * 2.6} r={40 + t * 0.7} fill="#3a3436" opacity={fire * clamp(0.6 - t / 300)} />;
					})}
				{fire > 0 && <ellipse cx={1380} cy={690} rx={110} ry={40} fill="#ff8a3a" opacity={fire * (0.5 + 0.2 * Math.sin(f / 3))} />}
				{fire > 0 && <ellipse cx={1660} cy={830} rx={180 * fire} ry={20} fill="#a8b84a" opacity={0.35 * fire} />}
			</svg>
			<Tag x={110} y={160} at={20} text="BASINÇ KONTROLÜ · MANUEL MÜDAHALE GEREKLİ" color="#f0b44c" />
			<Tag x={110} y={205} at={fireAt} text="TANK 2 · SIZINTI" color="#e2483d" />
		</AbsoluteFill>
	);
};

const Reactor: React.FC<{rodsAt: number; backupAt: number; riskAt: number; len: number}> = ({rodsAt, backupAt, riskAt, len}) => {
	const f = useCurrentFrame();
	const rods = prog(f, rodsAt, rodsAt + 40);
	const glow = 1 - rods * 0.75;
	const backup = f >= backupAt;
	const fuel = backup ? clamp(1 - (f - backupAt) / (len - backupAt) * 1.1) : 1;
	const pumpRun = backup ? (f < riskAt ? 1 : clamp(fuel * 3)) : 1;
	const temp = 280 + (f > riskAt ? prog(f, riskAt, len, (t) => t) * 90 : 0);
	// artık ısı eğrisi
	const curve = new Array(60)
		.fill(0)
		.map((_, i) => {
			const x = i / 59;
			const y = 0.07 * Math.pow(x * 1000 + 1, -0.28);
			return `${i ? 'L' : 'M'}${1180 + x * 560},${820 - (y / 0.07) * 300}`;
		})
		.join(' ');
	const reveal = prog(f, rodsAt + 30, rodsAt + 90);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 35% 50%,#0d1822,#020407)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{/* kap */}
				<rect x={330} y={220} width={360} height={600} rx={160} fill="#16222d" stroke="#3a556e" strokeWidth={8} />
				{new Array(7).fill(0).map((_, i) => (
					<rect key={i} x={380 + i * 40} y={480} width={22} height={260} fill="#6fe0ff" opacity={0.25 + 0.6 * glow} />
				))}
				<rect x={360} y={460} width={300} height={300} fill="#6fe0ff" opacity={0.15 * glow} />
				{new Array(6).fill(0).map((_, i) => (
					<rect key={i} x={398 + i * 40} y={260 + rods * 220} width={14} height={260} fill="#c9ced4" />
				))}
				{/* soğutma döngüsü */}
				<path d="M 690 420 L 900 420 L 900 700 L 690 700" stroke="#2f7fa8" strokeWidth={22} fill="none" />
				{new Array(10).fill(0).map((_, k) => {
					const t = ((f * 3 * pumpRun + k * 76) % 760) / 760;
					const p = t < 0.28 ? [690 + t / 0.28 * 210, 420] : t < 0.64 ? [900, 420 + ((t - 0.28) / 0.36) * 280] : [900 - ((t - 0.64) / 0.36) * 210, 700];
					return <circle key={k} cx={p[0]} cy={p[1]} r={7} fill="#9fe3ff" opacity={pumpRun} />;
				})}
				<g transform={`translate(900, 560) rotate(${f * 10 * pumpRun})`}>
					<circle r={40} fill="#1a2633" stroke="#4fd1ff" strokeWidth={5} />
					<rect x={-3} y={-36} width={6} height={72} fill="#4fd1ff" />
					<rect x={-36} y={-3} width={72} height={6} fill="#4fd1ff" />
				</g>
				{/* yedek güç */}
				<g opacity={lin(f, backupAt, backupAt + 20)}>
					<rect x={720} y={800} width={180} height={110} rx={10} fill="#1a2633" stroke="#f0b44c" strokeWidth={4} />
					<text x={810} y={865} fill="#f0b44c" fontSize={22} textAnchor="middle" fontFamily="JetBrains Mono">
						DİZEL JEN.
					</text>
					<path d="M 810 800 L 810 600 L 860 600" stroke="#f0b44c" strokeWidth={4} strokeDasharray="10 8" fill="none" />
				</g>
				{/* eğri */}
				<g opacity={reveal}>
					<line x1={1180} y1={520} x2={1180} y2={820} stroke="#3a556e" strokeWidth={3} />
					<line x1={1180} y1={820} x2={1760} y2={820} stroke="#3a556e" strokeWidth={3} />
					<path d={curve} stroke="#f0b44c" strokeWidth={5} fill="none" strokeDasharray={1400} strokeDashoffset={1400 * (1 - reveal)} />
					<text x={1190} y={500} fill="#cfd8e0" fontSize={22} fontFamily="JetBrains Mono">
						ARTIK ISI (reaktör gücünün %'si)
					</text>
					<text x={1196} y={545} fill="#f0b44c" fontSize={20} fontFamily="JetBrains Mono">
						~%7
					</text>
					<text x={1340} y={790} fill="#f0b44c" fontSize={20} fontFamily="JetBrains Mono">
						~%1 · 1 saat
					</text>
					<text x={1560} y={800} fill="#f0b44c" fontSize={20} fontFamily="JetBrains Mono">
						~%0,5 · 1 gün
					</text>
					<text x={1600} y={860} fill="#7d8b99" fontSize={18} fontFamily="JetBrains Mono">
						zaman →
					</text>
				</g>
			</svg>
			<div style={{position: 'absolute', left: 1180, top: 170, width: 580, fontFamily: MONO, fontSize: 24, color: '#cfd8e0', lineHeight: 1.7}}>
				<div>
					ZİNCİRLEME REAKSİYON: <span style={{color: rods > 0.9 ? '#53d18d' : '#f0b44c'}}>{rods > 0.9 ? 'DURDU' : 'AKTİF'}</span>
				</div>
				<div>
					SOĞUTMA POMPASI: <span style={{color: pumpRun > 0.6 ? '#53d18d' : '#e2483d'}}>{pumpRun > 0.6 ? 'ÇALIŞIYOR' : 'ZAYIFLIYOR'}</span>
				</div>
				<div>
					SOĞUTUCU: <span style={{color: temp > 320 ? '#e2483d' : '#cfd8e0'}}>{Math.round(temp)}°C</span>
				</div>
				{backup && (
					<div style={{position: 'relative', height: 50, marginTop: 10}}>
						<Meter x={0} y={0} w={560} label="JENERATÖR YAKITI" value={fuel} color={fuel < 0.3 ? '#e2483d' : '#f0b44c'} />
					</div>
				)}
			</div>
			<Tag x={330} y={150} at={rodsAt} text="KONTROL ÇUBUKLARI · TAM İÇERİDE" color="#9fe3ff" />
		</AbsoluteFill>
	);
};

const PlantsGrid: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#04070b'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{new Array(20 * 9).fill(0).map((_, i) => {
					const c = i % 20;
					const r = Math.floor(i / 20);
					const risk = rand(i * 7.3) < 0.07;
					const o = lin(f, rand(i) * 30, rand(i) * 30 + 10);
					return (
						<g key={i} transform={`translate(${250 + c * 75}, ${250 + r * 70})`} opacity={o}>
							<path d="M -18 20 Q -12 0 -16 -20 L 16 -20 Q 12 0 18 20 Z" fill={risk ? '#f0b44c' : '#2a3a4a'} opacity={risk && f % 40 < 20 ? 0.5 : 1} />
						</g>
					);
				})}
			</svg>
			<div style={{position: 'absolute', left: 250, top: 150, fontFamily: MONO, fontSize: 22, color: '#9fb0c0', letterSpacing: '0.15em'}}>
				HER TESİS FARKLI · TASARIM · YEDEK GÜÇ · KOŞULLAR
			</div>
		</AbsoluteFill>
	);
};

export const S05: React.FC = () => {
	const {b, sb, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(2)}>
				<CrossSection len={b(2)} />
				<BigText at={b(1)} size={72} y={300} sub="New York · 472 istasyon" weight={700} out={b(2) + 12}>
					Metro tünelleri
				</BigText>
			</Shot>
			<Sfx at={0} src="rumble" vol={0.35} len={b(2)} />
			<Shot from={b(2)} to={b(4)}>
				<Pumps stopAt={b(3) - b(2) + 10} />
			</Shot>
			<Sfx at={b(3) + 10} src="powerdown" vol={0.5} len={100} />
			<Shot from={b(4)} to={b(6)} zoom={[1, 1.1]}>
				<FloodTunnel len={b(6) - b(4) + 20} />
			</Shot>
			<Sfx at={b(4)} src="water" vol={0.5} len={b(6) - b(4) + 10} />
			<Sfx at={b(4) + 40} src="drip" vol={0.4} len={30} />
			<Sfx at={b(5) + 10} src="drip" vol={0.4} len={30} />
			<Shot from={b(6)} to={b(9)} zoom={[1.05, 1]}>
				<Refinery fireAt={b(8) - b(6) + 20} />
			</Shot>
			<Sfx at={b(6) + 30} src="warn" vol={0.25} len={90} />
			<Shot from={b(9)} to={b(13)}>
				<Reactor rodsAt={sb(10, 0) - b(9)} backupAt={b(11) - b(9)} riskAt={b(12) - b(9)} len={b(13) - b(9)} />
			</Shot>
			<Sfx at={b(9)} src="hum" vol={0.2} len={b(13) - b(9)} />
			<Sfx at={b(12) + 30} src="warn" vol={0.3} len={90} />
			<Shot from={b(13)} to={dur}>
				<PlantsGrid />
			</Shot>
		</AbsoluteFill>
	);
};

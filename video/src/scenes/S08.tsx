import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, mixColor, prog, rand} from '../lib/util';
import {BigText, FONT, MONO, Shot, Tag} from '../components/ui';
import {Street} from '../components/street';
import {Deer, GrassField, Pine, Skyline, Sky, Tree} from '../components/world';
import {Sfx} from './S01';
import {Birds} from './S06';

const ForestCity: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Street afterVanish cars="parked" growth={1} trees={1} rust={0.85} decay={0.6} collapse={0.25} signal={false} people={false} seed={8} camX={f * 0.6} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{new Array(9).fill(0).map((_, i) => (
					<Pine key={i} x={(((i * 260 - f * 1.2) % (W + 300)) + W + 300) % (W + 300) - 150} y={1100} s={2.4 + rand(i) * 1.2} color="#142a18" />
				))}
			</svg>
		</AbsoluteFill>
	);
};

const Bridge: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const rust = 0.3 + prog(f, 0, len, (t) => t) * 0.7;
	const steel = mixColor('#5d6f80', '#8a4a22', rust);
	return (
		<AbsoluteFill>
			<Sky top="#6f8496" mid="#b5b8b0" bottom="#cfc6ae" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={760} width={W} height={400} fill="#3c5560" />
				{new Array(12).fill(0).map((_, i) => (
					<rect key={i} x={(i * 200 + f) % W} y={800 + (i % 4) * 50} width={120} height={3} fill="#9fc3cf" opacity={0.3} />
				))}
				<path d="M 0 760 L 0 640 Q 120 620 200 700 L 260 760 Z" fill="#3a4a2c" />
				<path d="M 1920 760 L 1920 640 Q 1800 620 1720 700 L 1660 760 Z" fill="#3a4a2c" />
				{/* kafes köprü */}
				<rect x={160} y={600} width={1600} height={22} fill={steel} />
				<rect x={160} y={440} width={1600} height={14} fill={steel} />
				{new Array(17).fill(0).map((_, i) => (
					<g key={i}>
						<line x1={160 + i * 100} y1={440} x2={160 + i * 100} y2={622} stroke={steel} strokeWidth={10} />
						{i < 16 && <line x1={160 + i * 100} y1={i % 2 ? 440 : 622} x2={260 + i * 100} y2={i % 2 ? 622 : 440} stroke={steel} strokeWidth={8} />}
					</g>
				))}
				{[560, 1360].map((x) => (
					<rect key={x} x={x - 40} y={622} width={80} height={200} fill="#8c8a84" />
				))}
				{new Array(30).fill(0).map((_, i) => {
					const t = ((f * 2 + i * 37) % 300) / 300;
					return <rect key={i} x={200 + rand(i) * 1500} y={610 + t * 200} width={4} height={4} fill="#8a4a22" opacity={rust * (1 - t)} />;
				})}
				<path d="M 0 760 Q 960 740 1920 760" stroke="#2c3e46" strokeWidth={4} fill="none" />
			</svg>
			<Tag x={110} y={160} at={20} text={`KOROZYON · ${Math.round(rust * 100)}%`} color="#f0b44c" />
		</AbsoluteFill>
	);
};

const FreezeThaw: React.FC = () => {
	const f = useCurrentFrame();
	const cyc = (f % 120) / 120;
	const frozen = cyc > 0.5;
	const w = 18 + Math.floor(f / 120) * 10 + (frozen ? prog(cyc, 0.5, 0.65) * 10 : 0);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#121a22,#04070b)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={460} y={300} width={1000} height={520} fill="#8c8a84" />
				{new Array(120).fill(0).map((_, i) => (
					<circle key={i} cx={470 + rand(i) * 980} cy={310 + rand(i * 3) * 500} r={2 + rand(i * 7) * 6} fill="#76746f" />
				))}
				<path d={`M ${960 - w / 2} 300 L ${960 - w / 4} 500 L ${960 - w / 6} 700 L 960 820 L ${960 + w / 6} 700 L ${960 + w / 4} 500 L ${960 + w / 2} 300 Z`} fill="#15181b" />
				<path d={`M ${960 - w / 2 + 3} 380 L ${960 - w / 4} 500 L ${960 - w / 6} 700 L 960 800 L ${960 + w / 6} 700 L ${960 + w / 4} 500 L ${960 + w / 2 - 3} 380 Z`} fill={frozen ? '#dff3ff' : '#3f8fb8'} opacity={0.9} />
				{frozen &&
					new Array(8).fill(0).map((_, i) => (
						<path key={i} d={`M ${960 + (i - 4) * 4} ${420 + i * 45} l 8 -8 m -8 0 l 8 8`} stroke="#fff" strokeWidth={2} />
					))}
				{frozen && (
					<>
						<path d={`M ${960 - w / 2 - 20} 450 l -60 0 m 10 -10 l -10 10 l 10 10`} stroke="#9fe3ff" strokeWidth={4} fill="none" />
						<path d={`M ${960 + w / 2 + 20} 450 l 60 0 m -10 -10 l 10 10 l -10 10`} stroke="#9fe3ff" strokeWidth={4} fill="none" />
					</>
				)}
			</svg>
			<div style={{position: 'absolute', left: 0, width: W, top: 170, textAlign: 'center', fontFamily: MONO, fontSize: 34, letterSpacing: '0.2em', color: frozen ? '#dff3ff' : '#4fb0e0'}}>
				{frozen ? 'DONMA · SU %9 GENLEŞİR' : 'ÇÖZÜLME · SU ÇATLAĞA DOLAR'}
			</div>
			<div style={{position: 'absolute', left: 0, width: W, top: 860, textAlign: 'center', fontFamily: MONO, fontSize: 24, color: '#9fb0c0'}}>
				DÖNGÜ #{Math.floor(f / 120) + 1}
			</div>
		</AbsoluteFill>
	);
};

const TwoFates: React.FC<{fallAt: number}> = ({fallAt}) => {
	const f = useCurrentFrame();
	const fall = prog(f, fallAt, fallAt + 50, (t) => t * t);
	const shake = f > fallAt && f < fallAt + 50 ? Math.sin(f * 3) * 4 : 0;
	return (
		<AbsoluteFill>
			<Sky top="#6a7d8c" mid="#b3b2a6" bottom="#cbbf9f" />
			<svg width={W} height={H} style={{position: 'absolute', transform: `translateX(${shake}px)`}}>
				<Skyline seed={141} baseY={900} minH={150} maxH={360} color="#7a838c" windows={false} growth={0.8} />
				<rect y={900} width={W} height={200} fill="#4a5a36" />
				{/* sol: çöken */}
				<g transform={`translate(560, ${900 + fall * 520}) `}>
					<rect x={-160} y={-620} width={320} height={620} fill="#5a5048" />
					{new Array(16).fill(0).map((_, r) =>
						new Array(6).fill(0).map((_, c) => <rect key={`${r}-${c}`} x={-140 + c * 50} y={-600 + r * 36} width={34} height={22} fill="#1a1612" opacity={0.7} />)
					)}
				</g>
				{fall > 0 &&
					new Array(20).fill(0).map((_, i) => {
						const t = f - fallAt + i * 2;
						return <circle key={i} cx={560 + (rand(i) - 0.5) * (200 + t * 6)} cy={880 - t * 2.2} r={40 + t * 1.6} fill="#a39b8c" opacity={clamp(0.7 - t / 160)} />;
					})}
				<rect x={360} y={900} width={400} height={200} fill="#4a5a36" />
				{/* sağ: ayakta */}
				<g transform="translate(1360, 900)">
					<rect x={-150} y={-700} width={300} height={700} fill="#4f5964" />
					{new Array(18).fill(0).map((_, r) =>
						new Array(6).fill(0).map((_, c) => <rect key={`${r}-${c}`} x={-130 + c * 46} y={-680 + r * 37} width={32} height={22} fill="#8a9bb0" opacity={rand(r * 7 + c) < 0.2 ? 0.1 : 0.5} />)
					)}
					<path d="M -150 -100 q 30 -80 0 -260" stroke="#3f6b2f" strokeWidth={18} fill="none" />
				</g>
			</svg>
			<GrassField y={1080} h={180} amount={1} density={160} seed={60} />
			<Tag x={360} y={160} at={fallAt} text="TUĞLA YIĞMA · 1920" color="#e2483d" />
			<Tag x={1220} y={160} at={fallAt + 40} text="BETONARME · 1998" color="#53d18d" />
		</AbsoluteFill>
	);
};

const Factors: React.FC = () => {
	const f = useCurrentFrame();
	const items = [
		['İKLİM', 'Don, nem, tuz, fırtına'],
		['MALZEME', 'Taş, çelik, beton, ahşap'],
		['YAŞ', 'Yorgunluk, eski standartlar'],
		['KONUM', 'Su kenarı, fay hattı, rüzgâr'],
	];
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#16130f,#050403)'}}>
			<div style={{position: 'absolute', left: 160, top: 260, display: 'grid', gridTemplateColumns: 'repeat(2, 780px)', gap: 40}}>
				{items.map(([t, d], i) => (
					<div key={t} style={{background: 'rgba(255,255,255,0.04)', borderLeft: '4px solid #d9a85b', padding: '30px 36px', opacity: lin(f, i * 18, i * 18 + 14), transform: `translateY(${(1 - prog(f, i * 18, i * 18 + 20)) * 30}px)`}}>
						<div style={{fontFamily: MONO, fontSize: 26, color: '#d9a85b', letterSpacing: '0.3em'}}>{t}</div>
						<div style={{fontFamily: FONT, fontSize: 40, color: '#efe8da', marginTop: 10}}>{d}</div>
					</div>
				))}
			</div>
			<div style={{position: 'absolute', top: 160, width: W, textAlign: 'center', fontFamily: FONT, fontSize: 40, fontWeight: 300, letterSpacing: '0.2em', color: '#cfc7b8'}}>HER BİNANIN KADERİ FARKLI</div>
		</AbsoluteFill>
	);
};

const WildHighway: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#7a98ad" mid="#d4d6c0" bottom="#e6d8b0" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={600} width={W} height={500} fill="#5d7a3a" />
				<path d="M 0 700 L 1920 640 L 1920 760 L 0 840 Z" fill="#55585a" />
				<path d="M 0 770 L 1920 700" stroke="#c9c2a0" strokeWidth={5} strokeDasharray="60 50" opacity={0.4} />
				{new Array(14).fill(0).map((_, i) => (
					<Tree key={i} x={i * 150 + 40} y={620 - i * 2} s={1.2 + rand(i) * 0.6} seed={i * 7} />
				))}
				{[0, 1, 2, 3, 4].map((i) => (
					<Deer key={i} x={-300 + (f / len) * 1600 + i * 170 - (i % 2) * 40} y={800 + (i % 3) * 40 - i * 4} s={0.9 + (i % 2) * 0.2} walk={f / 5 + i} antlers={i === 0} />
				))}
			</svg>
			<GrassField y={760} h={110} amount={1} density={160} seed={70} />
			<GrassField y={1080} h={200} amount={1} density={160} seed={71} />
			<Tag x={110} y={160} at={20} text="ESKİ OTOYOL · YABAN HAYATI KORİDORU" color="#9fe3ff" />
		</AbsoluteFill>
	);
};

const Legacy: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#4a5a6e" mid="#9a8f7c" bottom="#b9a27e" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={700} width={W} height={400} fill="#3e5a32" />
				<path d="M 0 860 Q 600 800 960 870 T 1920 840 L 1920 1080 L 0 1080 Z" fill="#41606a" />
				{new Array(40).fill(0).map((_, i) => (
					<rect key={i} x={rand(i) * W} y={880 + rand(i * 3) * 180} width={10 + rand(i * 5) * 24} height={6} rx={2} fill={['#e14b8a', '#4fd1ff', '#f2d24b', '#ffffff'][i % 4]} opacity={0.65} transform={`rotate(${rand(i * 7) * 180}, ${rand(i) * W}, ${880 + rand(i * 3) * 180})`} />
				))}
				{new Array(10).fill(0).map((_, i) => (
					<path key={i} d={`M ${100 + i * 180} 700 q ${30} -${120 + rand(i) * 80} ${80} -${40 + rand(i) * 120} q 40 60 60 ${150}`} fill="#6f9a2a" opacity={0.9} />
				))}
			</svg>
			<Tag x={110} y={160} at={20} text="MİKROPLASTİK · NEHİR YATAĞI" color="#e14b8a" />
			<Tag x={110} y={205} at={40} text="İSTİLACI TÜR · YAYILIYOR" color="#9fe36b" />
		</AbsoluteFill>
	);
};

export const S08: React.FC = () => {
	const {b, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(1)}>
				<ForestCity />
			</Shot>
			<Sfx at={0} src="birds" vol={0.3} len={b(1)} />
			<Shot from={b(1)} to={b(2)} zoom={[1, 1.06]}>
				<Bridge len={b(2) - b(1)} />
			</Shot>
			<Sfx at={b(1)} src="creak" vol={0.35} len={110} />
			<Shot from={b(2)} to={b(3)}>
				<FreezeThaw />
			</Shot>
			<Shot from={b(3)} to={b(5)}>
				<TwoFates fallAt={10} />
			</Shot>
			<Sfx at={b(3) + 6} src="creak" vol={0.5} len={100} />
			<Sfx at={b(3) + 18} src="rumble" vol={0.6} len={150} />
			<Shot from={b(5)} to={b(7)}>
				<Factors />
			</Shot>
			<Shot from={b(7)} to={b(9)}>
				<WildHighway len={b(9) - b(7)} />
			</Shot>
			<Sfx at={b(7)} src="birds" vol={0.3} len={b(9) - b(7)} />
			<Shot from={b(9)} to={b(11)} zoom={[1, 1.08]}>
				<Legacy />
			</Shot>
			<Shot from={b(11)} to={dur} zoom={[1.1, 1]}>
				<ForestCity />
				<Birds n={8} y={220} speed={3} />
				<BigText at={b(12) - b(11)} size={68} y={250} weight={300} spacing={0.08}>
					İnsanlığın mirası
				</BigText>
			</Shot>
			<Sfx at={b(11)} src="wind" vol={0.3} len={dur - b(11)} />
		</AbsoluteFill>
	);
};

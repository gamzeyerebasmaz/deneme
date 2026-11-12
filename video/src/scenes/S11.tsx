import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, prog, rand} from '../lib/util';
import {BigText, FONT, Flash, MONO, Shot} from '../components/ui';
import {Street, VanishParticles} from '../components/street';
import {Earth, Skyline, Sky, Stars, Tree} from '../components/world';
import {Sfx} from './S01';
import {LiveStreet} from './S06';

const Rewind: React.FC<{clockAt: number}> = ({clockAt}) => {
	const f = useCurrentFrame();
	const stops = ['+1000 YIL', '+500 YIL', '+50 YIL', '+10 YIL', '+1 YIL', '+30 GÜN', '+7 GÜN', '+24 SAAT', '+1 SAAT', '08:00'];
	const idx = Math.min(stops.length - 1, Math.floor((f / clockAt) * stops.length));
	const final = f >= clockAt;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#141a22,#000 75%)', alignItems: 'center', justifyContent: 'center'}}>
			{!final &&
				new Array(14).fill(0).map((_, i) => (
					<div key={i} style={{position: 'absolute', left: 0, width: W, top: ((i * 80 + f * 25) % H), height: 2, background: 'rgba(255,255,255,0.08)'}} />
				))}
			<div style={{fontFamily: MONO, fontSize: final ? 250 : 150, color: final ? '#ff5a4a' : '#e9e4d8', letterSpacing: '0.05em', textShadow: final ? '0 0 80px rgba(255,80,60,0.6)' : 'none'}}>
				{final ? '08:00' : stops[idx]}
			</div>
			{!final && <div style={{fontFamily: MONO, fontSize: 30, color: '#8c867a', letterSpacing: '0.5em', marginTop: 10}}>◀◀ GERİ SAR</div>}
		</AbsoluteFill>
	);
};

const RecapCity: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const out = prog(f, 0, len * 0.8, (t) => t);
	return (
		<AbsoluteFill>
			<Sky top="#02040a" mid="#0a1322" bottom="#141e30" />
			<Stars opacity={0.4 + out * 0.6} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Skyline seed={171} baseY={1080} minH={300} maxH={760} color="#070a10" night={1} lightsOut={out} />
			</svg>
		</AbsoluteFill>
	);
};

const SilentMachine: React.FC = () => (
	<AbsoluteFill style={{background: 'linear-gradient(180deg,#141a20,#07090b)'}}>
		<svg width={W} height={H} style={{position: 'absolute'}}>
			<rect x={0} y={740} width={W} height={36} fill="#2a2f35" />
			{new Array(6).fill(0).map((_, i) => (
				<rect key={i} x={120 + i * 300} y={670} width={110} height={70} fill="#6b5a40" opacity={0.6} />
			))}
			<g transform="translate(960, 980)">
				<rect x={-70} y={-40} width={140} height={40} fill="#7a5a2a" />
				<g transform="rotate(-50)">
					<rect x={-22} y={-300} width={44} height={300} rx={14} fill="#8a6a32" />
					<g transform="translate(0,-300) rotate(100)">
						<rect x={-16} y={-220} width={32} height={220} rx={12} fill="#8a6a32" />
					</g>
				</g>
			</g>
			<path d="M 900 300 L 1300 300" stroke="#2a3038" strokeWidth={2} />
			<path d="M 1100 300 l 0 80 q 30 40 0 80" stroke="#cfd8e0" strokeWidth={1} fill="none" opacity={0.4} />
		</svg>
	</AbsoluteFill>
);

const DeepTime: React.FC<{beforeAt: number; afterAt: number}> = ({beforeAt, afterAt}) => {
	const f = useCurrentFrame();
	const x0 = 160;
	const x1 = 1560;
	const eras: [number, string, string][] = [
		[0, '#4a2e3a', 'Oluşum'],
		[0.12, '#2e3a5a', 'İlk yaşam'],
		[0.4, '#2a4a5a', 'Oksijen'],
		[0.85, '#2f5a3a', 'Karmaşık yaşam'],
		[0.95, '#5a5a2a', 'Dinozorlar'],
		[0.985, '#6a4a2a', 'Memeliler'],
	];
	const reveal = prog(f, 0, 50);
	const zoom = prog(f, 60, 110);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0f1418,#030405)'}}>
			<div style={{position: 'absolute', top: 210, width: W, textAlign: 'center', fontFamily: FONT, fontSize: 40, color: '#cfc7b8', letterSpacing: '0.2em', fontWeight: 300}}>DÜNYANIN 4,5 MİLYAR YILI</div>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{eras.map(([s, c, l], i) => {
					const e = i + 1 < eras.length ? eras[i + 1][0] : 1;
					const a = x0 + s * (x1 - x0) * reveal;
					const b2 = x0 + e * (x1 - x0) * reveal;
					return (
						<g key={l}>
							<rect x={a} y={460} width={Math.max(0, b2 - a)} height={110} fill={c} />
							{reveal > 0.9 && e - s > 0.04 && (
								<text x={(a + b2) / 2} y={600} fill="#9f998c" fontSize={20} textAnchor="middle" fontFamily="JetBrains Mono">
									{l}
								</text>
							)}
						</g>
					);
				})}
				<rect x={x1 - 2} y={440} width={4 + zoom * 2} height={150} fill="#ff5a4a" opacity={reveal} />
				{/* büyüteç */}
				<g opacity={zoom}>
					<line x1={x1} y1={440} x2={1640} y2={330} stroke="#ff5a4a" strokeWidth={2} />
					<rect x={1580} y={200} width={260} height={130} fill="#120e0c" stroke="#ff5a4a" strokeWidth={3} />
					<text x={1710} y={250} fill="#ff5a4a" fontSize={26} textAnchor="middle" fontFamily="JetBrains Mono">
						HOMO SAPIENS
					</text>
					<text x={1710} y={292} fill="#f3efe6" fontSize={24} textAnchor="middle" fontFamily="JetBrains Mono">
						~300.000 yıl
					</text>
					<text x={1710} y={360} fill="#9f998c" fontSize={20} textAnchor="middle" fontFamily="JetBrains Mono">
						≈ %0,007
					</text>
				</g>
				{/* gelecek */}
				<g opacity={lin(f, afterAt, afterAt + 20)}>
					<line x1={x1 + 10} y1={515} x2={1880} y2={515} stroke="#9fe3ff" strokeWidth={4} strokeDasharray="10 12" />
					<text x={1760} y={700} fill="#9fe3ff" fontSize={22} textAnchor="middle" fontFamily="JetBrains Mono">
						bizden sonra →
					</text>
				</g>
				<g opacity={lin(f, beforeAt, beforeAt + 20) * (1 - lin(f, afterAt, afterAt + 20) * 0.6)}>
					<text x={x0} y={700} fill="#f0b44c" fontSize={22} fontFamily="JetBrains Mono">
						← bizden önce
					</text>
				</g>
			</svg>
		</AbsoluteFill>
	);
};

const Network: React.FC<{iconsAt: number; glowAt: number}> = ({iconsAt, glowAt}) => {
	const f = useCurrentFrame();
	const nodes = React.useMemo(() => new Array(150).fill(0).map((_, i) => ({x: 80 + rand(i * 3.3) * 1760, y: 180 + rand(i * 7.7) * 720})), []);
	const edges = React.useMemo(() => {
		const e: [number, number][] = [];
		nodes.forEach((a, i) => {
			nodes
				.map((b, j) => ({j, d: Math.hypot(a.x - b.x, a.y - b.y)}))
				.filter((o) => o.j > i)
				.sort((p, q) => p.d - q.d)
				.slice(0, 2)
				.forEach((o) => e.push([i, o.j]));
		});
		return e;
	}, [nodes]);
	const glow = lin(f, glowAt, glowAt + 40);
	const icons: [string, number, number][] = [
		['💧', 520, 520],
		['💡', 960, 420],
		['🌉', 1400, 560],
	];
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0f1620,#020305)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{edges.map(([a, b2], k) => {
					const o = lin(f, k * 0.25, k * 0.25 + 15);
					return <line key={k} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b2].x} y2={nodes[b2].y} stroke={glow > 0 ? '#ffcf73' : '#3a6f8f'} strokeWidth={1.5 + glow} opacity={o * (0.5 + glow * 0.4)} />;
				})}
				{nodes.map((n, k) => (
					<circle key={k} cx={n.x} cy={n.y} r={4 + glow * 2} fill={glow > 0 ? '#ffe0a0' : '#9fe3ff'} opacity={lin(f, k * 0.3, k * 0.3 + 10)} />
				))}
				{/* hareket eden "emek" parçacıkları */}
				{edges.slice(0, 120).map(([a, b2], k) => {
					const t = ((f * 2 + k * 13) % 100) / 100;
					return <circle key={k} cx={nodes[a].x + (nodes[b2].x - nodes[a].x) * t} cy={nodes[a].y + (nodes[b2].y - nodes[a].y) * t} r={2} fill="#fff" opacity={0.6} />;
				})}
			</svg>
			{icons.map(([ic, x, y], i) => (
				<div key={ic} style={{position: 'absolute', left: x - 70, top: y - 70, width: 140, height: 140, borderRadius: 70, background: 'rgba(10,14,20,0.85)', border: '3px solid #ffcf73', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 70, opacity: lin(f, iconsAt + i * 30, iconsAt + i * 30 + 12), transform: `scale(${0.7 + 0.3 * prog(f, iconsAt + i * 30, iconsAt + i * 30 + 15)})`, fontFamily: 'Noto Color Emoji'}}>
					{ic}
				</div>
			))}
			<div style={{position: 'absolute', top: 120, width: W, textAlign: 'center', fontFamily: FONT, fontSize: 40, fontWeight: 300, letterSpacing: '0.2em', color: '#cfc7b8', opacity: lin(f, 20, 40)}}>BAKIM · İŞBİRLİĞİ · BİLGİ</div>
		</AbsoluteFill>
	);
};

const SplitWorld: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 52% 0, 48% 100%, 0 100%)'}}>
				<Street people afterVanish={false} cars="flow" seed={6} />
			</div>
			<div style={{position: 'absolute', inset: 0, clipPath: 'polygon(52% 0, 100% 0, 100% 100%, 48% 100%)'}}>
				<Street afterVanish cars="parked" growth={1} trees={1} rust={0.9} decay={0.8} collapse={0.4} signal={false} people={false} seed={6} />
			</div>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<line x1={W * 0.52} y1={0} x2={W * 0.48} y2={H} stroke="#fff" strokeWidth={3} opacity={0.6} />
			</svg>
			<div style={{position: 'absolute', left: 120, top: 150, fontFamily: MONO, fontSize: 26, color: '#fff', letterSpacing: '0.3em', textShadow: '0 0 10px #000'}}>BUGÜN</div>
			<div style={{position: 'absolute', right: 120, top: 150, fontFamily: MONO, fontSize: 26, color: '#fff', letterSpacing: '0.3em', textShadow: '0 0 10px #000'}}>SONRASI</div>
			{f < 0 && <Tree x={0} y={0} />}
		</AbsoluteFill>
	);
};

const Visitor: React.FC<{q1: number; q2: number; ask: number}> = ({q1, q2, ask}) => {
	const f = useCurrentFrame();
	const sx = W + 100 - prog(f, 0, 160) * 820;
	const sy = 160 + prog(f, 0, 160) * 160;
	const card = (at: number, title: string, sub: string, x: number, color: string) => (
		<div style={{position: 'absolute', left: x, top: 640, width: 700, padding: '26px 30px', background: 'rgba(6,8,12,0.82)', borderTop: `4px solid ${color}`, opacity: lin(f, at, at + 14), transform: `translateY(${(1 - prog(f, at, at + 20)) * 30}px)`}}>
			<div style={{fontFamily: FONT, fontSize: 40, fontWeight: 800, color: '#f3efe6', letterSpacing: '0.04em'}}>{title}</div>
			<div style={{fontFamily: FONT, fontSize: 26, color: '#b9b2a4', marginTop: 8}}>{sub}</div>
		</div>
	);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Stars count={300} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Earth cx={W / 2} cy={H / 2 - 40} R={300} lon0={f * 0.15} lat0={20} night={0.3} />
				<circle cx={sx} cy={sy} r={40} fill="#9fe3ff" opacity={0.15} />
				<circle cx={sx} cy={sy} r={10} fill="#e6fbff" />
				<line x1={sx} y1={sy} x2={sx + 140} y2={sy - 30} stroke="#9fe3ff" strokeWidth={2} opacity={0.3} />
				{f > 160 && <path d={`M ${sx} ${sy} L ${W / 2 + 120} ${H / 2 - 160}`} stroke="#9fe3ff" strokeWidth={1.5} strokeDasharray="4 8" opacity={0.5} />}
			</svg>
			<div style={{position: 'absolute', top: 120, width: W, textAlign: 'center', fontFamily: FONT, fontSize: 52, fontWeight: 300, color: '#e9e4d8', opacity: lin(f, ask, ask + 15), letterSpacing: '0.06em'}}>Bizi nasıl tanımlardı?</div>
			{card(q1, 'Olağanüstü bir tür', 'Dünyayı değiştiren', 200, '#53d18d')}
			{card(q2, 'Çok geç fark eden bir tür', 'Gezegenini değiştirdiğini geç anlayan', 1020, '#e2483d')}
		</AbsoluteFill>
	);
};

const Comment: React.FC = () => {
	const f = useCurrentFrame();
	const text = 'Bizi nasıl tanımlardı? ';
	const n = Math.floor(lin(f, 15, 60) * text.length);
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#14181e,#030405)', alignItems: 'center', justifyContent: 'center'}}>
			<div style={{fontFamily: FONT, fontSize: 96, fontWeight: 800, color: '#f3efe6', letterSpacing: '0.02em'}}>Cevabını yorumlara yaz.</div>
			<div style={{marginTop: 50, width: 1000, padding: '26px 32px', background: '#1a1f26', borderRadius: 14, display: 'flex', gap: 24, alignItems: 'center'}}>
				<div style={{width: 64, height: 64, borderRadius: 32, background: '#d9a85b'}} />
				<div style={{fontFamily: FONT, fontSize: 34, color: '#cfd8e0'}}>
					{text.slice(0, n)}
					<span style={{opacity: f % 30 < 15 ? 1 : 0}}>|</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};

const PullAway: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const t = prog(f, 0, len, (x) => 1 - Math.pow(1 - x, 2));
	const R = 520 * Math.pow(0.012, t);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Stars count={420} opacity={0.4 + t * 0.6} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Earth cx={W / 2} cy={H / 2} R={Math.max(3, R)} lon0={60 + f * 0.1} lat0={15} />
				{R < 20 && <circle cx={W / 2} cy={H / 2} r={6} fill="#9fc6ff" opacity={0.9} />}
			</svg>
		</AbsoluteFill>
	);
};

const EndCard: React.FC = () => {
	const f = useCurrentFrame();
	const src = ['NRC.gov — reaktör kapanması, artık ısı, yedek güç', 'NY1 / MTA — NYC metrosunda günlük ~13 milyon galon pompalama', 'National Academies (NASEM) — emisyonların uzun vadeli etkileri', 'NASA Science — alçak yörüngede atmosferik sürüklenme'];
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0e1218,#000 80%)'}}>
			<Stars count={200} opacity={0.4} />
			<BigText at={0} size={86} y={330} spacing={0.06} sub="Bir düşünce deneyi">
				DÜNYADA SON İNSAN DA YOK OLURSA
			</BigText>
			<div style={{position: 'absolute', left: 0, width: W, top: 560, textAlign: 'center', fontFamily: FONT, fontSize: 32, color: '#d9a85b', letterSpacing: '0.25em', opacity: lin(f, 20, 40)}}>
				İNSANLIĞIN HİKÂYESİ HENÜZ BİTMEDİ
			</div>
			<div style={{position: 'absolute', left: 0, width: W, top: 680, textAlign: 'center', fontFamily: MONO, fontSize: 19, color: '#8c867a', lineHeight: 1.8, opacity: lin(f, 40, 60)}}>
				<div style={{color: '#b9b2a4', letterSpacing: '0.3em', marginBottom: 8}}>KAYNAKLAR</div>
				{src.map((s) => (
					<div key={s}>{s}</div>
				))}
				<div style={{marginTop: 12, color: '#6a645a'}}>Zaman durakları anlatı içindir; olaylar konuma, tasarıma ve koşullara bağlıdır.</div>
			</div>
		</AbsoluteFill>
	);
};

export const S11: React.FC = () => {
	const {b, e, dur} = useBeats();
	const endSpeech = e(24);
	const vanish = 40;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(2)}>
				<Rewind clockAt={b(1) - 6} />
			</Shot>
			<Shot from={b(2)} to={b(3)} fadeIn={6}>
				<Street people vanishAt={vanish} cars="coast" seed={4} />
				<VanishParticles at={vanish} />
				<Flash at={vanish} len={14} peak={0.8} />
			</Shot>
			<Sfx at={b(2) + vanish - 30} src="vanish" vol={0.45} len={30} />
			<Sfx at={b(2) + vanish} src="boom" vol={0.5} len={100} />
			<Shot from={b(3)} to={b(4)}>
				<RecapCity len={b(4) - b(3)} />
			</Shot>
			<Shot from={b(4)} to={b(5)}>
				<SilentMachine />
			</Shot>
			<Shot from={b(5)} to={b(6)}>
				<Street afterVanish cars="parked" people signal={false} seed={4} night={0.2} />
			</Shot>
			<Shot from={b(6)} to={b(7)}>
				<LiveStreet len={b(7) - b(6)} from={{growth: 0, trees: 0, rust: 0, decay: 0}} to={{growth: 1, trees: 1, rust: 0.8, decay: 0.6}} base={{people: true, signal: false, seed: 4}} />
			</Shot>
			<Shot from={b(7)} to={b(9)} zoom={[1, 1.1]}>
				<AbsoluteFill style={{background: '#000'}}>
					<Stars count={300} />
					<svg width={W} height={H} style={{position: 'absolute'}}>
						<Earth cx={W / 2} cy={H / 2 + 60} R={360} lon0={-60} lat0={10} />
					</svg>
				</AbsoluteFill>
				<BigText at={b(8) - b(7)} size={56} y={170} weight={300} spacing={0.06}>
					Dünya hiçbir zaman yalnızca bize ait değildi.
				</BigText>
			</Shot>
			<Shot from={b(9)} to={b(12)}>
				<DeepTime beforeAt={b(10) - b(9)} afterAt={b(11) - b(9)} />
			</Shot>
			<Shot from={b(12)} to={b(16)}>
				<Network iconsAt={b(14) - b(12)} glowAt={b(15) - b(12)} />
			</Shot>
			<Shot from={b(16)} to={b(18)}>
				<SplitWorld />
			</Shot>
			<Shot from={b(18)} to={b(22)}>
				<Visitor ask={b(19) - b(18)} q1={b(20) - b(18)} q2={b(21) - b(18)} />
			</Shot>
			<Shot from={b(22)} to={b(23)}>
				<Comment />
			</Shot>
			<Shot from={b(23)} to={endSpeech + 180} fadeOut={20}>
				<PullAway len={endSpeech + 180 - b(23)} />
			</Shot>
			<Shot from={endSpeech + 190} to={dur} fadeIn={30} fadeOut={20}>
				<EndCard />
			</Shot>
		</AbsoluteFill>
	);
};

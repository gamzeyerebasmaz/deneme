import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, lin, prog, rand} from '../lib/util';
import {BigText, FONT, Flash, Glitch, MONO, Shot} from '../components/ui';
import {Street, VanishParticles} from '../components/street';
import {Earth, Plane, Sky, Stars, Train} from '../components/world';

const Sfx: React.FC<{at: number; src: string; vol?: number; len?: number}> = ({at, src, vol = 0.6, len = 300}) => (
	<Sequence from={at} durationInFrames={len} layout="none">
		<Audio src={staticFile(`sfx/${src}.wav`)} volume={vol} />
	</Sequence>
);
export {Sfx};

const DigitalClock: React.FC<{start: number}> = ({start}) => {
	const f = useCurrentFrame();
	const sec = Math.min(60, 57 + Math.floor((f - start) / 30));
	const h = sec >= 60 ? '08' : '07';
	const m = sec >= 60 ? '00' : '59';
	const s = sec >= 60 ? '00' : String(sec).padStart(2, '0');
	const hit = sec >= 60;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, #10161f 0%, #030407 75%)', alignItems: 'center', justifyContent: 'center'}}>
			<div style={{fontFamily: MONO, fontSize: 250, fontWeight: 300, color: hit ? '#ff5a4a' : '#e9e4d8', letterSpacing: '0.05em', textShadow: hit ? '0 0 80px rgba(255,80,60,0.6)' : '0 0 40px rgba(255,255,255,0.15)'}}>
				{h}:{m}
				<span style={{fontSize: 120, opacity: 0.7}}>:{s}</span>
			</div>
			<div style={{fontFamily: FONT, fontSize: 30, letterSpacing: '0.5em', color: '#8c867a', marginTop: 10}}>SIRADAN BİR SABAH</div>
		</AbsoluteFill>
	);
};

const NoText: React.FC<{at: number[]; out: number}> = ({at, out}) => {
	const f = useCurrentFrame();
	const items = ['PATLAMA', 'SALGIN', 'SAVAŞ'];
	return (
		<div style={{position: 'absolute', left: 0, width: W, top: 200, display: 'flex', justifyContent: 'center', gap: 70, fontFamily: FONT}}>
			{items.map((t, i) => {
				const o = Math.min(lin(f, at[i], at[i] + 10), 1 - lin(f, out - 12, out));
				const strike = prog(f, at[i] + 8, at[i] + 22);
				return (
					<div key={t} style={{position: 'relative', fontSize: 74, fontWeight: 800, color: '#f2ede2', opacity: o, letterSpacing: '0.08em'}}>
						{t}
						<div style={{position: 'absolute', left: -10, top: '52%', height: 8, width: `${strike * 110}%`, background: '#e2483d'}} />
					</div>
				);
			})}
		</div>
	);
};

const Panel: React.FC<{x: number; y: number; w: number; h: number; at: number; label: string; children: React.ReactNode}> = ({x, y, w, h, at, label, children}) => {
	const f = useCurrentFrame();
	const o = lin(f, at, at + 12);
	const s = 1.08 - 0.08 * prog(f, at, at + 25);
	return (
		<div style={{position: 'absolute', left: x, top: y, width: w, height: h, overflow: 'hidden', opacity: o, outline: '2px solid rgba(255,255,255,0.12)'}}>
			<div style={{position: 'absolute', inset: 0, transform: `scale(${s})`}}>{children}</div>
			<div style={{position: 'absolute', left: 18, bottom: 14, fontFamily: MONO, fontSize: 20, color: '#f4efe4', letterSpacing: '0.2em', textShadow: '0 0 8px #000'}}>{label}</div>
		</div>
	);
};

export const PhoneRinging: React.FC<{w: number; h: number; text?: string; sub?: string}> = ({w, h, text = '08:00', sub = 'ALARM · İŞE GİT'}) => {
	const f = useCurrentFrame();
	const shake = Math.sin(f * 2.2) * (f % 40 < 24 ? 3 : 0);
	return (
		<svg width={w} height={h}>
			<rect width={w} height={h} fill="#3b3f45" />
			{new Array(30).fill(0).map((_, i) => (
				<rect key={i} x={rand(i) * w} y={rand(i * 3) * h} width={30 + rand(i * 7) * 80} height={2} fill="#2b2e33" />
			))}
			<g transform={`translate(${w / 2 + shake}, ${h / 2}) rotate(-12)`}>
				<rect x={-70} y={-130} width={140} height={260} rx={18} fill="#0c0d10" />
				<rect x={-62} y={-118} width={124} height={236} rx={10} fill="#1d3557" />
				<text x={0} y={-30} fill="#fff" fontSize={44} textAnchor="middle" fontFamily="JetBrains Mono">
					{text}
				</text>
				<text x={0} y={4} fill="#cfe3ff" fontSize={12} textAnchor="middle" fontFamily="Inter">
					{sub}
				</text>
				<circle cx={0} cy={70} r={22} fill="#e2483d" opacity={0.6 + 0.4 * Math.sin(f / 3)} />
			</g>
			{[1, 2, 3].map((k) => (
				<circle key={k} cx={w / 2} cy={h / 2} r={((f * 3 + k * 40) % 120) + 140} fill="none" stroke="#9fd3ff" strokeWidth={2} opacity={0.4 - ((f * 3 + k * 40) % 120) / 300} />
			))}
		</svg>
	);
};

const Coffee: React.FC<{w: number; h: number}> = ({w, h}) => {
	const f = useCurrentFrame();
	return (
		<svg width={w} height={h}>
			<rect width={w} height={h} fill="#2a1f19" />
			<rect x={w / 2 - 140} y={60} width={280} height={300} rx={14} fill="#1b1b1e" />
			<rect x={w / 2 - 110} y={90} width={220} height={60} rx={6} fill="#0c0c0e" />
			<text x={w / 2} y={128} fill="#53d18d" fontSize={22} textAnchor="middle" fontFamily="JetBrains Mono">
				ESPRESSO ▸ HAZIR
			</text>
			<rect x={w / 2 - 30} y={150} width={60} height={30} fill="#333" />
			{new Array(8).fill(0).map((_, i) => {
				const y = 185 + ((f * 6 + i * 14) % 90);
				return <rect key={i} x={w / 2 - 2} y={y} width={4} height={10} fill="#5b3418" />;
			})}
			<path d={`M ${w / 2 - 50} 280 L ${w / 2 + 50} 280 L ${w / 2 + 40} 360 L ${w / 2 - 40} 360 Z`} fill="#eee" />
			<rect x={w / 2 - 46} y={286} width={92} height={10} fill="#5b3418" />
			{[0, 1, 2].map((k) => (
				<path key={k} d={`M ${w / 2 - 20 + k * 20} 270 q 10 -20 0 -40 q -10 -20 0 -40`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.2 + 0.15 * Math.sin(f / 10 + k)} />
			))}
			<rect x={0} y={360} width={w} height={h - 360} fill="#3d2c22" />
		</svg>
	);
};

const SkyPlane: React.FC<{w: number; h: number}> = ({w, h}) => {
	const f = useCurrentFrame();
	return (
		<svg width={w} height={h}>
			<defs>
				<linearGradient id="skp" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor="#4d7fb3" />
					<stop offset="1" stopColor="#d9e8f2" />
				</linearGradient>
			</defs>
			<rect width={w} height={h} fill="url(#skp)" />
			{[0, 1, 2, 3].map((i) => (
				<ellipse key={i} cx={((i * 300 - f * 2) % (w + 300) + w + 300) % (w + 300) - 150} cy={260 + i * 30} rx={160} ry={34} fill="#fff" opacity={0.8} />
			))}
			<Plane x={w / 2 + Math.sin(f / 50) * 20} y={h / 2 - 20} scale={1.6} />
		</svg>
	);
};

const TrainPanel: React.FC<{w: number; h: number}> = ({w, h}) => {
	const f = useCurrentFrame();
	return (
		<svg width={w} height={h}>
			<rect width={w} height={h} fill="#c7b59a" />
			<rect y={h * 0.62} width={w} height={h} fill="#6d6458" />
			<rect y={h * 0.62 + 92} width={w} height={8} fill="#3b352d" />
			{new Array(20).fill(0).map((_, i) => (
				<rect key={i} x={((i * 60 - f * 12) % (w + 60) + w + 60) % (w + 60) - 30} y={h * 0.62 + 100} width={30} height={10} fill="#4a4137" />
			))}
			<Train x={w * 0.8} y={h * 0.62 + 90} cars={3} scale={0.95} />
		</svg>
	);
};

export const S01: React.FC = () => {
	const {b, sb, dur} = useBeats();
	const f = useCurrentFrame();
	const v1 = 78;
	const cVan = b(3) - b(1);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{/* A: kanca — kalabalık kavşak, herkes kaybolur */}
			<Shot from={0} to={b(0) - 6} fadeIn={0} fadeOut={10} zoom={[1.0, 1.12]}>
				<Street people vanishAt={v1} cars="coast" />
				<VanishParticles at={v1} />
				<Flash at={v1} len={18} />
				<Glitch at={v1 - 4} len={10} />
			</Shot>
			<Sfx at={0} src="city" vol={0.75} len={v1} />
			<Sfx at={v1 - 42} src="vanish" vol={0.7} len={42} />
			<Sfx at={v1} src="boom" vol={0.9} len={120} />
			{/* mutlak sessizlik: v1+2 sn sonra uğultu (müzik 165'te başlar) */}

			{/* B: saat */}
			<Shot from={b(0) - 6} to={b(1)} fadeIn={6} zoom={[1.06, 1]}>
				<DigitalClock start={0} />
			</Shot>
			{[0, 30, 60].map((k) => (
				<Sfx key={k} at={b(0) - 6 + k} src="tick" vol={0.6} len={10} />
			))}

			{/* C: trafik → kaybolma → yokluk */}
			<Shot from={b(1)} to={b(6)} zoom={[1.15, 1.0]} pan={[0, 30, 0, 0]}>
				<Street people vanishAt={cVan} cars="coast" seed={4} />
				<VanishParticles at={cVan} />
				<Flash at={cVan} len={14} peak={0.85} />
				<Glitch at={cVan - 3} len={8} />
				<NoText at={[sb(4, 0) - b(1), sb(4, 0) - b(1) + 22, sb(4, 0) - b(1) + 44]} out={b(5) - b(1)} />
				<BigText at={b(5) - b(1)} size={86} y={240}>
					Sadece insanlar kayboluyor.
				</BigText>
			</Shot>
			<Sfx at={b(1)} src="city" vol={0.5} len={cVan} />
			<Sfx at={b(3) - 40} src="vanish" vol={0.55} len={40} />
			<Sfx at={b(3)} src="boom" vol={0.7} len={120} />

			{/* D: 4'lü montaj */}
			<Shot from={b(6)} to={b(7)}>
				<AbsoluteFill style={{background: '#050608'}}>
					<Panel x={70} y={70} w={880} h={455} at={sb(6, 0) - b(6)} label="UÇAKLAR · HÂLÂ HAVADA">
						<SkyPlane w={880} h={455} />
					</Panel>
					<Panel x={970} y={70} w={880} h={455} at={sb(6, 1) - b(6)} label="TRENLER · HAREKET HALİNDE">
						<TrainPanel w={880} h={455} />
					</Panel>
					<Panel x={70} y={545} w={880} h={455} at={sb(6, 2) - b(6)} label="TELEFONLAR · ÇALIYOR">
						<PhoneRinging w={880} h={455} />
					</Panel>
					<Panel x={970} y={545} w={880} h={455} at={sb(6, 3) - b(6)} label="KAHVE MAKİNELERİ · ÇALIŞIYOR">
						<Coffee w={880} h={455} />
					</Panel>
				</AbsoluteFill>
			</Shot>
			<Sfx at={sb(6, 2)} src="alarm" vol={0.25} len={90} />

			{/* E: boş sokak */}
			<Shot from={b(7)} to={b(8)} zoom={[1.0, 1.08]} pan={[40, 0, -40, 0]}>
				<Street people afterVanish cars="parked" seed={4} />
				<AbsoluteFill style={{background: 'rgba(10,20,35,0.25)'}} />
			</Shot>

			{/* F: Dünya ve sorular */}
			<Shot from={b(8)} to={b(10)} zoom={[0.9, 1.1]}>
				<SpaceEarth questions={[sb(9, 0) - b(8), sb(9, 1) - b(8), sb(9, 2) - b(8)]} />
			</Shot>

			{/* G: başlık */}
			<Shot from={b(10)} to={dur} fadeOut={14}>
				<TitleCard />
			</Shot>
			<Sfx at={b(10)} src="boom" vol={0.6} len={120} />
			{new Array(Math.max(0, Math.floor((dur - b(10)) / 30))).fill(0).map((_, k) => (
				<Sfx key={k} at={b(10) + 20 + k * 30} src="tick" vol={0.45} len={8} />
			))}
			{f < 0 && <Sky top="#000" mid="#000" bottom="#000" />}
		</AbsoluteFill>
	);
};

const SpaceEarth: React.FC<{questions: number[]}> = ({questions}) => {
	const f = useCurrentFrame();
	const qs = ['24 SAAT?', '1 YIL?', '1000 YIL?'];
	return (
		<AbsoluteFill style={{background: '#010206'}}>
			<Stars count={300} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Earth cx={W / 2} cy={H / 2 + 40} R={380} lon0={20 + f * 0.12} lat0={20} />
			</svg>
			<div style={{position: 'absolute', top: 140, width: W, textAlign: 'center', fontFamily: FONT, fontSize: 58, fontWeight: 300, color: '#e9e4d8', letterSpacing: '0.1em', opacity: lin(f, 5, 25)}}>
				Biz olmadan Dünya ne kadar dayanabilir?
			</div>
			<div style={{position: 'absolute', bottom: 210, width: W, display: 'flex', justifyContent: 'center', gap: 120}}>
				{qs.map((q, i) => (
					<div key={q} style={{fontFamily: MONO, fontSize: 54, color: '#d9a85b', opacity: lin(f, questions[i], questions[i] + 12), letterSpacing: '0.1em'}}>
						{q}
					</div>
				))}
			</div>
		</AbsoluteFill>
	);
};

const TitleCard: React.FC = () => {
	const f = useCurrentFrame();
	const a = (f / 30) * 6;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, #141a22 0%, #000 70%)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<circle cx={W / 2} cy={H / 2} r={420} fill="none" stroke="#3a352c" strokeWidth={2} />
				{new Array(60).fill(0).map((_, i) => {
					const an = (i / 60) * Math.PI * 2;
					const r1 = i % 5 === 0 ? 390 : 405;
					return <line key={i} x1={W / 2 + Math.cos(an) * r1} y1={H / 2 + Math.sin(an) * r1} x2={W / 2 + Math.cos(an) * 418} y2={H / 2 + Math.sin(an) * 418} stroke="#5b5446" strokeWidth={i % 5 === 0 ? 4 : 2} />;
				})}
				<line x1={W / 2} y1={H / 2} x2={W / 2 + Math.sin((Math.floor(a / 6) * 6 * Math.PI) / 180) * 380} y2={H / 2 - Math.cos((Math.floor(a / 6) * 6 * Math.PI) / 180) * 380} stroke="#e2483d" strokeWidth={3} opacity={0.8} />
			</svg>
			<BigText at={8} size={104} y={H / 2 - 30} sub="Bir düşünce deneyi" spacing={0.06}>
				DÜNYADA SON İNSAN
				<br />
				DA YOK OLURSA
			</BigText>
			<div style={{position: 'absolute', bottom: 120, width: W, textAlign: 'center', fontFamily: MONO, fontSize: 26, color: '#e2483d', letterSpacing: '0.4em', opacity: lin(f, 30, 45)}}>
				SAAT İŞLEMEYE BAŞLADI
			</div>
		</AbsoluteFill>
	);
};

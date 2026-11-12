import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, prog, rand} from '../lib/util';
import {BigText, FONT, MONO, Meter, Shot, Tag} from '../components/ui';
import {Street} from '../components/street';
import {Plane, Skyline, Sky, Stars, Train} from '../components/world';
import {PhoneRinging, Sfx} from './S01';

const TrafficLightClose: React.FC = () => {
	const f = useCurrentFrame();
	const phase = Math.floor(f / 45) % 3;
	return (
		<AbsoluteFill>
			<div style={{position: 'absolute', inset: 0, filter: 'blur(6px)', transform: 'scale(1.1)'}}>
				<Street people afterVanish cars="parked" signal={false} seed={9} />
			</div>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={680} y={560} width={34} height={600} fill="#1d2127" />
				<rect x={590} y={130} width={214} height={470} rx={26} fill="#121418" />
				{['#ff3b30', '#ffcc00', '#34c759'].map((c, i) => {
					const on = phase === i;
					return (
						<g key={c}>
							{on && <circle cx={697} cy={210 + i * 150} r={110} fill={c} opacity={0.18} />}
							<circle cx={697} cy={210 + i * 150} r={62} fill={c} opacity={on ? 1 : 0.12} />
						</g>
					);
				})}
			</svg>
			<Tag x={900} y={300} at={15} text="SİNYAL DÖNGÜSÜ: OTOMATİK" />
			<Tag x={900} y={345} at={30} text="BEKLEYEN ARAÇ: 0  ·  YAYA: 0" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const Factory: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#1b232c,#0d1116)'}}>
			<svg width={W} height={H}>
				{new Array(8).fill(0).map((_, i) => (
					<rect key={i} x={i * 260} y={0} width={14} height={H} fill="#151b22" />
				))}
				{new Array(6).fill(0).map((_, i) => (
					<rect key={i} x={i * 340 + 60} y={60} width={200} height={80} fill="#f5d9a0" opacity={0.08} />
				))}
				<rect x={0} y={740} width={W} height={36} fill="#3a4049" />
				{new Array(30).fill(0).map((_, i) => (
					<circle key={i} cx={((i * 70 + f * 4) % (W + 70)) - 35} cy={758} r={12} fill="#22272e" />
				))}
				{new Array(8).fill(0).map((_, i) => {
					const x = ((i * 280 + f * 4) % (W + 280)) - 140;
					return <rect key={i} x={x} y={670} width={110} height={70} fill="#b48a55" stroke="#8a6638" strokeWidth={3} />;
				})}
				{[560, 1260].map((bx, k) => {
					const a1 = -40 + Math.sin(f / 18 + k * 2) * 35;
					const a2 = 70 + Math.sin(f / 18 + k * 2 + 1) * 30;
					return (
						<g key={bx} transform={`translate(${bx}, 980)`}>
							<rect x={-70} y={-40} width={140} height={40} fill="#e8a33d" />
							<g transform={`rotate(${a1})`}>
								<rect x={-22} y={-300} width={44} height={300} rx={14} fill="#f2b443" />
								<circle r={30} fill="#333" />
								<g transform={`translate(0,-300) rotate(${a2})`}>
									<circle r={24} fill="#333" />
									<rect x={-16} y={-220} width={32} height={220} rx={12} fill="#f2b443" />
									<path d="M -26 -230 L 26 -230 L 18 -260 L -18 -260 Z" fill="#555" />
									<circle cx={0} cy={-262} r={8} fill="#4fd1ff" opacity={f % 20 < 10 ? 1 : 0.3} />
								</g>
							</g>
						</g>
					);
				})}
			</svg>
			<Tag x={110} y={180} at={10} text="HAT 3 · ÜRETİM SÜRÜYOR" color="#4fd1ff" />
			<Tag x={110} y={225} at={25} text="OPERATÖR: —" color="#e2483d" />
		</AbsoluteFill>
	);
};

const TrainStop: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const t = clamp(f / len);
	const x = 400 + 1500 * (1 - Math.pow(1 - t, 2.2));
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#a7bed1,#e6d2b5)'}}>
			<svg width={W} height={H}>
				<Skyline seed={51} baseY={700} minH={80} maxH={260} color="#8d9aa8" windows={false} />
				<rect y={700} width={W} height={400} fill="#5d564c" />
				<rect y={808} width={W} height={10} fill="#2f2b26" />
				{new Array(40).fill(0).map((_, i) => (
					<rect key={i} x={i * 50} y={818} width={26} height={12} fill="#3b352d" />
				))}
				<Train x={x} y={808} cars={5} scale={1.1} />
			</svg>
			<Tag x={110} y={180} at={Math.round(len * 0.4)} text="ATS · OTOMATİK FREN DEVREDE" color="#f0b44c" />
		</AbsoluteFill>
	);
};

/** Kuşbakışı kavşak: kontrolsüz araçlar */
const TopDownCrash: React.FC<{crashAt: number}> = ({crashAt}) => {
	const f = useCurrentFrame();
	const CarTop: React.FC<{x: number; y: number; r: number; c: string}> = ({x, y, r, c}) => (
		<g transform={`translate(${x},${y}) rotate(${r})`}>
			<rect x={-55} y={-26} width={110} height={52} rx={12} fill={c} />
			<rect x={-20} y={-21} width={40} height={42} rx={6} fill="#1d2833" opacity={0.8} />
			<rect x={50} y={-20} width={6} height={10} fill="#fff6c8" />
			<rect x={50} y={10} width={6} height={10} fill="#fff6c8" />
		</g>
	);
	// A: soldan sağa, B: aşağıdan yukarı → merkezde çarpışma
	const ta = Math.min(f, crashAt);
	const ax = -200 + ta * ((W / 2 + 200 - 60) / crashAt);
	const ay = H / 2 - 50;
	const bx = W / 2 + 60;
	const by = H + 200 - ta * ((H / 2 + 200 + 10) / crashAt);
	const after = Math.max(0, f - crashAt);
	const spin = Math.min(after, 40);
	// C: yoldan çıkar
	const cy = H / 2 + 60;
	const cx = W + 200 - f * 8;
	const drift = clamp((f - 30) / 70);
	return (
		<AbsoluteFill style={{background: '#4a5a3d'}}>
			<svg width={W} height={H}>
				{new Array(60).fill(0).map((_, i) => (
					<circle key={i} cx={rand(i) * W} cy={rand(i * 3) * H} r={30 + rand(i * 7) * 60} fill="#3f5034" />
				))}
				<rect x={0} y={H / 2 - 130} width={W} height={260} fill="#2e3136" />
				<rect x={W / 2 - 130} y={0} width={260} height={H} fill="#2e3136" />
				{new Array(24).fill(0).map((_, i) => (
					<rect key={i} x={i * 90} y={H / 2 - 3} width={50} height={6} fill="#e8e2c8" opacity={Math.abs(i * 90 - W / 2) < 150 ? 0 : 0.8} />
				))}
				{new Array(14).fill(0).map((_, i) => (
					<rect key={i} x={W / 2 - 3} y={i * 90} width={6} height={50} fill="#e8e2c8" opacity={Math.abs(i * 90 - H / 2) < 150 ? 0 : 0.8} />
				))}
				{new Array(8).fill(0).map((_, i) => (
					<rect key={i} x={W / 2 - 120 + i * 30} y={H / 2 - 190} width={18} height={50} fill="#e8e2c8" opacity={0.7} />
				))}
				<CarTop x={cx - drift * 40} y={cy + drift * 260} r={-180 - drift * 25} c="#2f5d8a" />
				<CarTop x={ax + spin * 2} y={ay - spin * 1.5} r={spin * 2.5} c="#b23a2e" />
				<CarTop x={bx + spin * 1.2} y={by + spin * 0.5} r={-90 - spin * 1.8} c="#d8d8d8" />
				{after > 0 &&
					new Array(16).fill(0).map((_, i) => {
						const t = after + i * 3;
						return (
							<circle
								key={i}
								cx={W / 2 + 10 + Math.sin(i * 2) * (20 + t * 0.8)}
								cy={H / 2 - 40 - t * 1.2}
								r={20 + t * 0.9}
								fill="#8a8d92"
								opacity={clamp(0.5 - t / 160)}
							/>
						);
					})}
				{after > 0 && after < 10 && <circle cx={W / 2} cy={H / 2 - 30} r={80 + after * 15} fill="#fff5d0" opacity={0.5 - after * 0.05} />}
			</svg>
			<Tag x={110} y={180} at={10} text="SÜRÜCÜ ALGILANMADI" color="#e2483d" />
		</AbsoluteFill>
	);
};

const Cockpit: React.FC<{fallAt: number; len: number}> = ({fallAt, len}) => {
	const f = useCurrentFrame();
	const fuel = clamp(0.62 - f / (len * 1.15));
	const fall = clamp((f - fallAt) / (len - fallAt));
	const py = 470 + fall * fall * 520;
	const rot = fall * 14;
	return (
		<AbsoluteFill>
			<Sky top="#0f1d38" mid="#cf7a4a" bottom="#f2b27a" />
			<Stars opacity={0.4} count={100} maxY={0.3} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{new Array(10).fill(0).map((_, i) => (
					<ellipse key={i} cx={((i * 260 - f * 3) % (W + 400) + W + 400) % (W + 400) - 200} cy={760 + (i % 3) * 40} rx={260} ry={46} fill="#f3d2b1" opacity={0.55} />
				))}
				<rect y={800} width={W} height={300} fill="#e8c4a2" opacity={0.7} />
				<Plane x={W / 2 + 80 + fall * 300} y={py} scale={2.2} rot={rot} color="#e4e8ee" />
			</svg>
			<div style={{position: 'absolute', right: 120, top: 150, width: 460, fontFamily: MONO, color: '#9fe3ff'}}>
				<div style={{fontSize: 22, letterSpacing: '0.15em', opacity: f % 40 < 30 ? 1 : 0.5}}>A/P · OTOPİLOT AÇIK</div>
				<div style={{fontSize: 22, letterSpacing: '0.15em', marginTop: 8}}>ALT FL370 · HDG 084</div>
				<div style={{fontSize: 22, letterSpacing: '0.15em', marginTop: 8, color: '#e2483d', opacity: lin(f, 20, 30)}}>PİLOT YANITI: YOK</div>
				<div style={{marginTop: 30}}>
					<Meter x={0} y={0} w={460} label="YAKIT" value={fuel} color={fuel < 0.25 ? '#e2483d' : '#f0b44c'} />
				</div>
			</div>
		</AbsoluteFill>
	);
};

const DeviceWall: React.FC = () => {
	const f = useCurrentFrame();
	const labels = ['ATM', 'TERMOSTAT', 'REKLAM PANOSU', 'SUNUCU', 'ASANSÖR', 'KAMERA', 'POMPA', 'SİNYAL', 'YAZICI', 'BUZDOLABI', 'ROUTER', 'TV'];
	return (
		<AbsoluteFill style={{background: '#06080b'}}>
			<div style={{position: 'absolute', left: 140, top: 230, display: 'grid', gridTemplateColumns: 'repeat(6, 260px)', gap: 20}}>
				{new Array(24).fill(0).map((_, i) => {
					const on = rand(i * 3 + Math.floor(f / 15)) > 0.15;
					return (
						<div key={i} style={{height: 140, background: '#0f1620', border: '1px solid #1f2b38', position: 'relative', opacity: lin(f, i * 1.5, i * 1.5 + 10)}}>
							<div style={{position: 'absolute', left: 16, top: 14, fontFamily: MONO, fontSize: 15, color: '#6f8496', letterSpacing: '0.12em'}}>{labels[i % labels.length]}</div>
							<div style={{position: 'absolute', left: 16, bottom: 18, width: 10, height: 10, borderRadius: 5, background: on ? '#53d18d' : '#1c3a2a', boxShadow: on ? '0 0 10px #53d18d' : 'none'}} />
							<div style={{position: 'absolute', right: 16, bottom: 14, fontFamily: MONO, fontSize: 30, color: '#cfe3ff'}}>{String(Math.floor((f * (i + 3)) / 7) % 1000).padStart(3, '0')}</div>
							<div style={{position: 'absolute', left: 16, right: 16, top: 60, height: 2, background: '#1f2b38'}}>
								<div style={{width: `${((f * (i + 1)) % 100)}%`, height: 2, background: '#4fd1ff'}} />
							</div>
						</div>
					);
				})}
			</div>
			<BigText at={40} size={56} y={150} weight={600}>
				Makineler henüz bunu bilmiyor.
			</BigText>
		</AbsoluteFill>
	);
};

const OrderScreen: React.FC = () => {
	const f = useCurrentFrame();
	const blink = f % 30 < 18;
	return (
		<AbsoluteFill style={{background: 'linear-gradient(180deg,#2a1d16,#120c09)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={0} y={700} width={W} height={400} fill="#4a3426" />
				<rect x={0} y={690} width={W} height={20} fill="#6b4c37" />
				<rect x={780} y={620} width={360} height={80} rx={6} fill="#7a1f1f" />
				<rect x={830} y={600} width={120} height={30} rx={4} fill="#c88a3a" />
				<rect x={980} y={590} width={60} height={40} rx={4} fill="#e8e2d4" />
				{[0, 1, 2].map((k) => (
					<path key={k} d={`M ${860 + k * 30} 590 q 10 -20 0 -40`} stroke="#fff" strokeWidth={3} fill="none" opacity={0.1 + 0.05 * Math.sin(f / 9 + k)} />
				))}
			</svg>
			<div style={{position: 'absolute', left: 560, top: 140, width: 800, height: 380, background: '#05080a', border: '10px solid #1a1d22', fontFamily: MONO}}>
				<div style={{padding: 30, color: '#53d18d', fontSize: 30, letterSpacing: '0.1em'}}>SİPARİŞ DURUMU</div>
				<div style={{paddingLeft: 30, fontSize: 120, color: blink ? '#fdf6e3' : '#3a3f45', fontWeight: 700}}>#247</div>
				<div style={{paddingLeft: 30, fontSize: 40, color: blink ? '#f0b44c' : '#4a4030'}}>HAZIR · TESLİM ALIN</div>
			</div>
			<Tag x={560} y={560} at={30} text="BEKLEME SÜRESİ: 00:58:12" color="#e2483d" />
		</AbsoluteFill>
	);
};

const DeviceCity: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#0d1a2c" mid="#24324a" bottom="#3a4560" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Skyline seed={61} baseY={1080} minH={300} maxH={760} color="#0c121b" night={1} lightsOut={0.55} />
				{new Array(240).fill(0).map((_, i) => {
					const on = (f + i * 7) % (20 + (i % 13) * 6) < 6;
					return <circle key={i} cx={rand(i * 2.3) * W} cy={360 + rand(i * 7.1) * 700} r={2.2} fill={i % 3 ? '#4fd1ff' : '#53d18d'} opacity={on ? 1 : 0.15} />;
				})}
			</svg>
			<BigText at={20} size={60} y={240} weight={300} spacing={0.12}>
				Milyonlarca cihaz · Sıfır insan
			</BigText>
		</AbsoluteFill>
	);
};

export const S02: React.FC = () => {
	const {b, sb, dur} = useBeats();
	const s11 = sb(1, 1);
	const s12 = sb(1, 2);
	const crashAt = Math.round((sb(3, 1) - b(2)) * 0.95);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={s11} zoom={[1.05, 1]}>
				<TrafficLightClose />
			</Shot>
			<Shot from={s11} to={s12} zoom={[1, 1.08]}>
				<Factory />
			</Shot>
			<Shot from={s12} to={b(2)}>
				<TrainStop len={b(2) - s12} />
			</Shot>
			<Shot from={b(2)} to={b(4)} zoom={[1.0, 1.15]}>
				<TopDownCrash crashAt={crashAt} />
			</Shot>
			<Sfx at={b(2) + crashAt} src="crash" vol={0.7} len={80} />
			<Shot from={b(4)} to={b(7)} zoom={[1, 1.06]}>
				<Cockpit fallAt={sb(6, 1) - b(4)} len={b(7) - b(4)} />
			</Shot>
			<Sfx at={b(5)} src="warn" vol={0.35} len={90} />
			<Shot from={b(7)} to={b(8)}>
				<DeviceWall />
			</Shot>
			<Shot from={b(8)} to={b(10)} zoom={[1.15, 1.25]}>
				<PhoneRinging w={W} h={H} text="07:00" sub="ALARM · ERTELE / KAPAT" />
			</Shot>
			<Sfx at={b(8)} src="alarm" vol={0.35} len={b(10) - b(8)} />
			<Shot from={b(10)} to={b(12)} zoom={[1, 1.08]}>
				<OrderScreen />
			</Shot>
			{[0, 45, 90].map((k) => (
				<Sfx key={k} at={b(10) + k} src="ding" vol={0.35} len={36} />
			))}
			<Shot from={b(12)} to={dur} zoom={[1.15, 1]}>
				<DeviceCity />
			</Shot>
		</AbsoluteFill>
	);
};

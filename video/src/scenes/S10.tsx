import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, prog, rand} from '../lib/util';
import {BigText, FONT, FactCard, MONO, Shot, Tag} from '../components/ui';
import {Earth, Stars} from '../components/world';
import {Sfx} from './S01';

const Clouds: React.FC<{cx: number; cy: number; R: number; rot: number}> = ({cx, cy, R, rot}) => (
	<g opacity={0.55}>
		{new Array(26).fill(0).map((_, i) => {
			const a = rand(i * 3) * Math.PI * 2 + rot * 0.02 * (1 + rand(i));
			const r = Math.sqrt(rand(i * 7)) * R * 0.95;
			const x = cx + Math.cos(a) * r;
			const y = cy + Math.sin(a) * r * 0.9;
			return <ellipse key={i} cx={x} cy={y} rx={R * (0.08 + rand(i) * 0.1)} ry={R * 0.03} fill="#fff" />;
		})}
	</g>
);

const SpinningEarth: React.FC<{seasonAt: number}> = ({seasonAt}) => {
	const f = useCurrentFrame();
	const season = f > seasonAt ? Math.sin((f - seasonAt) / 25) : 0;
	return (
		<AbsoluteFill style={{background: '#010206'}}>
			<Stars count={320} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Earth cx={W / 2} cy={H / 2} R={400} lon0={-30 + f * 0.25} lat0={15 + season * 8} ice={1 + season * 0.35} land={season > 0.3 ? '#8b8a6a' : '#3f6b3a'}>
					<Clouds cx={W / 2} cy={H / 2} R={400} rot={f} />
				</Earth>
			</svg>
			{f > seasonAt && (
				<div style={{position: 'absolute', right: 160, top: 200, fontFamily: MONO, fontSize: 30, color: '#d9a85b', letterSpacing: '0.2em'}}>
					{season > 0.3 ? 'KUZEY · YAZ' : season < -0.3 ? 'KUZEY · KIŞ' : 'GEÇİŞ'}
				</div>
			)}
		</AbsoluteFill>
	);
};

const CO2Chart: React.FC<{bars: number}> = ({bars}) => {
	const f = useCurrentFrame();
	const x0 = 220;
	const x1 = 1700;
	const y0 = 820;
	const X = (yr: number) => x0 + ((yr - 1750) / (3050 - 1750)) * (x1 - x0);
	const co2 = (yr: number) => {
		if (yr < 1850) return 0.05;
		if (yr < 2026) return 0.05 + Math.pow((yr - 1850) / 176, 2.6) * 0.75;
		const t = yr - 2026;
		return 0.8 * (0.5 + 0.5 * Math.exp(-t / 300)) + 0.05;
	};
	const temp = (yr: number) => {
		if (yr < 1900) return 0.05;
		if (yr < 2026) return 0.05 + Math.pow((yr - 1900) / 126, 2) * 0.35;
		const t = yr - 2026;
		return 0.4 + 0.05 * (1 - Math.exp(-t / 80)) - (t / 1000) * 0.08;
	};
	const reveal = prog(f, 5, 120);
	const yrMax = 1750 + reveal * 1300;
	const path = (fn: (y: number) => number, H0: number) =>
		new Array(131)
			.fill(0)
			.map((_, i) => 1750 + i * 10)
			.filter((y) => y <= yrMax)
			.map((y, i) => `${i ? 'L' : 'M'}${X(y)},${y0 - fn(y) * H0}`)
			.join(' ');
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0d151e,#030508)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<line x1={x0} x2={x1} y1={y0} y2={y0} stroke="#3a556e" strokeWidth={3} />
				{[1800, 2000, 2026, 2500, 3000].map((y) => (
					<g key={y}>
						<line x1={X(y)} x2={X(y)} y1={y0} y2={y0 + 12} stroke="#3a556e" strokeWidth={3} />
						<text x={X(y)} y={y0 + 44} fill={y === 2026 ? '#e2483d' : '#7d8b99'} fontSize={22} textAnchor="middle" fontFamily="JetBrains Mono">
							{y === 2026 ? 'İNSANLAR KAYBOLUR' : y}
						</text>
					</g>
				))}
				<line x1={X(2026)} x2={X(2026)} y1={260} y2={y0} stroke="#e2483d" strokeWidth={2} strokeDasharray="8 8" opacity={reveal > 0.2 ? 1 : 0} />
				<path d={path(co2, 600)} stroke="#f0b44c" strokeWidth={6} fill="none" />
				<path d={path(temp, 600)} stroke="#e2483d" strokeWidth={5} fill="none" opacity={0.85} />
				<text x={x1 - 10} y={y0 - co2(3000) * 600 - 20} fill="#f0b44c" fontSize={24} textAnchor="end" fontFamily="JetBrains Mono" opacity={lin(f, 100, 115)}>
					CO₂ (atmosferde)
				</text>
				<text x={x1 - 10} y={y0 - temp(3000) * 600 + 40} fill="#e2483d" fontSize={24} textAnchor="end" fontFamily="JetBrains Mono" opacity={lin(f, 100, 115)}>
					Sıcaklık artışı
				</text>
			</svg>
			<div style={{position: 'absolute', left: 220, top: 150, fontFamily: MONO, fontSize: 22, color: '#9fb0c0', letterSpacing: '0.15em'}}>TEMSİLİ EĞRİ · ÖLÇEKSİZ</div>
			<div style={{position: 'absolute', left: 1100, top: 260, width: 600}}>
				{[
					['OKYANUS ISISI', 'yüzyıllar', 0.55],
					['BUZ TABAKALARI · DENİZ SEVİYESİ', 'binyıllar', 1],
				].map(([t, d, w], i) => (
					<div key={String(t)} style={{marginBottom: 26, opacity: lin(f, bars + i * 15, bars + i * 15 + 12)}}>
						<div style={{fontFamily: MONO, fontSize: 20, color: '#cfd8e0', letterSpacing: '0.1em'}}>
							{t} → <span style={{color: '#9fe3ff'}}>{d}</span>
						</div>
						<div style={{height: 12, marginTop: 8, background: 'rgba(255,255,255,0.08)'}}>
							<div style={{height: 12, width: `${Number(w) * 100 * prog(f, bars + i * 15, bars + i * 15 + 40)}%`, background: '#4fd1ff'}} />
						</div>
					</div>
				))}
			</div>
			<FactCard at={20} out={100000} x={220} y={190} w={620} title="NASEM" body="Emisyonlar dursa bile geçmiş emisyonların etkisi hemen kaybolmaz." accent="#f0b44c" />
		</AbsoluteFill>
	);
};

const Orbits: React.FC<{len: number; geoAt: number}> = ({len, geoAt}) => {
	const f = useCurrentFrame();
	const cx = W / 2;
	const cy = H / 2 + 20;
	const R = 250;
	const sats = new Array(40).fill(0).map((_, i) => ({
		a0: rand(i * 3) * Math.PI * 2,
		r0: R + 30 + rand(i * 7) * 60,
		decay: 0.25 + rand(i * 11) * 0.9,
		tilt: 0.25 + rand(i) * 0.25,
	}));
	const geo = new Array(14).fill(0).map((_, i) => (i / 14) * Math.PI * 2);
	const t = prog(f, 0, len, (x) => x);
	return (
		<AbsoluteFill style={{background: '#010206'}}>
			<Stars count={250} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<ellipse cx={cx} cy={cy} rx={R + 380} ry={(R + 380) * 0.32} fill="none" stroke="#3a4f63" strokeWidth={2} strokeDasharray="6 10" opacity={lin(f, geoAt, geoAt + 20)} />
				{geo.map((a, i) => {
					const an = a + f * 0.002;
					const x = cx + Math.cos(an) * (R + 380);
					const y = cy + Math.sin(an) * (R + 380) * 0.32;
					return <rect key={i} x={x - 5} y={y - 3} width={10} height={6} fill="#9fe3ff" opacity={lin(f, geoAt, geoAt + 20)} />;
				})}
				{/* arka yarı uydular */}
				{sats.map((s, i) => {
					const r = s.r0 - clamp(t / s.decay) * (s.r0 - R);
					const an = s.a0 + f * (0.04 + (1 / r) * 2);
					const y = cy + Math.sin(an) * r * s.tilt;
					if (Math.sin(an) > 0) return null;
					return r > R + 4 ? <circle key={i} cx={cx + Math.cos(an) * r} cy={y} r={3} fill="#cfd8e0" /> : null;
				})}
				<Earth cx={cx} cy={cy} R={R} lon0={f * 0.3} lat0={10} />
				{sats.map((s, i) => {
					const k = clamp(t / s.decay);
					const r = s.r0 - k * (s.r0 - R);
					const an = s.a0 + f * (0.04 + (1 / r) * 2);
					const x = cx + Math.cos(an) * r;
					const y = cy + Math.sin(an) * r * s.tilt;
					if (Math.sin(an) <= 0) return null;
					if (r <= R + 4) return null;
					const burn = k > 0.85;
					return (
						<g key={i}>
							{burn && <line x1={x} y1={y} x2={x - Math.sin(an) * 30} y2={y + Math.cos(an) * 10} stroke="#ffb066" strokeWidth={4} opacity={0.9} />}
							<circle cx={x} cy={y} r={burn ? 5 : 3} fill={burn ? '#ffcf73' : '#cfd8e0'} />
						</g>
					);
				})}
			</svg>
			<Tag x={110} y={160} at={10} text="ALÇAK YÖRÜNGE · ATMOSFERİK SÜRÜKLENME" color="#ffcf73" />
			<Tag x={110} y={205} at={geoAt} text="YÜKSEK YÖRÜNGE (GEO) · ÇOK DAHA UZUN" color="#9fe3ff" />
			<div style={{position: 'absolute', right: 120, bottom: 190, fontFamily: MONO, fontSize: 18, color: '#7d8b99'}}>Kaynak: NASA</div>
		</AbsoluteFill>
	);
};

const Anthropocene: React.FC = () => {
	const f = useCurrentFrame();
	const layers = [
		['#7a6446', 'BUZUL ÇAĞI ÇÖKELLERİ'],
		['#6b5a3e', 'TARIM ÖNCESİ TOPRAK'],
		['#5a4a34', 'ESKİ YERLEŞİMLER'],
	];
	return (
		<AbsoluteFill style={{background: '#0a0806'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect x={560} y={100} width={800} height={240} fill="#4c6a34" />
				<rect x={560} y={340} width={800} height={60} fill="#3a2e22" />
				<rect x={560} y={400} width={800} height={44} fill="#2a2420" />
				{new Array(36).fill(0).map((_, i) => (
					<rect key={i} x={570 + rand(i) * 770} y={404 + rand(i * 3) * 34} width={6 + rand(i * 5) * 12} height={4} rx={1} fill={['#e14b8a', '#4fd1ff', '#f2d24b', '#ffffff', '#9aa0a6'][i % 5]} />
				))}
				{layers.map(([c], i) => (
					<rect key={i} x={560} y={444 + i * 180} width={800} height={180} fill={c} />
				))}
			</svg>
			<div style={{position: 'absolute', left: 1400, top: 395, fontFamily: MONO, fontSize: 24, color: '#f0b44c', opacity: lin(f, 15, 30), letterSpacing: '0.1em'}}>
				← İNSAN KATMANI
				<div style={{fontSize: 18, color: '#cfc7b8', marginTop: 10, lineHeight: 1.6}}>
					plastik · beton · alüminyum
					<br />
					endüstriyel bileşikler
					<br />
					radyoaktif izotop izleri
				</div>
			</div>
			{layers.map(([, t], i) => (
				<div key={t} style={{position: 'absolute', left: 1400, top: 520 + i * 180, fontFamily: MONO, fontSize: 18, color: '#8c8478', letterSpacing: '0.12em'}}>
					{t}
				</div>
			))}
		</AbsoluteFill>
	);
};

const DarkEarth: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Stars count={350} />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Earth cx={W / 2} cy={H + 500} R={1100} lon0={20 + f * 0.05} lat0={40} night={0.9} lights={0} ice={0} />
			</svg>
			<AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 50%, rgba(80,200,140,0.10) 62%, transparent 70%)'}} />
		</AbsoluteFill>
	);
};

export const S10: React.FC = () => {
	const {b, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(2)} zoom={[0.9, 1.05]}>
				<SpinningEarth seasonAt={b(1)} />
			</Shot>
			<Shot from={b(2)} to={b(5)}>
				<CO2Chart bars={b(4) - b(2)} />
			</Shot>
			<Shot from={b(5)} to={b(8)} zoom={[1.1, 1]}>
				<Orbits len={b(8) - b(5)} geoAt={b(7) - b(5)} />
			</Shot>
			<Shot from={b(8)} to={b(10)} zoom={[1, 1.1]}>
				<Anthropocene />
			</Shot>
			<Sfx at={b(8)} src="rumble" vol={0.25} len={b(10) - b(8)} />
			<Shot from={b(10)} to={dur} zoom={[1, 1.05]}>
				<DarkEarth />
				<BigText at={b(11) - b(10)} size={58} y={300} weight={300} spacing={0.08}>
					Hikâyenin bazı satırları hâlâ okunabilir.
				</BigText>
			</Shot>
		</AbsoluteFill>
	);
};

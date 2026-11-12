import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, mixColor, prog, rand} from '../lib/util';
import {BigText, FONT, MONO, Meter, Shot, Tag} from '../components/ui';
import {Car, Cat, Cow, Dog, GrassField, Sky, Tree} from '../components/world';
import {Sfx} from './S01';

const House: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#7ea6c9" mid="#c9dbe6" bottom="#e9e3d2" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<Tree x={200} y={760} s={2.2} seed={3} />
				<Tree x={1700} y={760} s={2.5} seed={8} />
				<rect y={750} width={W} height={400} fill="#6f8f4a" />
				<path d="M 560 760 L 560 430 L 960 220 L 1360 430 L 1360 760 Z" fill="#e6dccb" />
				<path d="M 520 450 L 960 200 L 1400 450 L 1360 450 L 960 240 L 560 450 Z" fill="#7a3b2e" />
				<path d="M 520 450 L 960 200 L 1400 450" stroke="#5a2a20" strokeWidth={10} fill="none" />
				<rect x={900} y={560} width={120} height={200} fill="#5a3a24" />
				<circle cx={1000} cy={660} r={6} fill="#d6b25e" />
				{[640, 1150].map((x) => (
					<g key={x}>
						<rect x={x} y={500} width={130} height={110} fill="#2a3b4d" />
						<rect x={x + 63} y={500} width={4} height={110} fill="#e6dccb" />
						<rect x={x} y={553} width={130} height={4} fill="#e6dccb" />
					</g>
				))}
				<rect x={780} y={280} width={100} height={80} fill="#2a3b4d" />
				<rect x={1060} y={760} width={420} height={200} fill="#9b9a96" />
				<Car x={1270} y={890} color="#2f5d8a" scale={1.6} lights={false} />
				<rect x={440} y={700} width={10} height={90} fill="#444" />
				<rect x={410} y={670} width={70} height={44} rx={8} fill="#b23a2e" />
				{new Array(7).fill(0).map((_, i) => (
					<g key={i} opacity={lin(f, 20 + i * 12, 30 + i * 12)}>
						<rect x={760 + i * 22 - (i % 2) * 10} y={790 - i * 8} width={70} height={18} rx={5} fill="#efe9dc" transform={`rotate(${(rand(i) - 0.5) * 20}, ${790 + i * 22}, ${800 - i * 8})`} />
					</g>
				))}
			</svg>
			<GrassField y={1080} h={120} amount={0.5} density={140} seed={4} />
			<Tag x={760} y={830} at={110} text="7 GAZETE · OKUNMADI" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const Interior: React.FC<{catAt: number}> = ({catAt}) => {
	const f = useCurrentFrame();
	const ct = clamp((f - catAt) / 70);
	const cx = 1240 + ct * 260;
	const cy = 690 - Math.sin(ct * Math.PI) * 140 - ct * 40;
	return (
		<AbsoluteFill style={{background: '#2b2620'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect width={W} height={760} fill="#4b4237" />
				{new Array(12).fill(0).map((_, i) => (
					<rect key={i} x={i * 170} y={0} width={4} height={760} fill="#423a30" />
				))}
				<rect y={760} width={W} height={400} fill="#3a2a1f" />
				{new Array(10).fill(0).map((_, i) => (
					<rect key={i} x={0} y={780 + i * 34} width={W} height={2} fill="#2f2219" />
				))}
				{/* kapalı kapı */}
				<rect x={180} y={260} width={300} height={500} fill="#5e432d" stroke="#2f2219" strokeWidth={10} />
				<circle cx={440} cy={520} r={10} fill="#c9a24e" />
				{/* açık pencere */}
				<rect x={1300} y={240} width={420} height={360} fill="#9cc3dd" />
				<rect x={1300} y={240} width={420} height={360} fill="none" stroke="#e8dfcf" strokeWidth={16} />
				<path d="M 1300 240 L 1220 280 L 1220 640 L 1300 600 Z" fill="#c9dfec" opacity={0.6} stroke="#e8dfcf" strokeWidth={10} />
				<rect x={1290} y={600} width={440} height={26} fill="#e8dfcf" />
				<Tree x={1520} y={620} s={1.2} seed={5} />
				{/* kaseler */}
				<ellipse cx={620} cy={830} rx={70} ry={18} fill="#a33a2e" />
				<ellipse cx={620} cy={824} rx={55} ry={10} fill="#3a1d16" />
				<ellipse cx={780} cy={830} rx={70} ry={18} fill="#2f5d8a" />
				<ellipse cx={780} cy={824} rx={55} ry={10} fill="#1b2b3c" />
				<Dog x={420} y={860} s={1.6} tail={Math.sin(f / 30) * 4} />
				{ct < 1 && <Cat x={cx} y={cy} s={1.5} />}
			</svg>
			<Tag x={560} y={890} at={30} text="MAMA: 0  ·  SU: 0" color="#e2483d" />
			<Tag x={1300} y={170} at={catAt - 10} text="AÇIK PENCERE = ÇIKIŞ" color="#9fe3ff" />
		</AbsoluteFill>
	);
};

const Farm: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const feed = clamp(0.06 - f / (len * 10));
	return (
		<AbsoluteFill>
			<Sky top="#8aa7b8" mid="#d8c6a6" bottom="#e7d3a8" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<path d="M 0 700 Q 400 640 900 690 T 1920 670 L 1920 1080 L 0 1080 Z" fill="#9c9a5c" />
				<path d="M 1180 700 L 1180 420 L 1420 280 L 1660 420 L 1660 700 Z" fill="#8f2f24" />
				<rect x={1350} y={530} width={140} height={170} fill="#4a1a14" />
				<path d="M 1350 530 L 1490 700 M 1490 530 L 1350 700" stroke="#efe6d6" strokeWidth={8} />
				<rect x={1700} y={300} width={90} height={400} fill="#c4c8cc" />
				<path d="M 1700 300 Q 1745 240 1790 300 Z" fill="#9aa0a6" />
				<rect x={1700} y={460} width={90} height={14} fill="#888" />
				{new Array(16).fill(0).map((_, i) => (
					<rect key={i} x={100 + i * 66} y={760} width={8} height={110} fill="#6b4b2c" />
				))}
				<rect x={100} y={780} width={1000} height={8} fill="#6b4b2c" />
				<rect x={100} y={830} width={1000} height={8} fill="#6b4b2c" />
				<rect x={480} y={930} width={360} height={60} fill="#7c8a94" />
				<rect x={490} y={940} width={340} height={10} fill="#3b4a55" />
				<Cow x={300} y={960} s={1.1} />
				<Cow x={980} y={940} s={1.0} />
				<Cow x={720} y={900} s={0.8} />
			</svg>
			<div style={{position: 'absolute', left: 1180, top: 760, width: 560, background: 'rgba(8,12,18,0.75)', padding: 24}}>
				<div style={{fontFamily: MONO, fontSize: 18, color: '#f0b44c', letterSpacing: '0.2em', marginBottom: 40}}>OTOMATİK YEMLEME · SİLO 2</div>
				<div style={{position: 'relative', height: 60}}>
					<Meter x={0} y={0} w={512} label="YEM" value={feed} color="#e2483d" display={`${(feed * 100).toFixed(1)}%`} />
				</div>
				<div style={{position: 'relative', height: 60}}>
					<Meter x={0} y={0} w={512} label="SULAMA POMPASI" value={0} color="#e2483d" display="KAPALI" />
				</div>
			</div>
		</AbsoluteFill>
	);
};

const Market: React.FC<{len: number; spoilAt: number}> = ({len, spoilAt}) => {
	const f = useCurrentFrame();
	const temp = 3 + prog(f, 0, len, (t) => t) * 19;
	const spoil = prog(f, spoilAt, len);
	return (
		<AbsoluteFill style={{background: '#1a1e22'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect width={W} height={260} fill="#2a2f35" />
				{new Array(6).fill(0).map((_, i) => (
					<rect key={i} x={120 + i * 300} y={60} width={200} height={14} fill="#dfe8ef" opacity={0.08} />
				))}
				<path d="M 0 1080 L 760 560 L 1160 560 L 1920 1080 Z" fill="#2e3236" />
				{/* sol: dondurucular */}
				{new Array(4).fill(0).map((_, i) => {
					const x = 40 + i * 180;
					const y = 300 + i * 40;
					return (
						<g key={i}>
							<rect x={x} y={y} width={170} height={600 - i * 80} fill="#3d4650" />
							<rect x={x + 10} y={y + 10} width={150} height={560 - i * 80} fill={mixColor('#cfe6f5', '#5a6670', clamp(temp / 20))} opacity={0.5} />
							{new Array(4).fill(0).map((_, k) => (
								<rect key={k} x={x + 20} y={y + 40 + k * 120} width={130} height={60} fill={mixColor('#e8d4b0', '#6d5a3a', spoil)} />
							))}
						</g>
					);
				})}
				{/* sağ: sebze reyonu */}
				{new Array(4).fill(0).map((_, i) => {
					const x = 1180 + i * 170;
					const y = 440 + i * 50;
					return (
						<g key={i}>
							<rect x={x} y={y} width={160} height={260 + i * 40} fill="#4a3a2a" />
							{new Array(10).fill(0).map((_, k) => (
								<circle key={k} cx={x + 20 + (k % 5) * 30} cy={y + 30 + Math.floor(k / 5) * 32} r={14} fill={mixColor(['#c0392b', '#e67e22', '#27ae60', '#f1c40f'][i], '#4d3b22', spoil * (0.6 + rand(k + i) * 0.4))} />
							))}
						</g>
					);
				})}
				{spoil > 0.1 &&
					new Array(18).fill(0).map((_, i) => (
						<circle key={i} cx={1300 + Math.sin(f / 5 + i) * 120 + i * 18} cy={450 + Math.cos(f / 4 + i * 2) * 60} r={3} fill="#111" opacity={spoil} />
					))}
			</svg>
			<div style={{position: 'absolute', left: 760, top: 300, width: 400, textAlign: 'center', background: '#05080a', border: '6px solid #222', padding: 20, fontFamily: MONO}}>
				<div style={{fontSize: 20, color: '#7d8b99', letterSpacing: '0.2em'}}>SOĞUTUCU SICAKLIĞI</div>
				<div style={{fontSize: 96, color: temp > 8 ? '#e2483d' : '#53d18d'}}>{temp.toFixed(1)}°C</div>
				<div style={{fontSize: 18, color: '#e2483d', letterSpacing: '0.2em', opacity: temp > 8 && f % 30 < 18 ? 1 : 0}}>ALARM · YANIT YOK</div>
			</div>
		</AbsoluteFill>
	);
};

const WaterNet: React.FC<{len: number}> = ({len}) => {
	const f = useCurrentFrame();
	const lvl = 0.8 - prog(f, 0, len, (t) => t) * 0.6;
	const press = 4.2 * lvl;
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at center,#0c1520,#03060a)'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{/* pompa istasyonu */}
				<rect x={120} y={600} width={260} height={200} fill="#1a2633" stroke="#2f4a63" strokeWidth={4} />
				<circle cx={250} cy={700} r={60} fill="none" stroke="#3a556e" strokeWidth={10} />
				<text x={250} y={850} fill="#e2483d" fontSize={24} textAnchor="middle" fontFamily="JetBrains Mono">
					POMPA · KAPALI
				</text>
				{/* kule */}
				<rect x={640} y={420} width={20} height={400} fill="#2f4a63" />
				<rect x={760} y={420} width={20} height={400} fill="#2f4a63" />
				<rect x={580} y={160} width={260} height={280} rx={30} fill="#13202c" stroke="#3a556e" strokeWidth={6} />
				<rect x={590} y={170 + 260 * (1 - lvl)} width={240} height={260 * lvl} rx={24} fill="#2f7fa8" opacity={0.85} />
				<text x={710} y={130} fill="#9fe3ff" fontSize={22} textAnchor="middle" fontFamily="JetBrains Mono">
					YERÇEKİMİ DEPOSU · {Math.round(lvl * 100)}%
				</text>
				{/* borular */}
				<path d="M 380 700 L 520 700 L 520 840 L 1720 840" stroke="#2f4a63" strokeWidth={22} fill="none" />
				<path d="M 710 440 L 710 840" stroke="#2f4a63" strokeWidth={22} fill="none" />
				{new Array(14).fill(0).map((_, i) => {
					const t = ((f * 3 * lvl + i * 70) % 1000) / 1000;
					return <circle key={i} cx={720 + t * 1000} cy={840} r={6} fill="#9fe3ff" opacity={lvl} />;
				})}
				{[1100, 1350, 1600].map((x, i) => (
					<g key={x}>
						<path d={`M ${x} 840 L ${x} 700`} stroke="#2f4a63" strokeWidth={14} />
						<path d={`M ${x - 70} 700 L ${x - 70} 560 L ${x} 500 L ${x + 70} 560 L ${x + 70} 700 Z`} fill="#1a2633" stroke="#3a556e" strokeWidth={4} />
						<rect x={x - 20} y={600} width={40} height={40} fill={lvl > 0.3 + i * 0.12 ? '#ffcf73' : '#0b1118'} opacity={0.4} />
					</g>
				))}
				{/* sızıntı */}
				<g>
					<path d="M 1250 852 l 10 6 l -6 8" stroke="#9fe3ff" strokeWidth={3} fill="none" />
					{[0, 1, 2].map((k) => {
						const t = ((f + k * 12) % 36) / 36;
						return <circle key={k} cx={1256} cy={866 + t * 120} r={5} fill="#9fe3ff" opacity={1 - t} />;
					})}
					<ellipse cx={1256} cy={1000} rx={40 + f * 0.1} ry={8} fill="#2f7fa8" opacity={0.5} />
				</g>
			</svg>
			<div style={{position: 'absolute', left: 1180, top: 200, width: 560, fontFamily: MONO}}>
				<Meter x={0} y={0} w={560} label="ŞEBEKE BASINCI" value={press / 6} color={press < 2 ? '#e2483d' : '#4fd1ff'} display={`${press.toFixed(1)} bar`} />
				<div style={{position: 'absolute', top: 70}}>
					<Meter x={0} y={0} w={560} label="ARITMA" value={0} color="#e2483d" display="DURDU" />
				</div>
			</div>
			<Tag x={1130} y={900} at={60} text="ARIZA #0001 · ATANAN TEKNİSYEN: YOK" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const MaintLog: React.FC<{stopAt: number}> = ({stopAt}) => {
	const f = useCurrentFrame();
	const items = ['Filtre değişimi', 'Pompa yağlama', 'Trafo kontrolü', 'Boru sızıntısı onarımı', 'Soğutucu servis', 'Yazılım güncellemesi', 'Çatı oluğu temizliği'];
	return (
		<AbsoluteFill style={{background: 'radial-gradient(ellipse at 30% 40%,#1a1712,#050403)'}}>
			<div style={{position: 'absolute', left: 260, top: 170, fontFamily: MONO, fontSize: 24, color: '#d9a85b', letterSpacing: '0.3em'}}>BAKIM TAKVİMİ</div>
			{items.map((t, i) => {
				const o = lin(f, 5 + i * 8, 15 + i * 8);
				const late = f > stopAt;
				return (
					<div key={t} style={{position: 'absolute', left: 260, top: 240 + i * 74, opacity: o, fontFamily: FONT, fontSize: 40, color: '#efe8da', display: 'flex', gap: 30, width: 1400}}>
						<span style={{fontFamily: MONO, color: '#7d766a', width: 120}}>{String(i + 1).padStart(2, '0')}</span>
						<span style={{flex: 1}}>{t}</span>
						<span style={{fontFamily: MONO, fontSize: 28, color: late ? '#e2483d' : '#53d18d', opacity: late ? lin(f, stopAt + i * 6, stopAt + i * 6 + 8) : 1}}>
							{late ? 'SONSUZA DEK ERTELENDİ' : 'PLANLANDI'}
						</span>
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

export const S04: React.FC = () => {
	const {b, sb, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(3)} zoom={[1.0, 1.1]}>
				<House />
				<BigText at={b(2) + 5} size={64} y={160} weight={600}>
					Geride kalanlar
				</BigText>
			</Shot>
			<Sfx at={0} src="birds" vol={0.25} len={b(3)} />
			<Shot from={b(3)} to={b(5)} zoom={[1.05, 1]}>
				<Interior catAt={sb(4, 1) - b(3)} />
			</Shot>
			<Shot from={b(5)} to={b(7)} zoom={[1, 1.06]}>
				<Farm len={b(7) - b(5)} />
			</Shot>
			<Sfx at={b(5)} src="wind" vol={0.3} len={b(7) - b(5)} />
			<Shot from={b(7)} to={b(10)} zoom={[1, 1.12]}>
				<Market len={b(10) - b(7)} spoilAt={b(8) - b(7)} />
			</Shot>
			<Shot from={b(10)} to={b(12)}>
				<WaterNet len={b(12) - b(10)} />
			</Shot>
			<Sfx at={b(10) + 30} src="drip" vol={0.4} len={30} />
			<Sfx at={b(10) + 66} src="drip" vol={0.4} len={30} />
			<Sfx at={b(10) + 102} src="drip" vol={0.4} len={30} />
			<Shot from={b(12)} to={dur}>
				<MaintLog stopAt={b(13) - b(12)} />
			</Shot>
		</AbsoluteFill>
	);
};

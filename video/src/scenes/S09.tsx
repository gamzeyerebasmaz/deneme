import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {useBeats} from '../lib/beats';
import {H, W, clamp, lin, mixColor, prog, rand} from '../lib/util';
import {BigText, FONT, MONO, Shot, Tag} from '../components/ui';
import {Deer, Fog, GrassField, Pine, Skyline, Sky, Tree} from '../components/world';
import {Sfx} from './S01';
import {Birds} from './S06';

const Ruins: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#55697a" mid="#a8ab9e" bottom="#c4b996" />
			<div style={{position: 'absolute', left: -f * 0.2, top: 0}}>
				<Skyline seed={151} baseY={760} minH={260} maxH={640} color="#7c8584" windows={false} collapse={0.85} growth={1} />
			</div>
			<Fog y={520} h={340} color="#e8e4d4" opacity={0.5} />
			<div style={{position: 'absolute', left: -f * 0.5, top: 0}}>
				<Skyline seed={152} baseY={880} minH={200} maxH={520} color="#4a504c" decay={1} collapse={0.9} growth={1} />
			</div>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={860} width={W} height={300} fill="#3f5a2e" />
				{new Array(12).fill(0).map((_, i) => (
					<Tree key={i} x={((i * 190 - f * 0.9) % (W + 200) + W + 200) % (W + 200) - 100} y={900 + (i % 3) * 30} s={2 + rand(i) * 1.4} seed={i * 5} color="#2f5a2a" />
				))}
			</svg>
			<GrassField y={1080} h={200} amount={1} density={160} seed={80} />
			<Birds n={4} y={260} speed={2} />
		</AbsoluteFill>
	);
};

const Monuments: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<AbsoluteFill>
			<Sky top="#6c7f90" mid="#c9c0a8" bottom="#d9c79a" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect y={780} width={W} height={300} fill="#4c6a34" />
				{/* baraj */}
				<path d="M 1100 780 L 1180 420 L 1800 420 L 1880 780 Z" fill="#b7b0a2" />
				{new Array(8).fill(0).map((_, i) => (
					<line key={i} x1={1180 + i * 88} y1={420} x2={1140 + i * 100} y2={780} stroke="#9e978a" strokeWidth={4} />
				))}
				<rect x={1180} y={410} width={620} height={16} fill="#a59e90" />
				<path d="M 1560 430 q -10 120 20 350" stroke="#8fc0d8" strokeWidth={30} fill="none" opacity={0.7} />
				{/* kemer */}
				<path d="M 240 780 L 240 380 L 680 380 L 680 780 L 560 780 L 560 560 Q 460 460 360 560 L 360 780 Z" fill="#c9bfa6" />
				<rect x={220} y={340} width={480} height={50} fill="#b7ad94" />
				<path d="M 300 380 q 20 80 -10 160" stroke="#3f6b2f" strokeWidth={10} fill="none" />
				{/* dikilitaş */}
				<path d="M 860 780 L 880 300 L 900 260 L 920 300 L 940 780 Z" fill="#a8a08e" />
			</svg>
			<GrassField y={1080} h={220} amount={1} density={180} seed={90} />
			<Tag x={240} y={300} at={20} text="TAŞ ANIT" color="#f0b44c" />
			<Tag x={820} y={220} at={35} text="GRANİT" color="#f0b44c" />
			<Tag x={1300} y={360} at={50} text="BETON BARAJ" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const Strata: React.FC = () => {
	const f = useCurrentFrame();
	const layers = ['#6b5a3e', '#5a4a34', '#7a6446', '#4a3c2c', '#655238', '#3e3226'];
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<svg width={W} height={H} style={{position: 'absolute'}}>
				<rect width={W} height={260} fill="#4f6d39" />
				{new Array(10).fill(0).map((_, i) => (
					<Tree key={i} x={i * 200 + 80} y={262} s={0.9} seed={i} />
				))}
				{layers.map((c, i) => (
					<path key={i} d={`M 0 ${260 + i * 140} Q 480 ${250 + i * 140 + (i % 2) * 20} 960 ${265 + i * 140} T 1920 ${255 + i * 140} L 1920 1080 L 0 1080 Z`} fill={c} />
				))}
				{/* tünel halkası */}
				<circle cx={600} cy={620} r={130} fill="none" stroke="#8c8a84" strokeWidth={30} />
				<circle cx={600} cy={620} r={100} fill="#2a2a2a" />
				<path d="M 470 680 L 730 640 L 730 760 L 470 760 Z" fill="#2c4a52" opacity={0.6} />
				{/* borular */}
				<rect x={0} y={430} width={1920} height={26} fill="#7a4a2a" />
				<rect x={900} y={430} width={60} height={26} fill="#2a1a10" />
				<rect x={1200} y={540} width={720} height={18} fill="#6f7a80" />
				{/* temel kazıkları */}
				{[1300, 1420, 1540].map((x) => (
					<rect key={x} x={x} y={280} width={40} height={600} fill="#8c8a84" />
				))}
				{/* parçalar */}
				{new Array(50).fill(0).map((_, i) => {
					const types = ['#4fd1ff', '#e14b8a', '#f2d24b', '#ffffff', '#9aa0a6', '#5ad18d'];
					const x = rand(i * 3) * W;
					const y = 300 + rand(i * 7) * 720;
					return <rect key={i} x={x} y={y} width={8 + rand(i) * 18} height={5 + rand(i * 2) * 8} rx={2} fill={types[i % types.length]} opacity={lin(f, i, i + 10) * 0.8} transform={`rotate(${rand(i * 9) * 180}, ${x}, ${y})`} />;
				})}
			</svg>
			<Tag x={760} y={590} at={20} text="TÜNEL" color="#f3efe6" />
			<Tag x={960} y={470} at={30} text="BORU HATTI" color="#f3efe6" />
			<Tag x={1460} y={900} at={45} text="METAL · CAM · SERAMİK · PLASTİK" color="#f0b44c" />
		</AbsoluteFill>
	);
};

const Triptych: React.FC<{at: number[]}> = ({at}) => {
	const f = useCurrentFrame();
	const panel = (i: number, title: string, body: React.ReactNode) => (
		<div style={{position: 'absolute', left: 70 + i * 600, top: 140, width: 580, height: 760, overflow: 'hidden', opacity: lin(f, at[i], at[i] + 12), outline: '2px solid rgba(255,255,255,0.1)'}}>
			{body}
			<div style={{position: 'absolute', left: 0, right: 0, bottom: 30, textAlign: 'center', fontFamily: FONT, fontSize: 48, fontWeight: 800, letterSpacing: '0.12em', color: '#f3efe6', textShadow: '0 2px 20px #000'}}>{title}</div>
		</div>
	);
	const g1 = prog(f, at[0], at[0] + 80);
	const g2 = prog(f, at[1], at[1] + 80);
	return (
		<AbsoluteFill style={{background: '#050505'}}>
			{panel(
				0,
				'ÖRTER',
				<svg width={580} height={760}>
					<rect width={580} height={760} fill="#53613e" />
					<g transform="translate(290, 520) scale(1.8)">
						<path d="M -68 -8 L -66 -28 Q -60 -34 -40 -36 L -26 -56 Q -20 -62 0 -62 L 26 -62 Q 36 -62 44 -50 L 52 -38 Q 66 -36 68 -26 L 70 -8 Z" fill="#6b3d22" />
						<path d="M -70 -6 Q -40 -60 0 -66 Q 40 -60 72 -6 Z" fill="#4f7d34" opacity={g1} />
					</g>
					{new Array(30).fill(0).map((_, i) => (
						<circle key={i} cx={150 + rand(i) * 280} cy={420 + rand(i * 3) * 120} r={10 + rand(i * 5) * 14} fill="#5f9a3a" opacity={g1 * 0.9} />
					))}
				</svg>
			)}
			{panel(
				1,
				'PARÇALAR',
				<svg width={580} height={760}>
					<rect width={580} height={760} fill="#6e6a62" />
					<rect x={80} y={160} width={420} height={420} fill="#8c8a84" />
					<path d={`M 290 160 L ${290 - g2 * 30} 360 L 290 580`} stroke="#1a1816" strokeWidth={6 + g2 * 30} fill="none" />
					<path d={`M 290 160 L ${290 - g2 * 30} 360 L 290 580`} stroke="#6a4b2c" strokeWidth={g2 * 18} fill="none" />
					<Tree x={290} y={170} s={0.9} grow={g2} seed={4} />
				</svg>
			)}
			{panel(
				2,
				'TAŞIR',
				<svg width={580} height={760}>
					{['#7a6446', '#5a4a34', '#8a7456', '#4a3c2c', '#6b5a3e'].map((c, i) => (
						<rect key={i} y={i * 152} width={580} height={152} fill={c} />
					))}
					<rect y={300} width={580} height={22} fill="#3a2e22" />
					<g transform="translate(290, 311)" opacity={lin(f, at[2] + 10, at[2] + 40)}>
						<rect x={-60} y={-8} width={120} height={16} rx={6} fill="none" stroke="#e8dcc0" strokeWidth={3} />
						<circle cx={-90} cy={0} r={10} fill="none" stroke="#e8dcc0" strokeWidth={3} />
						<path d="M 80 -6 l 30 0 l -10 12 l -20 0 Z" fill="none" stroke="#e8dcc0" strokeWidth={3} />
					</g>
				</svg>
			)}
		</AbsoluteFill>
	);
};

const Stadium: React.FC<{len: number; ghostAt: number}> = ({len, ghostAt}) => {
	const f = useCurrentFrame();
	const ghost = Math.min(lin(f, ghostAt, ghostAt + 30), 1 - lin(f, ghostAt + 90, ghostAt + 140));
	return (
		<AbsoluteFill>
			<Sky top="#5d7286" mid="#c4b89c" bottom="#d8b98a" />
			<svg width={W} height={H} style={{position: 'absolute'}}>
				{/* tribün halkası */}
				<path d="M 100 760 Q 960 260 1820 760 L 1700 760 Q 960 380 220 760 Z" fill="#9a958a" />
				{new Array(9).fill(0).map((_, i) => (
					<path key={i} d={`M ${130 + i * 12} 760 Q 960 ${290 + i * 12} ${1790 - i * 12} 760`} stroke="#7e7a70" strokeWidth={3} fill="none" />
				))}
				<path d="M 420 520 L 520 470 L 560 560 Z M 1400 500 L 1480 540 L 1380 560 Z" fill="#3a3a36" />
				{new Array(16).fill(0).map((_, i) => (
					<Tree key={i} x={160 + i * 110} y={470 + Math.pow((i - 7.5) / 7.5, 2) * 280} s={0.8 + rand(i) * 0.5} seed={i * 3} color="#3f6b35" />
				))}
				{/* hayalet kalabalık */}
				{ghost > 0 &&
					new Array(160).fill(0).map((_, i) => {
						const t = i / 160;
						const x = 160 + t * 1600;
						const yy = 760 - Math.sin(t * Math.PI) * (360 - (i % 4) * 30) + 10;
						return <circle key={i} cx={x} cy={yy} r={6} fill="#f3efe6" opacity={ghost * 0.4} />;
					})}
				{/* saha */}
				<ellipse cx={960} cy={860} rx={900} ry={170} fill="#5d7a3a" />
				<ellipse cx={960} cy={860} rx={300} ry={60} fill="none" stroke="#e8e2c8" strokeWidth={3} opacity={0.12} />
				{new Array(7).fill(0).map((_, i) => (
					<Deer key={i} x={-300 + (f / len) * 2200 + i * 140 - (i % 2) * 60} y={880 + (i % 3) * 36} s={0.75 + (i % 2) * 0.15} walk={f / 5 + i} antlers={i % 3 === 0} />
				))}
			</svg>
			<GrassField y={1080} h={200} amount={1} density={160} seed={95} />
			<GrassField y={900} h={80} amount={1} density={120} seed={96} color="#6d8a42" />
		</AbsoluteFill>
	);
};

export const S09: React.FC = () => {
	const {b, dur} = useBeats();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<Shot from={0} to={b(3)} zoom={[1.1, 1]}>
				<Ruins />
			</Shot>
			<Sfx at={0} src="wind" vol={0.35} len={b(3)} />
			<Shot from={b(3)} to={b(5)} zoom={[1, 1.06]}>
				<Monuments />
			</Shot>
			<Shot from={b(5)} to={b(7)} pan={[0, 40, 0, -40]} zoom={[1.08, 1.08]}>
				<Strata />
			</Shot>
			<Sfx at={b(5)} src="rumble" vol={0.25} len={b(7) - b(5)} />
			<Shot from={b(7)} to={b(10)}>
				<Triptych at={[0, b(8) - b(7), b(9) - b(7)]} />
			</Shot>
			<Shot from={b(10)} to={dur} zoom={[1, 1.08]}>
				<Stadium len={dur - b(10)} ghostAt={b(11) - b(10)} />
			</Shot>
			<Sfx at={b(10)} src="wind" vol={0.45} len={dur - b(10)} />
		</AbsoluteFill>
	);
};

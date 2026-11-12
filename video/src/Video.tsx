import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import timeline from './timeline.json';
import {BeatProvider, SceneData} from './lib/beats';
import {FONT, Grain, Letterbox, MONO, Vignette} from './components/ui';
import {H, W, lin, prog} from './lib/util';
import {SCENES} from './scenes';

const TL = timeline as {fps: number; total: number; scenes: SceneData[]};

/** Zaman çizelgesi durakları (bölüm kartında gösterilir) */
const STOPS = ['08:00', '+1 SAAT', '+24 SAAT', '+7 GÜN', '+30 GÜN', '+1 YIL', '+10 YIL', '+50 YIL', '+500 YIL', '+1000 YIL'];

const ChapterCard: React.FC<{scene: SceneData; index: number}> = ({scene, index}) => {
	const f = useCurrentFrame();
	const len = 78;
	if (f > len + 20) return null;
	const o = Math.min(lin(f, 0, 10), 1 - lin(f, len, len + 18));
	const scale = 1.08 - 0.08 * prog(f, 0, len);
	const stopIdx = Math.min(STOPS.length - 1, index);
	return (
		<AbsoluteFill style={{opacity: o, fontFamily: FONT}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(6,6,8,0.9), rgba(0,0,0,0.98))'}} />
			<div style={{position: 'absolute', width: W, top: 330, textAlign: 'center', transform: `scale(${scale})`}}>
				<div style={{fontFamily: MONO, fontSize: 26, letterSpacing: '0.5em', color: '#d9a85b'}}>BÖLÜM {String(index + 1).padStart(2, '0')}</div>
				<div style={{fontSize: 170, fontWeight: 800, color: '#f4efe4', letterSpacing: '0.02em', marginTop: 10, textShadow: '0 0 60px rgba(255,190,110,0.25)'}}>
					{scene.label}
				</div>
				<div style={{fontSize: 44, fontWeight: 300, color: '#cfc7b8', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: 6}}>{scene.title}</div>
			</div>
			{/* zaman ekseni */}
			<svg width={W} height={200} style={{position: 'absolute', top: 760}}>
				<line x1={260} x2={1660} y1={60} y2={60} stroke="#6b6355" strokeWidth={2} />
				<line x1={260} x2={260 + (1400 * Math.max(0, stopIdx - 1 + prog(f, 4, 50))) / (STOPS.length - 1)} y1={60} y2={60} stroke="#d9a85b" strokeWidth={4} />
				{STOPS.map((s, i) => {
					const x = 260 + (1400 * i) / (STOPS.length - 1);
					const act = i === stopIdx;
					const done = i < stopIdx;
					return (
						<g key={s}>
							<circle cx={x} cy={60} r={act ? 10 : 6} fill={act || done ? '#d9a85b' : '#3a362f'} />
							{act && <circle cx={x} cy={60} r={10 + 18 * ((f % 30) / 30)} fill="none" stroke="#d9a85b" opacity={1 - (f % 30) / 30} />}
							<text x={x} y={105} fill={act ? '#f4efe4' : '#7d766a'} fontSize={act ? 22 : 17} textAnchor="middle" fontFamily="JetBrains Mono, monospace">
								{s}
							</text>
						</g>
					);
				})}
			</svg>
		</AbsoluteFill>
	);
};

/** Sol üstte kalıcı zaman etiketi */
const TimeChip: React.FC<{scene: SceneData; delay: number}> = ({scene, delay}) => {
	const f = useCurrentFrame();
	const o = Math.min(lin(f, delay, delay + 20), 1 - lin(f, scene.duration - 20, scene.duration));
	return (
		<div style={{position: 'absolute', right: 70, top: 86, opacity: o * 0.92, fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 16}}>
			<div style={{width: 12, height: 12, borderRadius: 6, background: '#e2483d', opacity: f % 40 < 26 ? 1 : 0.25}} />
			<div style={{fontSize: 26, color: '#f2ede2', letterSpacing: '0.18em'}}>{scene.label}</div>
			<div style={{fontSize: 18, color: '#a59e90', letterSpacing: '0.2em', textTransform: 'uppercase'}}>· {scene.title}</div>
		</div>
	);
};

const Subtitles: React.FC<{scene: SceneData}> = ({scene}) => {
	const f = useCurrentFrame();
	let cur: {text: string; start: number; dur: number} | null = null;
	for (const p of scene.paras)
		for (const s of p.sents)
			if (f >= s.start - 3 && f < s.start + s.dur + 8) cur = s;
	if (!cur) return null;
	const o = Math.min(lin(f, cur.start - 3, cur.start + 4), 1 - lin(f, cur.start + cur.dur + 1, cur.start + cur.dur + 8));
	return (
		<div style={{position: 'absolute', left: 0, width: W, bottom: 84, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div
				style={{
					maxWidth: 1460,
					textAlign: 'center',
					fontFamily: FONT,
					fontSize: 42,
					fontWeight: 600,
					lineHeight: 1.3,
					color: '#fbf8f1',
					padding: '8px 22px',
					background: 'rgba(0,0,0,0.38)',
					borderRadius: 6,
					textShadow: '0 2px 8px rgba(0,0,0,0.9)',
				}}
			>
				{cur.text}
			</div>
		</div>
	);
};

const SceneAudio: React.FC<{scene: SceneData; musicStart: number; musicVol: number}> = ({scene, musicStart, musicVol}) => {
	// final sahnesi: konuşma bitince müzik söner → 3 sn sessizlik
	const last = scene.paras[scene.paras.length - 1].end;
	const finale = scene.id === 's11';
	const tailFade = (fr: number) => (finale ? 1 - lin(fr + musicStart, last + 20, last + 95) : 1);
	return (
		<>
			{scene.paras.map((p) =>
				p.sents.map((s) => (
					<Sequence key={s.file} from={s.start} durationInFrames={s.dur + 6} layout="none">
						<Audio src={staticFile(s.file)} volume={1} />
					</Sequence>
				))
			)}
			<Sequence from={musicStart} durationInFrames={scene.duration - musicStart + 90} layout="none">
				<Audio
					src={staticFile(`music/${scene.id}.wav`)}
					volume={(f) => musicVol * tailFade(f) * interpolate(f, [0, 30, scene.duration - musicStart, scene.duration - musicStart + 75], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
				/>
			</Sequence>
		</>
	);
};

export const SceneBlock: React.FC<{scene: SceneData; index: number; subtitles: boolean}> = ({scene, index, subtitles}) => {
	const Comp = SCENES[scene.id];
	const f = useCurrentFrame();
	// sahne geçişi: siyahtan aç / siyaha kapan
	const fadeIn = index === 0 ? 1 : lin(f, 0, 14);
	const fadeOut = 1 - lin(f, scene.duration - 14, scene.duration);
	const isFirst = index === 0;
	return (
		<BeatProvider scene={scene}>
			<AbsoluteFill style={{background: '#000'}}>
				<AbsoluteFill style={{opacity: Math.min(fadeIn, fadeOut)}}>
					<Comp />
				</AbsoluteFill>
				<Vignette />
				<Grain />
				{!isFirst && scene.id !== 's11' && <ChapterCard scene={scene} index={index} />}
				{!isFirst && <TimeChip scene={scene} delay={90} />}
				<Letterbox />
				{subtitles && <Subtitles scene={scene} />}
				<SceneAudio scene={scene} musicStart={isFirst ? 165 : 0} musicVol={isFirst ? 0.32 : 0.26} />
				{!isFirst && (
					<Sequence from={0} durationInFrames={60} layout="none">
						<Audio src={staticFile('sfx/whoosh.wav')} volume={0.45} />
					</Sequence>
				)}
			</AbsoluteFill>
		</BeatProvider>
	);
};

export const Belgesel: React.FC<{subtitles: boolean; only?: string}> = ({subtitles, only}) => {
	const list = only ? TL.scenes.filter((s) => s.id === only) : TL.scenes;
	let acc = 0;
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{list.map((s) => {
				const from = acc;
				acc += s.duration;
				return (
					<Sequence key={s.id} from={from} durationInFrames={s.duration} name={`${s.id} · ${s.title}`}>
						<SceneBlock scene={s} index={TL.scenes.indexOf(s)} subtitles={subtitles} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};

export const TOTAL = TL.total;
export const SCENE_LIST = TL.scenes;
export {H};

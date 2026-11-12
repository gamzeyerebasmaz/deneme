import React, {createContext, useContext} from 'react';

export type Sent = {text: string; file: string; start: number; dur: number};
export type Para = {start: number; end: number; sents: Sent[]};
export type SceneData = {id: string; title: string; label: string; from: number; duration: number; paras: Para[]};

const Ctx = createContext<SceneData | null>(null);

export const BeatProvider: React.FC<{scene: SceneData; children: React.ReactNode}> = ({scene, children}) => (
	<Ctx.Provider value={scene}>{children}</Ctx.Provider>
);

/** Sahne içindeki paragraf başlangıç/bitiş kareleri */
export const useBeats = () => {
	const s = useContext(Ctx);
	if (!s) throw new Error('BeatProvider yok');
	const n = s.paras.length;
	const b = (i: number) => (i >= n ? s.duration : i < 0 ? 0 : s.paras[i].start);
	const e = (i: number) => (i >= n ? s.duration : s.paras[Math.max(0, i)].end);
	/** i. paragrafın j. cümlesinin başlangıcı */
	const sb = (i: number, j: number) => {
		const p = s.paras[Math.min(n - 1, Math.max(0, i))];
		return p.sents[Math.min(p.sents.length - 1, j)].start;
	};
	return {b, e, sb, dur: s.duration, scene: s};
};

// Kullanım: node tools/stills.mjs <outdir> <frame1> <frame2> ...  (genel karelere göre)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [, , out, ...frames] = process.argv;
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = process.env.REMOTION_CHROME || null;
const composition = await selectComposition({serveUrl, id: 'Belgesel', browserExecutable});
for (const fr of frames) {
	const f = Number(fr);
	await renderStill({serveUrl, composition, frame: f, output: path.join(out, `f${String(f).padStart(5, '0')}.jpg`), imageFormat: 'jpeg', scale: 0.5, browserExecutable});
	console.log('ok', f);
}

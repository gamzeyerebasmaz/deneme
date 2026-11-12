import React from 'react';
import {Composition} from 'remotion';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import {Belgesel, SCENE_LIST, TOTAL} from './Video';

export const Root: React.FC = () => (
	<>
		<Composition id="Belgesel" component={Belgesel} durationInFrames={TOTAL} fps={30} width={1920} height={1080} defaultProps={{subtitles: true}} />
		<Composition id="BelgeselAltyazisiz" component={Belgesel} durationInFrames={TOTAL} fps={30} width={1920} height={1080} defaultProps={{subtitles: false}} />
		{SCENE_LIST.map((s) => (
			<Composition
				key={s.id}
				id={`Sahne-${s.id}`}
				component={Belgesel}
				durationInFrames={s.duration}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{subtitles: true, only: s.id}}
			/>
		))}
	</>
);

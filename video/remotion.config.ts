import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(90);
Config.setConcurrency(4);
Config.setCodec('h264');
Config.setCrf(20);
// Bulut ortamında önceden kurulu Chromium varsa onu kullan
if (process.env.REMOTION_CHROME) {
	Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}

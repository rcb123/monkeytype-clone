import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import words from './languages/words.json';
import sentences from './languages/sentences.json';
import numbers from './languages/numbers.json';

export const GET: RequestHandler = ({ url }) => {
	const limit = Number(url.searchParams.get('limit'));
	const mode = String(url.searchParams.get('mode'));
	let response;
	if (mode === 'words') {
		response = words.words.slice(0, limit).sort(() => 0.5 - Math.random());
	}
	if (mode === 'sentences') {
		response = sentences.words.slice(0, limit).sort(() => 0.5 - Math.random());
		response = response.map(sentence => sentence.split(" ")).flat();
	}
	if (mode === 'numbers') {
		response = numbers.words.slice(0, limit).sort(() => 0.5 - Math.random());
	}
	return json(response);
};

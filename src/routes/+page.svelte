<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { blur, fade } from 'svelte/transition';

	type Game = 'waiting for input' | 'in progress' | 'game over';
	type GameMode = 'time' | 'words' | 'quotes' | 'zen';
	type WordMode = 'words' | 'sentences' | 'numbers';
	type Word = string;

	let game: Game = 'waiting for input';
	let gameMode: GameMode = 'time';
	let wordMode: WordMode = 'words';
	let seconds = 15;
	let timer = seconds;
	let stopwatch = 0;
	let wordLimit = 10;
	let typedLetter = '';
	let toggleReset = false;
	let overlayVisible = false;

	let words: Word[] = [];

	let wordCount = 100;
	let wordIndex = 0;
	let letterIndex = 0;
	let correctLetters = 0;
	let totalLettersTyped = 0;

	let wordsPerMinute = tweened(0, { delay: 300, duration: 1000 });
	let accuracy = tweened(0, { delay: 1300, duration: 1000 });

	let wordsEl: HTMLDivElement;
	let letterEl: HTMLSpanElement;
	let inputEl: HTMLInputElement;
	let caretEl: HTMLDivElement;

	function getWordsPerMinute() {
		const word = 5;
		if (gameMode === 'time') {
			const minutes = seconds / 60;
			return Math.floor(correctLetters / word / minutes);
		} else if (gameMode === 'words') {
			const minutes = stopwatch / 60;
			return Math.floor(correctLetters / word / minutes);
		} else if (gameMode === 'zen') {
			const minutes = stopwatch / 60;
			return Math.floor(correctLetters / word / minutes);
		} else {
			return 999;
		}
	}

	function getAccuracy() {
		if (totalLettersTyped === 0) {
			return 0;
		}
		return Math.floor((correctLetters / totalLettersTyped) * 100);
	}

	function getTotalLetters(words: Word[]) {
		return words.reduce((count, word) => count + word.length, 0);
	}

	function getResults() {
		$wordsPerMinute = getWordsPerMinute();
		$accuracy = getAccuracy();
	}

	async function resetGame() {
		toggleReset = !toggleReset;

		setGameState('waiting for input');
		getWords(wordCount);

		timer = seconds;
		stopwatch = 0;
		typedLetter = '';
		wordIndex = 0;
		letterIndex = 0;
		correctLetters = 0;
		totalLettersTyped = 0;

		$wordsPerMinute = 0;
		$accuracy = 0;

		focusInput();
	}

	function updateGameState() {
		setLetter();
		checkLetter();
		nextLetter();
		updateLine();
		moveCaret();
		resetLetter();
	}

	function setLetter() {
		const isWordCompleted = letterIndex > words[wordIndex].length - 1;

		if (!isWordCompleted) {
			letterEl = wordsEl.children[wordIndex].children[letterIndex] as HTMLSpanElement;
		}
	}

	function checkLetter() {
		const currentLetter = words[wordIndex][letterIndex];

		if (typedLetter === currentLetter) {
			letterEl.dataset.letter = 'correct';
			letterEl.className = 'letter opacity-100';
			increaseScore();
		}

		if (typedLetter !== currentLetter) {
			letterEl.dataset.letter = 'incorrect';
			letterEl.className = 'letter opacity-100 text-[hsl(var(--er))]';
		}
	}

	function increaseScore() {
		correctLetters += 1;
	}

	function nextLetter() {
		totalLettersTyped += 1;
		letterIndex += 1;
	}

	function nextWord() {
		const isNotFirstLetter = letterIndex !== 0;
		const isOneLetterWord = words[wordIndex].length === 1;

		if (isNotFirstLetter || isOneLetterWord) {
			wordIndex += 1;
			totalLettersTyped += 1;
			letterIndex = 0;
			increaseScore();
			moveCaret();
		}

		if (gameMode === 'words') {
			if (wordIndex === wordLimit) {
				endGame();
			}
		}
	}

	function updateLine() {
		const wordEl = wordsEl.children[wordIndex];
		const wordsY = wordsEl.getBoundingClientRect().y;
		const wordY = wordEl.getBoundingClientRect().y;

		if (wordY > wordsY) {
			wordEl.scrollIntoView({ block: 'center' });
		}
	}

	function resetLetter() {
		typedLetter = '';
	}

	function moveCaret() {
		const offset = 2;
		const { offsetLeft, offsetTop, offsetWidth } = letterEl;

		caretEl.style.top = `${offsetTop + offset}px`;
		caretEl.style.left = `${offsetLeft + offsetWidth}px`;
	}

	function startGame() {
		setGameState('in progress');
		if (gameMode === 'time') {
			setGameTimer();
		} else if (gameMode === 'words') {
			setGameStopwatch();
		} else if (gameMode === 'zen') {
			setGameStopwatch();
		}
	}

	function setGameState(state: Game) {
		game = state;
	}

	function setGameMode(mode: GameMode) {
		gameMode = mode;
		focusInput();
	}

	function setWordMode(mode: WordMode) {
		wordMode = mode;
		getWords(wordCount);
		focusInput();
	}

	function setGameTimer() {
		function gameTimer() {
			if (timer > 0) {
				timer -= 1;
			}

			if (game === 'waiting for input' || timer === 0) {
				clearInterval(interval);
			}

			if (timer === 0) {
				endGame();
			}
		}

		const interval = setInterval(gameTimer, 1000);
	}

	function setGameStopwatch() {
		function gameStopwatch() {
			stopwatch += 1;

			if (game === 'waiting for input' || stopwatch > 86400) {
				clearInterval(interval);
			}
		}

		const interval = setInterval(gameStopwatch, 1000);
	}

	async function getWords(limit: number) {
		const response = await fetch(`/api/words?mode=${wordMode}&limit=${limit}`);
		words = await response.json();
		console.log(words);
	}

	async function focusInput() {
		overlayVisible = false;
		await sleep(1);
		inputEl.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		const isChar = event.key.length === 1;

		if (event.code === 'Space') {
			event.preventDefault();

			if (game === 'in progress') {
				nextWord();
			}
		}

		if (game === 'waiting for input' && isChar) {
			startGame();
		}

		if (gameMode === 'zen' && event.code === 'Enter') {
			endGame();
		}

		// else if (letterIndex == words[wordIndex].length) {
		// 	nextWord();
		// }
	}

	function setTime(time: number) {
		seconds = time;
		timer = seconds;
		focusInput();
	}

	function setWordLimit(wordCount: number) {
		wordLimit = wordCount;
		stopwatch = 0;
		focusInput();
	}

	function endGame() {
		setGameState('game over');
		getResults();
	}

	function sleep(ms: number | undefined) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	onMount(async () => {
		getWords(wordCount);
		focusInput();
		window.addEventListener('keydown', focusInput);

		return () => {
			window.removeEventListener('keydown', focusInput);
		};
	});
</script>

{#if game !== 'game over'}
	<div class="flex flex-row gap-2 justify-evenly text-center" data-game={game}>
		{#if game !== 'in progress'}
			<div class="gap-4 w-1/4">
				{#if gameMode !== 'zen'}
					<div in:blur out:blur>
						<button
							on:click={() => setWordMode('words')}
							class={wordMode === 'words' ? 'selected' : ''}
							tabindex="-1">words</button
						>
						<button
							on:click={() => setWordMode('sentences')}
							class={wordMode === 'sentences' ? 'selected' : ''}
							tabindex="-1">sentences</button
						>
						<button
							on:click={() => setWordMode('numbers')}
							class={wordMode === 'numbers' ? 'selected' : ''}
							tabindex="-1">numbers</button
						>
					</div>
				{/if}
			</div>
			<div class="gap-4 w-1/4">
				<!--
				<div class="relative">
					<p class="text-xs w-full text-gray-100 top-12 absolute">
						Only time gamemode is implemented!!
					</p>
				</div>
				-->
				<button
					on:click={() => setGameMode('time')}
					class={gameMode === 'time' ? 'selected' : ''}
					tabindex="-1">time</button
				>
				<button
					on:click={() => setGameMode('words')}
					class={gameMode === 'words' ? 'selected' : ''}
					tabindex="-1">words</button
				>
				<!-- <button
					on:click={() => setGameMode('quotes')}
					class={gameMode === 'quotes' ? 'selected' : ''}
					tabindex="-1"
					disabled>quotes</button
				> -->
				<button
					on:click={() => setGameMode('zen')}
					class={gameMode === 'zen' ? 'selected' : ''}
					tabindex="-1">zen</button
				>
			</div>
			<div class="gap-4 w-1/4">
				{#if gameMode !== 'zen'}
					{#if gameMode === 'time'}
						<div in:blur class="">
							<button
								on:click={() => setTime(3)}
								class={seconds === 3 ? 'selected' : ''}
								tabindex="-1">3</button
							>
							<button
								on:click={() => setTime(15)}
								class={seconds === 15 ? 'selected' : ''}
								tabindex="-1">15</button
							>
							<button
								on:click={() => setTime(30)}
								class={seconds === 30 ? 'selected' : ''}
								tabindex="-1">30</button
							>
							<button
								on:click={() => setTime(60)}
								class={seconds === 60 ? 'selected' : ''}
								tabindex="-1">60</button
							>
							<button
								on:click={() => setTime(120)}
								class={seconds === 120 ? 'selected' : ''}
								tabindex="-1">120</button
							>
						</div>
					{:else if gameMode === 'words'}
						<div in:blur class="relative">
							<button
								on:click={() => setWordLimit(10)}
								class={wordLimit === 10 ? 'selected' : ''}
								tabindex="-1">10</button
							>
							<button
								on:click={() => setWordLimit(25)}
								class={wordLimit === 25 ? 'selected' : ''}
								tabindex="-1">25</button
							>
							<button
								on:click={() => setWordLimit(50)}
								class={wordLimit === 50 ? 'selected' : ''}
								tabindex="-1">50</button
							>
							<button
								on:click={() => setWordLimit(100)}
								class={wordLimit === 100 ? 'selected' : ''}
								tabindex="-1">100</button
							>
							<button
								on:click={() => setWordLimit(250)}
								class={wordLimit === 250 ? 'selected' : ''}
								tabindex="-1">250</button
							>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</div>

	<div class="game w-[95vw]" data-game={game}>
		<input
			bind:this={inputEl}
			bind:value={typedLetter}
			on:input={updateGameState}
			on:keydown={handleKeydown}
			on:mousedown={(e) => e.preventDefault()}
			on:focus={() => (overlayVisible = false)}
			on:blur={() => (overlayVisible = true)}
			class="input p-0 w-full h-4/5 z-10 cursor-default"
			type="text"
			tabindex="0"
		/>

		{#if overlayVisible}
			<div
				tabindex="0"
				on:mousedown={(e) => e.preventDefault()}
				on:click={focusInput}
				class="absolute inset-0 flex w-full h-full bg-base-100 bg-opacity-40 z-10 justify-center items-center cursor-default backdrop-blur-sm"
				transition:fade
			>
				<p class="">Click here or start typing to focus</p>
			</div>
		{/if}

		{#if gameMode === 'time'}
			<div class="time">{timer}</div>
		{:else if gameMode === 'words'}
			<div class="time">{wordLimit - wordIndex}</div>
		{:else if gameMode === 'zen'}
			<div class="flex flex-row">
				<div class="time">{stopwatch}</div>
			</div>
		{:else}
			<div class="time" />
		{/if}

		{#key toggleReset}
			<div in:blur|local bind:this={wordsEl} class="words">
				{#each words as word}
					<span class="word">
						{#each word as letter}
							<span class="letter">{letter}</span>
						{/each}
					</span>
				{/each}

				<div bind:this={caretEl} class="caret" />
			</div>
			<div class="mt-2 mr-2" tabindex="-1">
				{#if gameMode === 'zen'}, Press 'Enter' to end the game{/if}
			</div>
		{/key}

		<div class="reset">
			<button on:click={resetGame} on:mousedown={(e) => e.preventDefault()} aria-label="reset" tabindex="-1">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					width="24"
					height="24"
					stroke-width="1.5"
					stroke="currentColor"
					fill="none"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"
					/>
				</svg>
			</button>
		</div>
	</div>
{/if}

{#if game === 'game over'}
	<div in:blur class="results">
		<div>
			<p class="text-4xl">wpm</p>
			<p class="score">{Math.trunc($wordsPerMinute)}</p>
		</div>

		<div>
			<p class="text-4xl">acc</p>
			<p class="score">{Math.trunc($accuracy)}%</p>
		</div>

		<button on:click={resetGame} class="play">play again</button>
	</div>
{/if}

<style lang="scss">
	@import url('https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap');

	*,
	*::before,
	*::after {
		box-sizing: border-box;
		font-family: 'Roboto Mono', monospace;
	}

	button {
		font: inherit;
		color: inherit;
		background: none;
		border: none;
		opacity: 0.6;
		transition: all 0.3s ease;

		&:hover {
			cursor: pointer;
			opacity: 1;
		}

		&.selected {
			opacity: 1;
		}
	}

	.game {
		position: absolute;
		top: 41vh;

		.input {
			position: absolute;
			opacity: 0;
		}

		.time {
			position: relative;
			height: 2rem;
			font-size: 1.5rem;
			color: hsl(var(--er));
			opacity: 0;
			transition: all 0.3s ease;
		}

		&[data-game='in progress'] .time {
			opacity: 1;
		}
	}

	.words {
		--line-height: 1em;
		--lines: 3;

		width: 100%;
		max-height: calc(var(--line-height) * var(--lines) * 1.42);
		display: flex;
		flex-wrap: wrap;
		gap: 0.6em;
		position: relative;
		font-size: 1.5rem;
		line-height: var(--line-height);
		overflow: hidden;
		user-select: none;

		.letter {
			opacity: 0.6;
			transition: all 0.3s ease;

			// &:global([data-letter='correct']) {
			// 	opacity: 1;
			// }

			// &:global([data-letter='incorrect']) {
			// 	color: hsl(var(--er));
			// 	opacity: 1;
			// }
		}

		.caret {
			position: absolute;
			height: 1.8rem;
			top: -1px;
			border-right: 2px solid hsl(var(--er));
			animation: caret 1s infinite;
			transition: all 0.3s ease;

			@keyframes caret {
				0%,
				to {
					opacity: 0;
				}
				50% {
					opacity: 1;
				}
			}
		}
	}

	.results {
		position: absolute;
		top: 41vh;

		.score {
			font-size: 4rem;
			color: hsl(var(--er));
		}

		.play {
			margin-top: 1rem;
		}
	}
</style>

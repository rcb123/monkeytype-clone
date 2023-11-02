<script lang="ts">
	import { onMount } from 'svelte';
	import { tweened } from 'svelte/motion';
	import { blur, fade } from 'svelte/transition';

	type Game = 'waiting for input' | 'in progress' | 'game over';
	type GameMode = 'time' | 'words' | 'quotes' | 'zen';
	type WordMode = 'words' | 'sentences' | 'numbers';

	let gameStatus: Game = 'waiting for input';
	let gameMode: GameMode = 'time';
	let wordMode: WordMode = 'words';
	let seconds = 15;
	let timer = seconds;
	let stopwatch = 0;
	let wordLimit = 10;
	let typedLetter = '';
	let words: string[] = [];
	let wordIndex = 0;
	let letterIndex = 0; // Since the letter index starts at 0, the first letter is technically at index 1
	let correctLetters = 0;
	let totalLettersTyped = 0;
	let currentInput = '';
	let wordsPerMinute = tweened(0, { delay: 300, duration: 1000 });
	let accuracy = tweened(0, { delay: 1300, duration: 1000 });

	let wordsEl: HTMLDivElement;
	let letterEl: HTMLSpanElement;
	let inputEl: HTMLInputElement;
	let caretEl: HTMLDivElement;

	let toggleReset = false;
	let overlayVisible = false;

	onMount(async () => {
		await getWords(100);
		focusInput();
		window.addEventListener('keydown', focusInput);
		return () => window.removeEventListener('keydown', focusInput);
	});

	async function getWords(limit: number) {
		const response = await fetch(`/api/words?mode=${wordMode}&limit=${limit}`);
		words = await response.json();
	}

	function startGame() {
		gameStatus = 'in progress';
		if (gameMode === 'time') {
			startTimer();
		} else {
			startStopwatch();
		}
	}

	function startTimer() {
		const interval = setInterval(() => {
			if (timer > 0) timer--;
			if (gameStatus !== 'in progress' || timer === 0) {
				clearInterval(interval);
				if (timer === 0) endGame();
			}
		}, 1000);
	}

	function startStopwatch() {
		const interval = setInterval(() => {
			stopwatch++;
			if (gameStatus !== 'in progress' || stopwatch > 9999) {
				clearInterval(interval);
			}
		}, 1000);
	}

	function endGame() {
		gameStatus = 'game over';
		calculateResults();
	}

	function calculateResults() {
		$wordsPerMinute = calculateWPM();
		$accuracy = calculateAccuracy();
	}

	function calculateWPM() {
		const wordLength = 5;
		const minutes = (gameMode === 'time' ? timer : stopwatch) / 60;
		return minutes ? Math.floor(correctLetters / wordLength / minutes) : 0;
	}

	function calculateAccuracy() {
		return totalLettersTyped ? Math.floor((correctLetters / totalLettersTyped) * 100) : 0;
	}

	async function resetGame() {
		toggleReset = !toggleReset;
		getWords(100);
		gameStatus = 'waiting for input';
		timer = seconds;
		stopwatch = 0;
		wordIndex = 0;
		letterIndex = 0;
		correctLetters = 0;
		totalLettersTyped = 0;
		typedLetter = '';
		currentInput = '';
		$wordsPerMinute = 0;
		$accuracy = 0;
		focusInput();
	}

	async function focusInput() {
		overlayVisible = false;
		await sleep(0);
		inputEl.focus();
	}

	function updateGameState() {
		// checkLetter();
		updateLine();
		moveCaret();
		resetLetter();
	}

	function checkLetter() {
		const correctLetter = words[wordIndex][letterIndex - 1];

		if (typedLetter === correctLetter) {
			letterEl.dataset.letter = 'correct';
			letterEl.className = 'letter opacity-100';
			correctLetters++;
		} else {
			letterEl.dataset.letter = 'incorrect';
			letterEl.className = 'letter opacity-100 text-[hsl(var(--er))]';
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

	function moveCaret() {
		// In the event the caret is moved back to the starting position and the letter is undefined
		if (!letterEl) {
			console.log("Letter element doesn't exist, moving caret to starting position");
			caretEl.style.top = `-4px`;
			caretEl.style.left = `0px`;
			return;
		}

		const offset = 2;
		const { offsetLeft, offsetTop, offsetWidth } = letterEl;

		console.log('Moving Caret to: ' + offsetLeft + ', ' + offsetTop);
		caretEl.style.top = `${offsetTop + offset}px`;
		caretEl.style.left = `${offsetLeft + offsetWidth}px`;
	}

	function setCaret() {
		// In the event the caret is moved back to the starting position and the letter is undefined
		if (!letterEl) {
			console.log("Letter element doesn't exist, moving caret to starting position");
			caretEl.style.top = `-4px`;
			caretEl.style.left = `0px`;
			return;
		}

		const offset = 2;
		const { offsetLeft, offsetTop } = letterEl;

		console.log('Moving Caret to: ' + offsetLeft + ', ' + offsetTop);
		caretEl.style.top = `${offsetTop + offset}px`;
		caretEl.style.left = `${offsetLeft}px`;
	}

	function setLetter() {
		const isWordCompleted = letterIndex > words[wordIndex].length - 1;

		if (!isWordCompleted) {
			console.log(
				"Word isn't completed, setting letter element to index " +
					letterIndex +
					' of word ' +
					wordIndex
			);
			letterEl = wordsEl.children[wordIndex].children[letterIndex] as HTMLSpanElement;
		} else {
			console.log('Word completed, moving to next word');
			nextWord();
			// TODO: Error for the space that wasn't pressed
		}
	}

	function resetLetter() {
		typedLetter = '';
	}

	function nextLetter() {
		totalLettersTyped += 1;
		letterIndex += 1;
	}

	function prevLetter() {
		totalLettersTyped = totalLettersTyped > 0 ? totalLettersTyped - 1 : 0;
		letterIndex -= 1;
	}

	function nextWord() {
		const isNotFirstLetter = letterIndex !== 0;
		console.log('isNotFirstLetter: ' + isNotFirstLetter);

		const isOneLetterWord = words[wordIndex].length === 1;
		console.log('isOneLetterWord: ' + isOneLetterWord);

		if (isNotFirstLetter || isOneLetterWord) {
			console.log('Increasing word index');
			wordIndex++;
			totalLettersTyped++;
			correctLetters++;
			letterIndex = 0;
			setLetter();
			setCaret();
		}

		if (gameMode === 'words') {
			if (wordIndex === wordLimit) {
				endGame();
			}
		}
	}

	function setGameMode(mode: GameMode) {
		gameMode = mode;
		focusInput();
	}

	function setWordMode(mode: WordMode) {
		wordMode = mode;
		getWords(100);
		focusInput();
	}

	/**
	 * Handle keydown events
	 * If the space key is pressed, move to the next word
	 * If the backspace key is pressed, remove the last character
	 * If any other key is pressed, add the character to the input
	 * If the game is in zen mode and the enter key is pressed, end the game
	 * If the game hasn't started yet and a character is pressed, start the game
	 * @param event
	 */
	function handleKeydown(event: KeyboardEvent) {
		// Check if the key pressed is a character
		const isChar = event.key.length === 1;

		// Start the game if it hasn't started yet
		if (gameStatus === 'waiting for input' && isChar) {
			startGame();
		}

		console.log('Key pressed: ' + event.key);

		switch (event.key) {
			case ' ':
				// If the space key is pressed, move to the next word
				console.log('Space key pressed');
				event.preventDefault();
				if (gameStatus === 'in progress' && isWordCompleted()) {
					nextWord();
				}
				break;
			case 'Backspace':
				// If the backspace key is pressed, remove the last character
				removeCharacter();
				break;
			default:
				// If any other key is pressed, add the character to the input
				if (isChar) {
					addCharacter(event.key);
				}
				break;
		}

		// If the game is in zen mode and the enter key is pressed, end the game
		if (gameMode === 'zen' && event.code === 'Enter') {
			endGame();
		}
	}

	function isWordCompleted() {
		return letterIndex >= words[wordIndex].length;
	}

	function addCharacter(character: string) {
		typedLetter = character; // Set the current letter being typed
		currentInput += character; // Append the new character
		setLetter(); // Set the current letter element
		nextLetter(); // Increment the letter index
		checkLetter(); // Check if the letter is correct
		updateGameState(); // Refresh the game state
	}

	function removeCharacter() {
		if (letterIndex > 0) {
			currentInput = currentInput.slice(0, -1); // Remove last character
			console.log('Removing character at index ' + letterIndex + ' of word ' + wordIndex);
			clearLetterStyling();
			prevLetter();
			console.log('New letter index: ' + letterIndex);
			setLetter();
			updateLine();
			setCaret();
			resetLetter();
		}
	}

	function clearLetterStyling() {
		letterEl = wordsEl.children[wordIndex].children[letterIndex - 1] as HTMLSpanElement; // Gross solution
		if (letterEl) {
			if (letterEl.dataset.letter === 'correct') {
				correctLetters -= 1;
			}
			letterEl.dataset.letter = '';
			letterEl.className = 'letter opacity-60';
		}
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

	function sleep(ms: number | undefined) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
</script>

{#if gameStatus !== 'game over'}
	<div class="flex flex-row gap-2 justify-evenly text-center" data-game={gameStatus}>
		{#if gameStatus !== 'in progress'}
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
				<!-- TODO: Populate quotes set and implement mode properly-->
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

	<div class="game w-[95vw]" data-game={gameStatus}>
		<input
			bind:this={inputEl}
			bind:value={typedLetter}
			on:keydown={handleKeydown}
			on:mousedown={(e) => e.preventDefault()}
			on:focus={() => (overlayVisible = false)}
			on:blur={() => (overlayVisible = true)}
			class="input p-0 w-full h-4/5 z-10 cursor-default"
			type="text"
			tabindex="0"
		/>

		{#if overlayVisible}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
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
				{#if gameMode === 'zen'}Press 'Enter' to end the game{/if}
			</div>
		{/key}

		<div class="reset">
			<button
				on:click={resetGame}
				on:mousedown={(e) => e.preventDefault()}
				aria-label="reset"
				tabindex="-1"
			>
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

{#if gameStatus === 'game over'}
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
		}

		.caret {
			position: absolute;
			height: 1.8rem;
			top: -4px;
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

<script lang="ts">
    import { onMount } from 'svelte'
    import { tweened } from 'svelte/motion'
    import { blur } from 'svelte/transition'

    type Game = 'waiting for input' | 'in progress' | 'game over'
    type Word = string

    let game: Game = 'waiting for input'
    let seconds = 5
    let timer = seconds
    let typedLetter = ''
    let toggleReset = false

    let words: Word[] = []

    let wordCount = 100
    let wordIndex = 0
    let letterIndex = 0
    let correctLetters = 0
    let totalLettersTyped = 0

    let wordsPerMinute = tweened(0, {delay: 300, duration: 1000 })
    let accuracy = tweened(0, {delay: 1300, duration: 1000})

    let wordsEl: HTMLDivElement
    let letterEl: HTMLSpanElement
    let inputEl: HTMLInputElement
    let caretEl: HTMLDivElement

    function getWordsPerMinute() {
        const word = 5
        const minutes = 0.5
        return Math.floor(correctLetters / word / minutes)
    }

    function getAccuracy() {
        return Math.floor((correctLetters / totalLettersTyped) * 100)
    }

    function getTotalLetters(words: Word[]) {
        return words.reduce((count, word) => count + word.length, 0)
    }

    function getResults() {
        $wordsPerMinute = getWordsPerMinute()
        $accuracy = getAccuracy()
    }

    function resetGame() {
        toggleReset = !toggleReset

        setGameState('waiting for input')
        getWords(wordCount)

        timer = seconds
        typedLetter = ''
        wordIndex = 0
        letterIndex = 0
        correctLetters = 0
        totalLettersTyped = 0

        $wordsPerMinute = 0
        $accuracy = 0
    }

    function updateGameState() {
        setLetter()
        checkLetter()
        nextLetter()
        updateLine()
        resetLetter()
        moveCaret()
    }

    function setLetter() {
        const isWordCompleted = letterIndex > words[wordIndex].length - 1

        if (!isWordCompleted) {
            letterEl = wordsEl.children[wordIndex].children[
                letterIndex
            ] as HTMLSpanElement
        }
    }

    function checkLetter() {
        const currentLetter = words[wordIndex][letterIndex]

        if (typedLetter === currentLetter) {
            letterEl.dataset.letter = 'correct'
            increaseScore()
        }

        if (typedLetter !== currentLetter) {
            letterEl.dataset.letter = 'incorrect'
        }
    }

    function increaseScore() {
        correctLetters += 1
    }

    function nextLetter() {
        totalLettersTyped += 1
        letterIndex += 1
    }

    function nextWord() {
        const isNotFirstLetter = letterIndex !== 0
        const isOneLetterWord = words[wordIndex].length === 1

        if (isNotFirstLetter || isOneLetterWord) {
            wordIndex += 1
            totalLettersTyped += 1
            letterIndex = 0
            increaseScore()
            moveCaret()
        }
    }

    function updateLine() {
        const wordEl = wordsEl.children[wordIndex]
        const wordsY = wordsEl.getBoundingClientRect().y
        const wordY = wordEl.getBoundingClientRect().y

        if (wordY > wordsY) {
            wordEl.scrollIntoView({ block: 'center' })
        }
    }

    function resetLetter() {
        typedLetter = ''
    }

    function moveCaret() {
        const offset = 4
        const { offsetLeft, offsetTop, offsetWidth } = letterEl

        caretEl.style.top = `${offsetTop + offset}px`
        caretEl.style.left = `${offsetLeft + offsetWidth}px`
    }

    function startGame() {
        setGameState('in progress')
        setGameTimer()
    }

    function setGameState(state: Game) {
        game = state
    }

    function setGameTimer() {
        function gameTimer() {
            if (timer > 0) {
                timer -= 1
            }

            if (game === 'waiting for input' || timer === 0) {
                clearInterval(interval)
            }

            if (timer === 0) {
                setGameState('game over')
                getResults()
            }
        }

        const interval = setInterval(gameTimer, 1000)
    }

    async function getWords(limit: number) {
        const response = await fetch(`/api/words?limit=${limit}`)
        words = await response.json()
    }

    function focusInput() {
        inputEl.focus()
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.code === 'Space') {
            event.preventDefault()

            if (game === 'in progress') {
                nextWord()
            }
        }

        if (game === 'waiting for input') {
            startGame()
        }
    }

    onMount(async () => {
        getWords(wordCount)
        focusInput()
    })
</script>

{#if game !== 'game over'}
    <div class="game" data-game={game}>
        <input
            bind:this={inputEl}
            bind:value={typedLetter}
            on:input={updateGameState}
            on:keydown={handleKeydown}
            class="input"
            type="text"
        />

        <div class="time">{timer}</div>

        {#key toggleReset}
            <div in:blur|local bind:this={wordsEl} class="words">
                {#each words as word}
                    <span class="word">
                        {#each word as letter}
                            <span class="letter">{letter}</span>
                        {/each}
                    </span>
                {/each}

                <div bind:this={caretEl} class="caret"></div>
            </div>
        {/key}

            <div class="reset">
                <button on:click={resetGame} aria-label="reset">
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
            <p class="title">wpm</p>
            <p class="score">{Math.trunc($wordsPerMinute)}</p>
        </div>

        <div>
            <p class="title">accuracy</p>
            <p class="score">{Math.trunc($accuracy)}%</p>
        </div>

        <button on:click={resetGame} class="play">play again</button>
    </div>
{/if}

<style lang="scss">
    .game {
        position: relative;

        .input {
            position: absolute;
            opacity: 0;
        }

        .time {
            position: absolute;
            top: -48px;
            font-size: 1.5rem;
            color: var(--primary);
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
            opacity: 0.4;
            transition: all 0.3s ease;

            &:global([data-letter='correct']) {
                opacity: 0.8;
            }

            &:global([data-letter='incorrect']) {
                color: var(--primary);
                opacity: 1;
            }
        }

        .caret {
            position: absolute;
            height: 1.8rem;
            top: 0;
            border-right: 1px solid var(--primary);
            animation: caret 1s infinite;
            transition: all 0.2s ease;

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
        .title {
            font-size: 2rem;
            color: var(--fg-200);
        }

        .score {
            font-size: 4rem;
            color: var(--primary);
        }

        .play {
            margin-top: 1rem;
        }
    }
</style>
// Manages word creation, movement, typing, and completion

export class WordManager {
    constructor(uiManager, soundManager) {
        this.uiManager = uiManager;
        this.soundManager = soundManager;
        this.movingWords = [];
        this.gameIsOver = false;
        this.wordCreationInterval = null;
        this.animationFrameId = null;
        this.lastFrameTime = null;
        
        // Configuration parameters
        this.INITIAL_WORD_CREATION_INTERVAL = 3000;
        this.WORD_CREATION_INTERVAL = this.INITIAL_WORD_CREATION_INTERVAL;
        this.INITIAL_SHARK_SPEED = 0.3;
        this.BASE_SHARK_SPEED = this.INITIAL_SHARK_SPEED;
        this.BASE_WPM_SCALING_FACTOR = 0.05;
        this.MAX_CONCURRENT_WORDS = 3;
    }

    // Creates a new falling word and adds it to the game
    createFallingWord(words) {
        if (!words || words.length === 0) {
            console.warn("Word list is empty or not initialized. Cannot create word.");
            return;
        }
        
        if (this.movingWords.length >= this.MAX_CONCURRENT_WORDS) return;

        const word = words[Math.floor(Math.random() * words.length)];
        const wordElement = document.createElement('div');
        wordElement.classList.add('moving-shark-word');
        const displayWord = word.replace(/-/g, '–');
        wordElement.innerHTML = `
            <div class="shark-word">
                <div class="shark-body">${displayWord}</div>
            </div>
        `;

        const containerWidth = this.uiManager.elements.wordContainer.offsetWidth;
        const containerHeight = this.uiManager.elements.wordContainer.offsetHeight;
        
        if (containerWidth <= 0 || containerHeight <= 50) {
            console.warn("Word container dimensions invalid, delaying word creation.");
            return;
        }

        this.uiManager.elements.wordContainer.appendChild(wordElement);
        
        const wordHeight = wordElement.offsetHeight;
        const verticalPadding = 5;
        const minY = verticalPadding;
        const maxY = containerHeight - wordHeight - verticalPadding;
        const finalMaxY = Math.max(minY, maxY);
        const randomY = Math.random() * (finalMaxY - minY) + minY;

        wordElement.style.top = `${randomY}px`;
        wordElement.style.left = `${containerWidth}px`;

        this.movingWords.push({
            element: wordElement,
            word: word,
            typed: '',
            locked: false,
            position: containerWidth,
            speed: this.BASE_SHARK_SPEED
        });
    }

    // Animates the movement of shark words
    animateSharkMovement = (timestamp) => {
        if (this.gameIsOver) {
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            return;
        }

        if (!this.lastFrameTime) this.lastFrameTime = timestamp;
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.movingWords.slice().forEach((wordObj) => {
            const originalIndex = this.movingWords.indexOf(wordObj);
            if (originalIndex === -1) return;

            wordObj.position -= wordObj.speed * (deltaTime / 16.67);
            wordObj.element.style.left = `${wordObj.position}px`;

            const wordWidth = wordObj.element.offsetWidth || 100;
            if (wordObj.position < -wordWidth) {
                if (wordObj.element.parentElement) {
                    this.uiManager.elements.wordContainer.removeChild(wordObj.element);
                }
                this.movingWords.splice(originalIndex, 1);
                this.uiManager.decrementLives();
            }
        });

        if (!this.gameIsOver) {
            this.animationFrameId = requestAnimationFrame(this.animateSharkMovement);
        }
    }

    // Handles typing input for words
    handleWordTyping(key) {
        // If a word is already locked and not fully typed, prevent typing other words
        const lockedWord = this.movingWords.find(wordObj => wordObj.locked);
        if (lockedWord && lockedWord.typed.length < lockedWord.word.length) {
            if (lockedWord.word[lockedWord.typed.length] === key) {
                lockedWord.typed += key;
                this.updateWordDisplay(lockedWord);
                this.soundManager.playRandomTypingSound();
                if (lockedWord.typed === lockedWord.word) {
                    this.completeWord(lockedWord);
                }
            } else {
                this.applyWrongKeyPenalty(lockedWord);
            }
            return;
        }

        const wordToLock = this.movingWords.find(wordObj =>
            !wordObj.locked && wordObj.word.startsWith(key)
        );

        if (wordToLock) {
            wordToLock.typed = key;
            wordToLock.locked = true;
            this.updateWordDisplay(wordToLock);
            const sharkWordDiv = wordToLock.element.querySelector('.shark-word');
            if (sharkWordDiv) {
                sharkWordDiv.classList.add('locked-word');
            } else {
                wordToLock.element.classList.add('locked-word');
            }
            this.soundManager.playRandomTypingSound();
            if (wordToLock.typed === wordToLock.word) {
                this.completeWord(wordToLock);
            }
        }
    }

    // Updates the visual display of a word as it's being typed
    updateWordDisplay(wordObj) {
        const sharkBody = wordObj.element.querySelector('.shark-body');
        if (!sharkBody) return;

        // Create a new display with colored typed characters
        sharkBody.innerHTML = wordObj.word.split('').map((char, index) => {
            if (index < wordObj.typed.length) {
                // Style typed characters, including hyphens
                return `<span class="typed-char">${char === '-' ? '–' : char}</span>`;
            }
            return char === '-' ? '–' : char;
        }).join('');
    }

    // Applies a penalty when the wrong key is pressed
    applyWrongKeyPenalty(wordObj) {
        // Increase the word's speed by a small amount
        const SPEED_PENALTY = 0.1;
        wordObj.speed += SPEED_PENALTY;
        
        // Visual feedback for wrong key
        const sharkBody = wordObj.element.querySelector('.shark-body');
        if (sharkBody) {
            sharkBody.classList.add('wrong-key');
            setTimeout(() => {
                if (sharkBody) {
                    sharkBody.classList.remove('wrong-key');
                }
            }, 300);
        }
    }

    // Resets the typing state for all words
    resetCurrentTyping() {
        this.movingWords.forEach(wordObj => {
            wordObj.typed = '';
            wordObj.locked = false;
            const sharkWordDiv = wordObj.element.querySelector('.shark-word');
            if (sharkWordDiv) {
                sharkWordDiv.classList.remove('locked-word');
            } else if (wordObj.element) {
                wordObj.element.classList.remove('locked-word');
            }
            const sharkBody = wordObj.element.querySelector('.shark-body');
            if (sharkBody) {
                sharkBody.innerHTML = wordObj.word.replace(/-/g, '–');
            }
        });
    }

    // Handles word completion when a player successfully types a word
    completeWord(wordObj) {
        const index = this.movingWords.indexOf(wordObj);
        if (index !== -1) {
            const elementToRemove = wordObj.element;

            // Add a "completion" animation before removing
            const sharkWordDiv = elementToRemove.querySelector('.shark-word');
            if (sharkWordDiv) {
                sharkWordDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                sharkWordDiv.style.opacity = '0';
                sharkWordDiv.style.transform = 'scale(1.2)';
            } else {
                elementToRemove.style.transition = 'opacity 0.3s ease';
                elementToRemove.style.opacity = '0';
            }

            // Remove from the array immediately to prevent re-interaction
            this.movingWords.splice(index, 1);

            setTimeout(() => {
                if (elementToRemove && elementToRemove.parentElement) {
                    elementToRemove.parentElement.removeChild(elementToRemove);
                }
            }, 300);

            // Increment score and notify UI
            this.uiManager.incrementScore();
        }
        
        // Ensure typing resets after word completion
        this.resetCurrentTyping();
    }

    // Cleans up all moving words
    clearAllWords() {
        if (this.movingWords) {
            this.movingWords.forEach(wordObj => {
                if (wordObj.element && wordObj.element.parentElement) {
                    wordObj.element.parentElement.removeChild(wordObj.element);
                }
            });
            this.movingWords = [];
        }
    }

    // Stop all word-related intervals and animations
    stopWordMovement() {
        if (this.wordCreationInterval) {
            clearInterval(this.wordCreationInterval);
            this.wordCreationInterval = null;
        }
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    // Updates game difficulty based on WPM
    updateDifficulty(wpm) {
        // More gradual and conservative scaling
        this.WORD_CREATION_INTERVAL = Math.max(1500, this.INITIAL_WORD_CREATION_INTERVAL - (wpm * 50));
        this.MAX_CONCURRENT_WORDS = Math.max(3, Math.ceil(wpm / 10));
        this.BASE_SHARK_SPEED = this.INITIAL_SHARK_SPEED + (wpm * this.BASE_WPM_SCALING_FACTOR);
        
        // Update WPM display in UI
        this.uiManager.updateWpmDisplay(wpm);
    }
}
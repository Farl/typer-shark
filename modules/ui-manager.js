// Manages UI elements, displays, and interactions

import 'confetti';

export class UIManager {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.initialLives = 3; // Store initial lives for reset
        
        // Get all UI elements
        this.elements = {
            score: document.getElementById('score'),
            lives: document.getElementById('lives'),
            wordContainer: document.getElementById('word-container'),
            gameOverModal: document.getElementById('game-over-modal'),
            finalScoreElement: document.getElementById('final-score'),
            restartBtn: document.getElementById('restart-btn'),
            gameWrapper: document.getElementById('game-wrapper'),
            currentWpmElement: document.getElementById('current-wpm'),
            gameHeader: document.getElementById('game-header'),
            gameContainer: document.getElementById('game-container'),
            debugVocabularyMenu: document.getElementById('debug-vocabulary-menu'),
            vocabularyList: document.getElementById('vocabulary-list'),
            toggleDebugMenu: document.getElementById('toggle-debug-menu'), 
            startScreen: document.getElementById('start-screen'),
            themeInput: document.getElementById('theme-input'),
            githubTokenInput: document.getElementById('github-token'),
            startGameBtn: document.getElementById('start-game-btn'),
            startingWpmInput: document.getElementById('starting-wpm'),
            wpmDisplay: document.getElementById('wpm-display'),
            quitGameBtn: document.getElementById('quit-game-btn'),
            mobileTypingInput: document.getElementById('mobile-typing-input'),
            aiErrorModal: document.getElementById('ai-error-modal'),
            aiErrorMessage: document.getElementById('ai-error-message'),
            retryAiBtn: document.getElementById('retry-ai-btn'),
            cancelAiBtn: document.getElementById('cancel-ai-btn'),
        };
        
        // Initialize UI state
        this.loadingOverlay = null;
        this.updateLivesDisplay(); // Initialize lives display correctly
    }

    // Sets up event listeners for the start screen
    setupStartScreen(startCallback) {
        if (!this.elements.startGameBtn) {
            console.error("Start game button not found!");
            return;
        }

        // Ensure only one listener is attached
        this.elements.startGameBtn.removeEventListener('click', startCallback);
        this.elements.startGameBtn.addEventListener('click', startCallback);


        // Add event listener to update WPM display
        if (this.elements.startingWpmInput && this.elements.wpmDisplay) {
            this.elements.startingWpmInput.addEventListener('input', () => {
                const selectedWpm = this.elements.startingWpmInput.value;
                this.elements.wpmDisplay.textContent = selectedWpm;
            });
             // Initial display update
            this.elements.wpmDisplay.textContent = this.elements.startingWpmInput.value;
        }
    }

    // Sets up the restart button event listener
    setupRestartButton(restartCallback) {
        if (this.elements.restartBtn) {
            this.elements.restartBtn.removeEventListener('click', restartCallback);
            this.elements.restartBtn.addEventListener('click', restartCallback);
        }
    }

    // Sets up the quit button event listener
    setupQuitButton(quitCallback) {
        if (this.elements.quitGameBtn) {
            this.elements.quitGameBtn.removeEventListener('click', quitCallback);
            this.elements.quitGameBtn.addEventListener('click', quitCallback);
        }
    }

    // Sets up retry AI button event listener
    setupRetryAiButton(retryCallback) {
        if (this.elements.retryAiBtn) {
            this.elements.retryAiBtn.removeEventListener('click', retryCallback);
            this.elements.retryAiBtn.addEventListener('click', retryCallback);
        }
    }

    // Sets up cancel AI button event listener
    setupCancelAiButton(cancelCallback) {
        if (this.elements.cancelAiBtn) {
            this.elements.cancelAiBtn.removeEventListener('click', cancelCallback);
            this.elements.cancelAiBtn.addEventListener('click', cancelCallback);
        }
    }

    // Sets up debug menu toggle
    setupDebugMenuToggle() {
        if (this.elements.toggleDebugMenu) {
            // Ensure listener is attached only once
            const clickHandler = () => this.toggleDebugVocabularyMenu();
            this.elements.toggleDebugMenu.removeEventListener('click', clickHandler); // Remove previous if any
            this.elements.toggleDebugMenu.addEventListener('click', clickHandler);
        } else {
            console.error("Toggle debug menu button not found!");
        }
    }

    // Toggle debug vocabulary menu visibility
    toggleDebugVocabularyMenu() {
        if (this.elements.debugVocabularyMenu && this.elements.toggleDebugMenu) {
            this.elements.debugVocabularyMenu.classList.toggle('open');
            if (this.elements.debugVocabularyMenu.classList.contains('open')) {
                this.elements.toggleDebugMenu.textContent = 'Close';
                // Blur input when menu is open
                if (this.elements.mobileTypingInput) {
                    this.elements.mobileTypingInput.blur();
                }
            } else {
                this.elements.toggleDebugMenu.textContent = 'Vocabulary';
                // Optionally re-focus input when closing, if game is active
                // Consider game state before focusing
            }
        } else {
            console.error("Debug menu or toggle button not found for toggling!");
        }
    }

    // Update the vocabulary list in the debug menu
    updateDebugVocabularyMenu(words) {
        if (this.elements.vocabularyList && words) {
            // Clear existing list
            this.elements.vocabularyList.innerHTML = '';
            
            // Create debug word elements
            words.forEach(word => {
                const wordElement = document.createElement('span');
                wordElement.classList.add('debug-word');
                wordElement.textContent = word;
                this.elements.vocabularyList.appendChild(wordElement);
            });
        } else if (this.elements.vocabularyList) {
            this.elements.vocabularyList.innerHTML = '<span class="debug-word">No vocabulary loaded.</span>';
        }
    }

    // Shows a loading overlay with optional message
    showLoadingState(message = "Loading...") {
        if (this.loadingOverlay && this.loadingOverlay.parentElement) {
            this.hideLoadingState(); // Remove existing if any
        }
        
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.id = 'loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <p>${message}</p>
            </div>
        `;
        
        if (this.elements.gameWrapper) {
            this.elements.gameWrapper.appendChild(this.loadingOverlay);
        } else {
            console.error("Game wrapper not found for loading overlay.");
            document.body.appendChild(this.loadingOverlay);
        }
    }

    // Removes the loading overlay
    hideLoadingState() {
        if (this.loadingOverlay && this.loadingOverlay.parentElement) {
            this.loadingOverlay.parentElement.removeChild(this.loadingOverlay);
            this.loadingOverlay = null;
        }
    }

    // Shows error modal for AI vocabulary generation issues
    showAiErrorModal(error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        this.elements.aiErrorMessage.textContent = `Could not generate vocabulary: ${errorMessage}`;
        this.elements.aiErrorModal.classList.remove('hidden');
        
        // Blur input if it was focused
        if (this.elements.mobileTypingInput) {
            this.elements.mobileTypingInput.blur();
        }
    }

    // Hides the AI error modal
    hideAiErrorModal() {
        this.elements.aiErrorModal.classList.add('hidden');
    }

    // Shows the game over modal with final score
    showGameOverModal() {
        this.elements.finalScoreElement.textContent = this.score; // Update score display
        this.elements.gameOverModal.classList.remove('hidden');
        
        // Blur input on game over
        if (this.elements.mobileTypingInput) {
            this.elements.mobileTypingInput.blur();
        }
    }

    // Hides the game over modal
    hideGameOverModal() {
        this.elements.gameOverModal.classList.add('hidden');
    }

    // Shows the start screen and hides game elements
    showStartScreen() {
        this.hideAiErrorModal();
        this.hideGameOverModal();
        this.elements.gameHeader.classList.add('hidden');
        this.elements.gameContainer.classList.add('hidden');
        this.elements.startScreen.classList.remove('hidden');
        // Ensure debug menu is closed when returning to start screen
        if (this.elements.debugVocabularyMenu && this.elements.debugVocabularyMenu.classList.contains('open')) {
            this.toggleDebugVocabularyMenu();
        }
    }

    // Shows the game screen and hides start screen
    showGameScreen() {
        this.elements.startScreen.classList.add('hidden');
        this.elements.gameHeader.classList.remove('hidden');
        this.elements.gameContainer.classList.remove('hidden');
    }

    // Update the WPM display in the header
    updateWpmDisplay(wpm) {
        if (this.elements.currentWpmElement) {
            this.elements.currentWpmElement.textContent = Math.round(wpm);
        }
    }

    // Update the Lives display in the header
    updateLivesDisplay() {
        if (this.elements.lives) {
            // Ensure lives don't display below 0
            this.elements.lives.textContent = Math.max(0, this.lives);
        }
    }

    // Increments the score and updates display
    incrementScore() {
        this.score += 10;
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }
        return this.score;
    }

    // Decrements lives and updates display
    decrementLives() {
        if (this.lives > 0) { // Only decrement if lives are positive
           this.lives--;
        }
        this.updateLivesDisplay(); // Update the UI
        return this.lives;
    }

    // Resets score and lives to initial values
    resetScoreAndLives() {
        this.score = 0;
        this.lives = this.initialLives; // Reset to initial value
        if (this.elements.score) {
            this.elements.score.textContent = this.score;
        }
        this.updateLivesDisplay(); // Update lives display
    }

    // Clear the word container
    clearWordContainer() {
        if (this.elements.wordContainer) {
            this.elements.wordContainer.innerHTML = '';
        }
    }

    // Get current theme input value
    getThemeInput() {
        return this.elements.themeInput.value.trim() || 'general';
    }

    // Get GitHub Personal Access Token input value
    getGithubToken() {
        return this.elements.githubTokenInput ? this.elements.githubTokenInput.value.trim() : '';
    }

    // Get starting WPM input value
    getStartingWpm() {
        return parseInt(this.elements.startingWpmInput.value, 10);
    }

    // Reset UI state to defaults for a new game or returning to start
    resetUIState() {
        this.resetScoreAndLives();
        this.clearWordContainer();
        this.hideGameOverModal();
        this.hideAiErrorModal(); // Ensure AI error modal is also hidden
        
        // Reset theme input and WPM slider to default values
        if (this.elements.themeInput) this.elements.themeInput.value = '';
        if (this.elements.startingWpmInput) this.elements.startingWpmInput.value = 15;
        if (this.elements.wpmDisplay) this.elements.wpmDisplay.textContent = 15;
        // Reset current WPM display in header if needed
        if (this.elements.currentWpmElement) this.elements.currentWpmElement.textContent = 15; 
    }

    // Trigger confetti effect (for level ups, etc.)
    triggerConfetti() {
        if (window.confetti) {
            window.confetti({
                particleCount: 150,
                spread: 90,
                origin: { y: 0.6 }
            });
        } else {
            console.warn("Confetti library not loaded.");
        }
    }
}
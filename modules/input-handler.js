// Handles keyboard and mobile input for the game

export class InputHandler {
    constructor(wordManager, uiManager) {
        this.wordManager = wordManager;
        this.uiManager = uiManager;
        this.inputKeydownListener = null;
        this.gameAreaClickListener = null;
    }

    setupEventListeners() {
        const mobileInput = this.uiManager.elements.mobileTypingInput;
        const gameContainer = this.uiManager.elements.gameContainer;
        const debugMenu = this.uiManager.elements.debugVocabularyMenu;

        // Remove existing listeners to prevent duplicates
        if (this.inputKeydownListener) {
            mobileInput.removeEventListener('keydown', this.inputKeydownListener);
        }
        if (this.gameAreaClickListener) {
            gameContainer.removeEventListener('click', this.gameAreaClickListener);
        }

        // Create keydown listener for mobile input
        this.inputKeydownListener = (event) => {
            // Prevent default actions for gameplay keys
            if (/^[a-zA-Z-]$/.test(event.key) || event.key === 'Backspace' || event.key === 'Escape') {
                event.preventDefault();
            }

            // Don't process keys if game is over or debug menu is open
            if (this.wordManager.gameIsOver) return;
            if (debugMenu && debugMenu.classList.contains('open')) return;

            if (event.key === 'Escape') {
                this.wordManager.resetCurrentTyping();
                mobileInput.value = '';
            } else if (event.key === 'Backspace') {
                // Currently does nothing
            } else if (/^[a-zA-Z-]$/.test(event.key)) {
                this.wordManager.handleWordTyping(event.key.toLowerCase());
            }

            // Keep the input field clear
            setTimeout(() => {
                if (mobileInput) {
                    mobileInput.value = '';
                }
            }, 0);
        };
        
        if (mobileInput) {
            mobileInput.addEventListener('keydown', this.inputKeydownListener);
        }

        // Create click listener for game area to focus the input
        this.gameAreaClickListener = () => {
            if (!this.wordManager.gameIsOver && 
                !(debugMenu && debugMenu.classList.contains('open'))) {
                if (mobileInput) {
                    mobileInput.focus();
                }
            }
        };
        
        if (gameContainer) {
            gameContainer.addEventListener('click', this.gameAreaClickListener);
        }
    }

    // Focuses the mobile input field if it exists
    focusInput() {
        if (this.uiManager.elements.mobileTypingInput) {
            setTimeout(() => {
                this.uiManager.elements.mobileTypingInput.focus();
                this.uiManager.elements.mobileTypingInput.value = '';
            }, 100);
        }
    }

    // Blurs the mobile input field if it exists
    blurInput() {
        if (this.uiManager.elements.mobileTypingInput) {
            this.uiManager.elements.mobileTypingInput.blur();
        }
    }
}
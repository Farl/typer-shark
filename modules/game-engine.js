// Core game logic and state management

export class GameEngine {
    constructor(uiManager, wordManager, vocabularyService, inputHandler, soundManager) {
        this.uiManager = uiManager;
        this.wordManager = wordManager;
        this.vocabularyService = vocabularyService;
        this.inputHandler = inputHandler;
        this.soundManager = soundManager;
        
        // Game configuration
        this.BASE_WPM = 15;  // Default starting WPM
        this.WPM_INCREMENT = 3;  // How much WPM increases per level
        this.WPM_INCREMENT_INTERVAL = 300;  // Score needed to increase WPM
        
        // Game state
        this.words = [];
        this.gameIsOver = false;

        // Subscribe to UI events for score and lives changes
        this.subscribeToScoreChanges(); 
    }

    // Handles game start from the start screen
    async handleStartGame() {
        const theme = this.uiManager.getThemeInput();
        const startingWpm = this.uiManager.getStartingWpm();
        const githubToken = this.uiManager.getGithubToken();
        this.vocabularyService.currentTheme = theme;
        
        this.uiManager.showLoadingState("Generating Vocabulary...");

        try {
            this.words = await this.vocabularyService.fetchAndProcessVocabulary(theme, githubToken);
            this.uiManager.updateDebugVocabularyMenu(this.words);
            this.uiManager.showGameScreen();
            this.uiManager.hideLoadingState();
            
            this.BASE_WPM = startingWpm;
            this.initializeGame(); // Initializes and starts the game loop

            // Focus input for typing
            setTimeout(() => {
                this.inputHandler.focusInput();
            }, 100);

        } catch (error) {
            console.error('Vocabulary generation failed:', error);
            this.uiManager.hideLoadingState();
            this.uiManager.showAiErrorModal(error);
        }
    }

    // Retry AI vocabulary generation after an error
    async handleRetryAi() {
        this.uiManager.hideAiErrorModal();
        this.uiManager.showLoadingState("Retrying Vocabulary Generation...");

        try {
            this.words = await this.vocabularyService.fetchAndProcessVocabulary(
                this.vocabularyService.currentTheme
            );
            this.uiManager.updateDebugVocabularyMenu(this.words);
            this.uiManager.showGameScreen();
            this.uiManager.hideLoadingState();
            
            const startingWpm = this.uiManager.getStartingWpm();
            this.BASE_WPM = startingWpm;
            this.initializeGame(); // Initializes and starts the game loop

            // Focus input
            setTimeout(() => {
                this.inputHandler.focusInput();
            }, 100);

        } catch (error) {
            console.error('Vocabulary generation failed on retry:', error);
            this.uiManager.hideLoadingState();
            this.uiManager.showAiErrorModal(error);
        }
    }

    // Cancel AI vocabulary generation and return to start screen
    handleCancelAi() {
        this.uiManager.hideAiErrorModal();
        this.uiManager.showStartScreen();
    }

    // Initialize a new game state
    initializeGame() {
        this.resetGame();
    }

    // Reset the game state and start the game loop
    resetGame() {
        this.uiManager.resetScoreAndLives(); // Reset score and lives first
        this.wordManager.updateDifficulty(this.BASE_WPM); // Set initial difficulty
        this.gameIsOver = false;
        this.wordManager.gameIsOver = false;
        this.wordManager.clearAllWords();
        this.uiManager.clearWordContainer();
        this.uiManager.hideGameOverModal(); // Ensure game over modal is hidden
        
        // Start the game loop
        this.startGameLoop();
        
        // Focus input field
        setTimeout(() => {
            this.inputHandler.focusInput();
        }, 100);
    }

    // Start the main game loop
    startGameLoop() {
        this.wordManager.stopWordMovement(); // Ensure any previous loops are stopped
        
        // Start word creation interval
        this.wordManager.wordCreationInterval = setInterval(() => {
            if (!this.gameIsOver) { // Check game over flag directly
                this.wordManager.createFallingWord(this.words);
            } else {
                 // Stop creating words if game is over
                clearInterval(this.wordManager.wordCreationInterval);
                this.wordManager.wordCreationInterval = null;
            }
        }, this.wordManager.WORD_CREATION_INTERVAL);

        // Start animation frame for word movement
        this.wordManager.lastFrameTime = null;
        this.wordManager.animationFrameId = requestAnimationFrame(this.wordManager.animateSharkMovement);
    }

    // Check if the game is over (triggered by decrementLives override)
    checkGameOver() {
        // Check if lives are zero or less AND the game isn't already marked as over
        if (this.uiManager.lives <= 0 && !this.gameIsOver) {
            this.gameIsOver = true;
            this.wordManager.gameIsOver = true; // Ensure word manager knows
            this.wordManager.stopWordMovement(); // Stop creating/moving words
            
            // Blur input on game over
            this.inputHandler.blurInput();
            
            // Show game over modal
            this.uiManager.showGameOverModal(); // Display the modal
        }
    }

    // Handle score increments and difficulty updates
    handleScoreIncrement(newScore) {
        if (this.gameIsOver) return; // Do nothing if game is already over

        // Update difficulty every WPM_INCREMENT_INTERVAL points
        const previousWpmTier = Math.floor((newScore - 10) / this.WPM_INCREMENT_INTERVAL);
        const currentWpmTier = Math.floor(newScore / this.WPM_INCREMENT_INTERVAL);

        if (currentWpmTier > previousWpmTier) {
            const newWpm = this.BASE_WPM + currentWpmTier * this.WPM_INCREMENT;
            this.wordManager.updateDifficulty(newWpm);
            this.uiManager.triggerConfetti();
        }
    }

    // Handle game restart from game over screen
    handleRestart() {
        this.wordManager.stopWordMovement();
        this.wordManager.clearAllWords();
        this.uiManager.resetUIState(); // Use the dedicated reset function
        this.uiManager.showStartScreen();
    }

    // Handle quit button to return to start screen
    handleQuit() {
        this.gameIsOver = true; // Mark game as over immediately
        this.wordManager.gameIsOver = true;
        this.wordManager.stopWordMovement();
        this.wordManager.clearAllWords();
        this.inputHandler.blurInput(); // Blur input when quitting
        this.uiManager.resetUIState(); // Use the dedicated reset function
        this.uiManager.showStartScreen();
    }

    // Update the observer class when score changes
    // This replaces the original UI manager methods with wrappers
    // that notify the game engine about changes.
    subscribeToScoreChanges() {
        const originalIncrementScore = this.uiManager.incrementScore;
        this.uiManager.incrementScore = () => {
            // Don't increment score if game is over
            if (this.gameIsOver) return this.uiManager.score;
            
            const newScore = originalIncrementScore.call(this.uiManager);
            this.handleScoreIncrement(newScore); // Notify engine about score change
            return newScore;
        };
        
        const originalDecrementLives = this.uiManager.decrementLives;
        this.uiManager.decrementLives = () => {
            // Don't decrement lives if game is already over
            if (this.gameIsOver) return this.uiManager.lives;
            
            const newLives = originalDecrementLives.call(this.uiManager);
            // Check game over state immediately after lives decrement
            this.checkGameOver(); 
            return newLives;
        };
    }
}
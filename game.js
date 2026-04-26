// This file is now the main entry point that orchestrates the modules
// Most code has been moved to separate modules for better organization

import { VocabularyService } from './modules/vocabulary-service.js';
import { InputHandler } from './modules/input-handler.js';
import { WordManager } from './modules/word-manager.js';
import { UIManager } from './modules/ui-manager.js';
import { GameEngine } from './modules/game-engine.js';
import { SoundManager } from './modules/sound-manager.js';

class TyperSharkGame {
    constructor() {
        // Initialize managers and services in the right order
        this.uiManager = new UIManager();
        this.soundManager = new SoundManager(['/type1.mp3', '/type2.mp3', '/type3.mp3']);
        this.vocabularyService = new VocabularyService();
        this.wordManager = new WordManager(this.uiManager, this.soundManager);
        this.inputHandler = new InputHandler(this.wordManager, this.uiManager);
        this.gameEngine = new GameEngine(
            this.uiManager, 
            this.wordManager,
            this.vocabularyService,
            this.inputHandler,
            this.soundManager
        );
        
        // Initialize the game
        this.setupGame();
    }

    setupGame() {
        // Set up UI event listeners
        this.uiManager.setupStartScreen(() => this.gameEngine.handleStartGame());
        this.uiManager.setupRestartButton(() => this.gameEngine.handleRestart());
        this.uiManager.setupQuitButton(() => this.gameEngine.handleQuit());
        this.uiManager.setupRetryAiButton(() => this.gameEngine.handleRetryAi());
        this.uiManager.setupCancelAiButton(() => this.gameEngine.handleCancelAi());
        this.uiManager.setupDebugMenuToggle();
        
        // Set up input handler
        this.inputHandler.setupEventListeners();
    }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new TyperSharkGame();
});
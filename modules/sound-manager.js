// Manages sound effects for the game

export class SoundManager {
    constructor(soundPaths) {
        this.typingSounds = soundPaths || [];
        this.audioElements = this.typingSounds.map(path => {
            const audio = new Audio(path);
            audio.preload = 'auto';
            audio.volume = 0.4;
            return audio;
        });
    }

    // Play a random typing sound from the available sounds
    playRandomTypingSound() {
        // Find an audio element that is not currently playing
        const availableAudio = this.audioElements.find(audio => audio.paused);
        
        if (availableAudio) {
            // Reset to beginning and play immediately
            availableAudio.currentTime = 0;
            availableAudio.play().catch(error => {
                console.warn('Could not play typing sound:', error);
            });
        }
    }
}
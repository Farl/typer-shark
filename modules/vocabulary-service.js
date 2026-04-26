// Handles AI-powered vocabulary generation and processing

const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';
const GITHUB_MODEL = 'gpt-4o-mini';

export class VocabularyService {
    constructor() {
        this.currentTheme = 'general';
        this.githubToken = '';
    }

    async fetchAndProcessVocabulary(theme, githubToken) {
        console.log(`Fetching vocabulary for theme: ${theme}`);
        this.currentTheme = theme; // Store the current theme for retries
        if (githubToken) this.githubToken = githubToken;

        // Fall back to build-time injected token if UI field is empty
        if (!this.githubToken) {
            const injected = window.__GITHUB_TOKEN__;
            if (injected && !injected.includes('PLACEHOLDER')) {
                this.githubToken = injected;
            }
        }

        if (!this.githubToken) {
            throw new Error('GitHub token is required. Please enter your GitHub Personal Access Token.');
        }

        try {
            const response = await fetch(GITHUB_MODELS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.githubToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: GITHUB_MODEL,
                    messages: [
                        {
                            role: "system",
                            content: `You are a vocabulary generator. Output ONLY a raw JSON array of strings, with no markdown, no code blocks, no explanation. Generate 200 unique words or short hyphenated phrases specifically related to the theme: ${theme}. Each item must contain only lowercase letters a-z and hyphens, be between 1 and 24 characters long. Example output: ["word","another-word","example"]`
                        },
                        {
                            role: "user",
                            content: `Generate the word list for theme: ${theme}`
                        }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`GitHub Models API error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const rawContent = data.choices[0].message.content;
            let parsed;
            try {
                parsed = JSON.parse(rawContent);
            } catch {
                // Try to extract JSON array from the content
                const match = rawContent.match(/\[[\s\S]*\]/);
                if (match) {
                    parsed = JSON.parse(match[0]);
                } else {
                    // Maybe it's a JSON object with a words key
                    throw new Error('Could not parse AI response as JSON array.');
                }
            }
            // Support both array and object with a words/list key
            const generatedWords = Array.isArray(parsed)
                ? parsed
                : (parsed.words || parsed.list || parsed.vocabulary || Object.values(parsed)[0]);
            if (!Array.isArray(generatedWords)) {
                throw new Error("AI response was not a valid JSON array.");
            }
            
            const processedWords = generatedWords
                .map(word => String(word).toLowerCase().trim())
                .filter(word => /^[a-z-]+$/.test(word) && word.length > 0 && word.length < 25)
                .filter((value, index, self) => self.indexOf(value) === index);

            if (processedWords.length < 10) {
                throw new Error("Not enough valid words generated for the theme.");
            }

            return this.shuffleArray(processedWords);
        } catch (parseError) {
            console.error('Error parsing or processing vocabulary:', parseError, 'Raw response:', parseError.content || '');
            throw new Error(`Failed to process vocabulary: ${parseError.message}`);
        }
    }

    getDefaultWords() {
        return [
            'shark', 'ocean', 'wave', 'fish', 'swim', 
            'dive', 'water', 'marine', 'deep', 'current',
            'coral', 'whale', 'tide', 'sail', 'boat',
            'pearl', 'shell', 'surf', 'reef', 'salt',
            'sea-lion', 'star-fish', 'high-tide', 'low-tide'
        ];
    }

    shuffleArray(array) {
        const newArray = [...array]; // Create a copy to avoid mutating the original
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
}
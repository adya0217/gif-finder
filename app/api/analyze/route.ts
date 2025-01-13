import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        // Parse the incoming request body
        const { text } = await req.json();

        // Construct the prompt for general text analysis using Gemini's capabilities
        const prompt = `Analyze the following text and provide the following:

1. Extract four key keywords or phrases that capture the main ideas, facts, or concepts of the text.
2. Identify the dominant emotions or sentiment expressed in the text (e.g., playfulness, curiosity, lightheartedness, introspection).
3. Provide a list of relevant synonyms, metaphorical meanings, or associated terms that capture the essence of the text. For example, if the text talks about "detachment from work," terms like "relaxed," "light-hearted," "carefree" might be relevant.
4. Dont focus much on the nouns , rather on verbs and emotions.
5. Dont dive much into the texts if the promts are simple
Format your response like this:
- Keywords: word1, word2, word3, word4
- Emotion: emotion1, emotion2 
- GIFs: [URL1, URL2, URL3]

It should be displayed in the way it best describes the text

Text to analyze: "${text}"`;

        // Use Google Generative AI to generate the response
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Parse the response text
        const lines = response.text().split('\n');

        // Extract keywords and emotion from the response
        const keywords = lines[0].replace('Keywords:', '').split(',').map(k => k.trim());
        const emotion = lines[1].replace('Emotion:', '').trim();

        // Extract related GIF URLs from the response
        const gifsLine = lines[2].replace('GIFs:', '').trim();
        const gifs = gifsLine ? gifsLine.split(',').map(url => url.trim()) : [];

        // Combine all terms for GIF search (keywords + emotion)
        const searchTerms = [...keywords, emotion];

        // Filter GIFs based on the relevance to the identified keywords, emotions, and metaphorical terms
        const filteredGIFs = filterGIFs(gifs, keywords, emotion, searchTerms);

        // Return the analysis results
        return Response.json({
            keywords: keywords,
            emotion: emotion,
            GIFs: filteredGIFs
        });
    } catch (error) {
        // Handle any errors gracefully
        console.error("Error analyzing text:", error);
        return Response.json({ error: "Failed to analyze text" }, { status: 500 });
    }
}

// Function to filter GIFs based on relevance to keywords, emotions, and related terms
function filterGIFs(gifs: string[], keywords: string[], emotion: string, searchTerms: string[]): string[] {
    return gifs.filter(gifUrl => {
        const gifTags = getGifTags(gifUrl); // Simulated function to extract GIF tags
        const matchesKeyword = keywords.some(keyword => gifTags.includes(keyword));
        const matchesEmotion = gifTags.includes(emotion.toLowerCase());
        const matchesSearchTerm = searchTerms.some(term => gifTags.includes(term.toLowerCase()));

        return (matchesKeyword || matchesSearchTerm) || matchesEmotion;
    });
}

// Example function to simulate extracting tags for a GIF (in practice, this would call an API to get metadata)
function getGifTags(gifUrl: string): string[] {
    // Simulated tags for GIFs; in a real scenario, you'd use an API to fetch GIF data
    const sampleTags: { [key: string]: string[] } = {
        'exampleGif1': ['playful', 'curiosity', 'fun', 'exploring'],
        'exampleGif2': ['lighthearted', 'carefree', 'laugh', 'funny'],
        'exampleGif3': ['relaxed', 'peaceful', 'introspection'],
        'exampleGif4': ['thoughtful', 'contemplative', 'reflective'],
        'exampleGif5': ['curious', 'exploration', 'wonder'],
        'exampleGif6': ['detached', 'chilled', 'laid-back'],
    };

    // If the gifUrl is found in the sampleTags, return its associated tags
    return sampleTags[gifUrl] || [];  // If not found, return an empty array
}

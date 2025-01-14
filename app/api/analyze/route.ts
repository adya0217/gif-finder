import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
    try {
        // Parse the incoming request body
        const { text } = await req.json();

        // Construct the prompt for text analysis using Gemini's capabilities
        const prompt = `Analyze the following text and provide:
1. Four key keywords or phrases capturing the main ideas or concepts.
2. Dominant emotions or sentiments expressed (e.g., playfulness, curiosity, introspection).
3. Relevant synonyms or metaphorical terms associated with the text.
4. Ignore simple nouns; focus on verbs and emotions.
5. Provide relevant GIF keywords if applicable.
Format:
- Keywords: word1, word2, word3, word4
- Emotion: emotion1, emotion2
- GIF Keywords: keyword1, keyword2, keyword3

Text: "${text}"`;

        // Generate the response using Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        // Parse the response text
        const lines = response.text().split('\n');
        const keywords = lines[0].replace('Keywords:', '').split(',').map(k => k.trim());
        const emotions = lines[1].replace('Emotion:', '').split(',').map(e => e.trim());
        const gifKeywords = lines[2].replace('GIF Keywords:', '').split(',').map(g => g.trim());

        // Combine keywords and emotions for GIF search
        const searchTerms = [...keywords, ...emotions, ...gifKeywords];

        // Fetch GIF metadata using GIPHY API for each search term
        const gifs = await Promise.all(
            searchTerms.map(async (term: string) => {
                const response = await fetch(
                    `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(term)}&limit=10`
                );
                const data = await response.json();

                // Retrieve metadata for each GIF
                return data.data.map((gif: any) => ({
                    id: gif.id,
                    url: gif.images.original.url,
                    tags: gif.title.toLowerCase().split(' '), // Simplified example of extracting tags from the title
                    rating: gif.rating,
                    analytics: gif.analytics, // Include analytics data if needed
                }));
            })
        );

        // Flatten the array of GIF results
        const allGIFs = gifs.flat();

        // Filter GIFs based on relevance to keywords, emotions, and search terms using metadata
        const filteredGIFs = allGIFs.filter(gif => {
            const matchesKeyword = keywords.some(keyword => gif.tags.includes(keyword.toLowerCase()));
            const matchesEmotion = emotions.some(emotion => gif.tags.includes(emotion.toLowerCase()));
            const matchesSearchTerm = searchTerms.some(term => gif.tags.includes(term.toLowerCase()));

            return matchesKeyword || matchesEmotion || matchesSearchTerm;
        });

        // Return the analysis results
        return Response.json({
            keywords,
            emotions,
            GIFs: filteredGIFs.map(gif => gif.url), // Only return the URLs of filtered GIFs
        });
    } catch (error) {
        console.error("Error analyzing text:", error);
        return Response.json({ error: "Failed to analyze text" }, { status: 500 });
    }
}

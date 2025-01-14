export async function POST(req: Request) {
    try {
        const { keywords } = await req.json();
        const gifs = await Promise.all(
            keywords.map(async (keyword: string) => {
                const response = await fetch(
                    `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(keyword)}&limit=5`
                );
                const data = await response.json();
                return {
                    keyword,
                    gifUrl: data.data[0]?.images.original.url
                };
            })
        );

        return Response.json({ gifs });
    } catch (error) {
        return Response.json({ error: "Failed to fetch GIFs" }, { status: 500 });
    }
}

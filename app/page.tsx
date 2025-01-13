"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

// Define a type for the GIF object
type Gif = {
  keyword: string;
  gifUrl: string;
};

export default function Home() {
  const [text, setText] = useState("");
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeAndFetchGifs = async () => {
    try {
      setLoading(true);
      setError("");

      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const { keywords } = await analyzeResponse.json();

      const gifsResponse = await fetch("/api/gifs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords }),
      });
      const { gifs: gifResults } = await gifsResponse.json();

      setGifs(Array.isArray(gifResults) ? gifResults : []);
    } catch (error) {
      setError("Something went wrong. Please try again.");
      console.error("Error:", error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Text to GIF Magic ✨</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transform your thoughts into GIFs! Enter any text and watch as AI finds the
            perfect GIFs to match your message.
          </p>
        </div>

        {/* Main Input Card */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6 mb-12">
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Share your thoughts, story, or message here..."
              className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700"
            />

            <button
              onClick={analyzeAndFetchGifs}
              disabled={loading || !text.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Discovering GIFs...
                </>
              ) : (
                "Transform to GIFs"
              )}
            </button>

            {error && (
              <div className="text-red-500 text-center p-2 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Grid */}
        {gifs.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
              Your Story in GIFs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gifs.map(({ keyword, gifUrl }, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-200"
                >
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{keyword}</h3>
                    <div className="relative aspect-video">
                      <img
                        src={gifUrl}
                        alt={keyword}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

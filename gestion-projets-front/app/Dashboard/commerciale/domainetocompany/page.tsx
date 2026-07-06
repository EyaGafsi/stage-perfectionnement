"use client";

import { useState } from "react";

export default function Home() {
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchCompanies = async () => {
    setLoading(true);
    setResults([]);

    try {
      const res = await fetch(
        process.env.NEXT_PUBLIC_AI_Indistry_Company_API_URL!,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            domain,
            country,
            max_results: Number(maxResults),
          }),
        }
      );

      const data = await res.json();
      setResults(data.results || []);
    } catch (error) {
      console.error(error);
      alert("API Error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Company Finder
        </h1>

        {/* INPUTS */}
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="text"
            placeholder="Domain (bank, IT...)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Max Results"
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value, 10))}
            className="border p-3 rounded-xl"
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={searchCompanies}
          className="w-full mt-6 bg-black text-white py-3 rounded-xl hover:bg-gray-800"
        >
          {loading ? "Searching..." : "Search"}
        </button>

        {/* RESULTS */}
        <div className="mt-8 space-y-3">
          {results.map((company, index) => (
            <div
              key={index}
              className="border rounded-xl p-4 bg-white hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold">{company}</h2>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

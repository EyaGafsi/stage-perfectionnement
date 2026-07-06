"use client";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"predict" | "company">("predict");

  // Predict state
  const [service, setService] = useState("");
  const [predictResult, setPredictResult] = useState<any>(null);
  const [predictLoading, setPredictLoading] = useState(false);

  // Company state
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("");
  const [maxResults, setMaxResults] = useState(5);
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [companyError, setCompanyError] = useState("");

  const handlePredict = async () => {
    if (!service.trim()) return;
    setPredictLoading(true);
    setPredictResult(null);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_AI_Industry_Estimator_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      const data = await res.json();
      setPredictResult(data);
    } catch (error: any) {
      setPredictResult({ success: false, error: error.message });
    } finally {
      setPredictLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!domain.trim()) return;
    setCompanyLoading(true);
    setCompanies([]);
    setCompanyError("");
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_AI_Indistry_Company_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, country, max_results: Number(maxResults) }),
      });
      const data = await res.json();
      setCompanies(data.results || []);
    } catch (error: any) {
      setCompanyError(error.message);
    } finally {
      setCompanyLoading(false);
    }
  };

  const confidence = predictResult?.confidence
    ? Math.round(predictResult.confidence * 100)
    : null;
  const confidenceColor =
    confidence !== null
      ? confidence >= 75
        ? "#0d9488"
        : confidence >= 45
        ? "#f59e0b"
        : "#ef4444"
      : "#888";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex flex-col items-center px-4 py-8 md:py-12">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(13, 148, 136, 0.2);
          }
          50% {
            box-shadow: 0 0 25px rgba(13, 148, 136, 0.35);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.5s ease-out;
        }

        .glow-teal {
          animation: glow 2s ease-in-out infinite;
        }

        input:focus {
          border-color: #0d9488 !important;
          background-color: rgba(13, 148, 136, 0.03) !important;
          box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.08) !important;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(13, 148, 136, 0.08);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: #0d9488;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #0f766e;
        }
      `}</style>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="mb-8 md:mb-12 text-center animate-fadeInUp">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg glow-teal">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Industry Intelligence
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            AI-powered sector analysis and company discovery
          </p>
          <div className="flex justify-center gap-2 mt-4 flex-wrap">
            <span className="text-xs font-semibold bg-teal-100 border border-teal-300 rounded-lg px-3 py-1.5 text-teal-700">
              AI Powered
            </span>
            <span className="text-xs font-semibold bg-blue-100 border border-blue-300 rounded-lg px-3 py-1.5 text-blue-700">
              Real-time Analysis
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 bg-white/60 backdrop-blur-md rounded-xl p-1.5 mb-6 border border-gray-200 shadow-sm">
          {(["predict", "company"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-lg transition-all duration-300 ${
                activeTab === tab
                  ? "bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-md shadow-teal-200 scale-105"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
              }`}
            >
              {tab === "predict" 
                ? "Industry Prediction" 
                : "Company Finder"}
            </button>
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-2xl p-6 md:p-8 shadow-lg animate-fadeInUp">
          
          {/* ── PREDICT PANEL ── */}
          {activeTab === "predict" && (
            <div className="space-y-6 animate-slideInLeft">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2.5">
                  Service or Product Description
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePredict()}
                  placeholder="e.g. cloud storage for medical records, fintech payments API…"
                  className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none text-gray-900 placeholder-gray-400 transition-all duration-300 shadow-sm"
                />
              </div>

              <button
                onClick={handlePredict}
                disabled={predictLoading || !service.trim()}
                className="w-full py-3 text-sm font-bold bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-teal-200 hover:shadow-teal-300 disabled:shadow-none"
              >
                {predictLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Analyzing…
                  </span>
                ) : (
                  "Predict Industry"
                )}
              </button>

              {/* Predict Result */}
              {predictResult && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-4">
                    Prediction Result
                  </p>

                  {predictResult.success === false ? (
                    <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                      <p className="text-sm text-red-700">{predictResult.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {predictResult.industry && (
                        <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-300 rounded-xl p-4">
                          <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-700">
                            {predictResult.industry}
                          </p>
                        </div>
                      )}

                      {confidence !== null && (
                        <div className="bg-gray-50 border border-gray-300 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-gray-700 font-semibold">
                              Confidence Score
                            </span>
                            <span 
                              className="text-sm font-bold"
                              style={{ color: confidenceColor }}
                            >
                              {confidence}%
                            </span>
                          </div>
                          <div className="relative h-2 rounded-full bg-gray-300 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700 shadow-md"
                              style={{
                                width: `${confidence}%`,
                                background: `linear-gradient(90deg, ${confidenceColor}, ${confidenceColor}dd)`,
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ background: confidenceColor }}
                            />
                            <span className="text-xs text-gray-600">
                              {confidence >= 75 ? "High confidence" : confidence >= 45 ? "Medium confidence" : "Low confidence"}
                            </span>
                          </div>
                        </div>
                      )}

                      {predictResult.sub_sectors?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-700 mb-3 font-semibold">Related Sectors</p>
                          <div className="flex flex-wrap gap-2">
                            {predictResult.sub_sectors.map((s: string, i: number) => (
                              <span
                                key={i}
                                className="text-xs px-3 py-1.5 rounded-lg bg-teal-100 text-teal-700 border border-teal-300 hover:bg-teal-200 transition-all duration-300"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <details className="group">
                        <summary className="text-xs text-gray-600 cursor-pointer hover:text-teal-600 transition-colors font-semibold">
                          View Raw Response
                        </summary>
                        <pre className="mt-3 text-xs bg-gray-100 border border-gray-300 rounded-xl p-4 overflow-x-auto leading-relaxed font-mono text-gray-800 max-h-48 overflow-y-auto">
                          {JSON.stringify(predictResult, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── COMPANY PANEL ── */}
          {activeTab === "company" && (
            <div className="space-y-6 animate-slideInLeft">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    label: "Domain",
                    value: domain,
                    setter: setDomain,
                    placeholder: "bank, IT, health…",
                    type: "text",
                  },
                  {
                    label: "Country",
                    value: country,
                    setter: setCountry,
                    placeholder: "France, USA…",
                    type: "text",
                  },
                  {
                    label: "Max Results",
                    value: maxResults,
                    setter: setMaxResults,
                    placeholder: "5",
                    type: "number",
                  },
                ].map(({ label, value, setter, placeholder, type }) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold uppercase tracking-widest text-teal-700 mb-2.5">
                      {label}
                    </label>
                    <input
                      type={type}
                      value={value}
                      onChange={(e) =>
                        setter(
                          type === "number"
                            ? (e.target.value as any)
                            : e.target.value
                        )
                      }
                      placeholder={placeholder}
                      className="w-full px-4 py-3 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none text-gray-900 placeholder-gray-400 transition-all duration-300 shadow-sm"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSearch}
                disabled={companyLoading || !domain.trim()}
                className="w-full py-3 text-sm font-bold bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-teal-200 hover:shadow-teal-300 disabled:shadow-none"
              >
                {companyLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Searching…
                  </span>
                ) : (
                  "Search Companies"
                )}
              </button>

              {/* Company Results */}
              {(companies.length > 0 || companyError) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {companyError ? (
                    <div className="bg-red-50 border border-red-300 rounded-xl p-4">
                      <p className="text-sm text-red-700">{companyError}</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold uppercase tracking-widest text-teal-700 mb-4">
                        {companies.length} Companies Found
                        <span className="text-gray-600"> • {domain}</span>
                        {country && <span className="text-gray-600"> • {country}</span>}
                      </p>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {companies.map((company, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-teal-400 hover:bg-teal-50 transition-all duration-300 group"
                          >
                            <span className="text-xs font-bold text-teal-600 min-w-[24px] tabular-nums">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-sm font-medium text-gray-900 flex-1 group-hover:text-teal-700 transition-colors">
                              {company}
                            </span>
                            <span className="text-teal-500 text-lg group-hover:translate-x-1 transition-transform">
                              →
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-600 font-medium">
          <p>Advanced AI Analysis • Real-time Data Processing</p>
        </div>
      </div>
    </div>
  );
}
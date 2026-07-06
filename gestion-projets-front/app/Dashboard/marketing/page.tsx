"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Download, Copy, Trash2, Settings2, Image as ImageIcon, ChevronDown } from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("simple");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, result]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_Image_generation_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode }),
      });

      const data = await res.json();
      
      const newEntry = {
        id: Date.now(),
        original_prompt: data.original_prompt,
        used_prompt: data.used_prompt,
        enriched_prompt: data.enriched_prompt,
        image_base64: data.image_base64,
        success: data.success,
        error: data.error,
        timestamp: new Date(),
        mode: mode,
      };

      setHistory([...history, newEntry]);
      setResult(newEntry);
      setPrompt("");
    } catch (error: any) {
      const errorEntry = {
        id: Date.now(),
        original_prompt: prompt,
        success: false,
        error: error.message,
        timestamp: new Date(),
        mode: mode,
      };
      setHistory([...history, errorEntry]);
      setResult(errorEntry);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = (base64: string) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${base64}`;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    setResult(null);
  };

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
      {/* Main content area - considering sidebar */}
      <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        
        {/* Custom Header for this page */}
        <header className="sticky top-0 z-20 bg-gradient-to-r from-white via-cyan-50 to-teal-50 border-b border-cyan-200/50 shadow-sm">
          <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
                <ImageIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-lg font-bold text-slate-900 truncate">Générateur d'Images</h1>
                <p className="text-xs text-teal-600 hidden md:block">Créez avec l'IA</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-all ${
                  showSettings 
                    ? "bg-teal-100 text-teal-600" 
                    : "bg-slate-100 text-slate-600 hover:bg-cyan-100"
                }`}
              >
                <Settings2 size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4 md:py-6 px-3 md:px-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-cyan-300/60 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            
            {history.length === 0 && !result && (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 md:py-12">
                <div className="mb-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-teal-100 via-cyan-100 to-blue-100 flex items-center justify-center mx-auto mb-4 border-2 border-teal-300/50 shadow-md">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
                  </div>
                </div>
                <h2 className="text-lg md:text-2xl font-bold text-slate-900 mb-2">Bienvenue!</h2>
                <p className="text-slate-600 text-xs md:text-base max-w-xs md:max-w-sm mb-6">
                  Décrivez l'image que vous souhaitez créer et l'IA générera une image unique.
                </p>
                <div className="w-full max-w-lg space-y-2">
                  <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">Suggestions</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <button
                      onClick={() => setPrompt("Modern office workspace with natural lighting and plants")}
                      className="p-2.5 md:p-3 rounded-lg bg-gradient-to-br from-white to-cyan-50 border-2 border-cyan-300/60 hover:border-teal-400 hover:shadow-lg transition-all text-left text-xs md:text-sm shadow-sm"
                    >
                      <p className="font-semibold text-slate-900">Espace de Travail</p>
                      <p className="text-slate-600 mt-0.5 text-xs">Bureau moderne lumineux</p>
                    </button>
                    <button
                      onClick={() => setPrompt("Digital technology concept with glowing blue circuits and data flow")}
                      className="p-2.5 md:p-3 rounded-lg bg-gradient-to-br from-white to-teal-50 border-2 border-teal-300/60 hover:border-cyan-400 hover:shadow-lg transition-all text-left text-xs md:text-sm shadow-sm"
                    >
                      <p className="font-semibold text-slate-900">Technologie</p>
                      <p className="text-slate-600 mt-0.5 text-xs">Design futuriste</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* History messages */}
            {history.map((item) => (
              <div key={item.id} className="space-y-3 animate-fadeIn">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-xs md:max-w-md bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 md:px-5 md:py-3 shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-sm md:text-base break-words leading-relaxed font-medium">{item.original_prompt}</p>
                    <p className="text-xs mt-2 text-teal-100/80 font-medium">
                      {item.mode === "simple" ? "Mode: Standard" : "Mode: Enhanced"}
                    </p>
                  </div>
                </div>

                {/* AI response */}
                {item.success ? (
                  <div className="flex justify-start">
                    <div className="max-w-full md:max-w-2xl bg-gradient-to-br from-white via-cyan-50 to-teal-50 border-2 border-cyan-300/60 rounded-2xl rounded-tl-sm overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      {item.image_base64 && (
                        <div className="p-3 md:p-4 bg-gradient-to-br from-slate-100/50 to-cyan-100/50 border-b border-cyan-200/50">
                          <img
                            src={`data:image/png;base64,${item.image_base64}`}
                            alt="Generated"
                            className="w-full rounded-xl shadow-lg border-2 border-white/80"
                          />
                        </div>
                      )}
                      <div className="border-t-2 border-cyan-300/50 bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 p-3 md:p-4 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1.5">Prompt utilisé</p>
                          <p className="text-sm text-slate-700 break-words leading-relaxed">{item.used_prompt}</p>
                        </div>

                        {item.enriched_prompt && (
                          <div className="border-t-2 border-cyan-300/50 pt-3">
                            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1.5">Prompt enrichi</p>
                            <p className="text-sm text-slate-700 break-words leading-relaxed">{item.enriched_prompt}</p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="border-t-2 border-cyan-300/50 pt-3 flex gap-2 flex-wrap">
                          <button
                            onClick={() => copyPrompt(item.used_prompt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-100 to-teal-100 hover:from-cyan-200 hover:to-teal-200 text-teal-700 hover:text-teal-800 text-xs md:text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                          >
                            <Copy size={14} />
                            {copied ? "Copié" : "Copier"}
                          </button>
                          {item.image_base64 && (
                            <button
                              onClick={() => downloadImage(item.image_base64)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-100 to-blue-100 hover:from-teal-200 hover:to-blue-200 text-teal-700 hover:text-teal-800 text-xs md:text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                            >
                              <Download size={14} />
                              Télécharger
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-xs md:max-w-md bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300/60 rounded-2xl rounded-tl-sm px-4 py-3 md:px-5 md:py-3 shadow-lg">
                      <p className="text-sm text-red-700 font-bold">Erreur</p>
                      <p className="text-sm text-red-600 mt-1.5 break-words">{item.error}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {result && !history.includes(result) && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex justify-end">
                  <div className="max-w-xs md:max-w-md bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 md:px-5 md:py-3 shadow-lg hover:shadow-xl transition-shadow">
                    <p className="text-sm md:text-base break-words leading-relaxed font-medium">{result.original_prompt}</p>
                    <p className="text-xs mt-2 text-teal-100/80 font-medium">
                      {result.mode === "simple" ? "Mode: Standard" : "Mode: Enhanced"}
                    </p>
                  </div>
                </div>

                {result.success ? (
                  <div className="flex justify-start">
                    <div className="max-w-full md:max-w-2xl bg-gradient-to-br from-white via-cyan-50 to-teal-50 border-2 border-cyan-300/60 rounded-2xl rounded-tl-sm overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      {result.image_base64 && (
                        <div className="p-3 md:p-4 bg-gradient-to-br from-slate-100/50 to-cyan-100/50 border-b border-cyan-200/50">
                          <img
                            src={`data:image/png;base64,${result.image_base64}`}
                            alt="Generated"
                            className="w-full rounded-xl shadow-lg border-2 border-white/80"
                          />
                        </div>
                      )}
                      <div className="border-t-2 border-cyan-300/50 bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 p-3 md:p-4 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1.5">Prompt utilisé</p>
                          <p className="text-sm text-slate-700 break-words leading-relaxed">{result.used_prompt}</p>
                        </div>

                        {result.enriched_prompt && (
                          <div className="border-t-2 border-cyan-300/50 pt-3">
                            <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-1.5">Prompt enrichi</p>
                            <p className="text-sm text-slate-700 break-words leading-relaxed">{result.enriched_prompt}</p>
                          </div>
                        )}

                        <div className="border-t-2 border-cyan-300/50 pt-3 flex gap-2 flex-wrap">
                          <button
                            onClick={() => copyPrompt(result.used_prompt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-100 to-teal-100 hover:from-cyan-200 hover:to-teal-200 text-teal-700 hover:text-teal-800 text-xs md:text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                          >
                            <Copy size={14} />
                            {copied ? "Copié" : "Copier"}
                          </button>
                          {result.image_base64 && (
                            <button
                              onClick={() => downloadImage(result.image_base64)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-100 to-blue-100 hover:from-teal-200 hover:to-blue-200 text-teal-700 hover:text-teal-800 text-xs md:text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                            >
                              <Download size={14} />
                              Télécharger
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-xs md:max-w-md bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300/60 rounded-2xl rounded-tl-sm px-4 py-3 md:px-5 md:py-3 shadow-lg">
                      <p className="text-sm text-red-700 font-bold">Erreur</p>
                      <p className="text-sm text-red-600 mt-1.5 break-words">{result.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 bg-gradient-to-r from-white via-cyan-50 to-teal-50 border-t-2 border-cyan-300/50 p-3 md:p-6 shadow-xl">
            <div className="w-full space-y-3">
              {/* Mode selector */}
              {showSettings && (
                <div className="flex gap-2 mb-4 flex-wrap pb-4 border-b-2 border-cyan-300/50">
                  <button
                    onClick={() => setMode("simple")}
                    className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all shadow-md ${
                      mode === "simple"
                        ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                        : "bg-white border-2 border-cyan-300/60 text-slate-700 hover:bg-cyan-100"
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setMode("enriched")}
                    className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all shadow-md ${
                      mode === "enriched"
                        ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                        : "bg-white border-2 border-cyan-300/60 text-slate-700 hover:bg-teal-100"
                    }`}
                  >
                    Enhanced
                  </button>
                  {history.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="ml-auto px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:from-red-200 hover:to-pink-200 text-xs md:text-sm font-bold transition-all flex items-center gap-1 shadow-md border-2 border-red-300/60"
                    >
                      <Trash2 size={14} />
                      Effacer
                    </button>
                  )}
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleGenerate()}
                  placeholder={isMobile ? "Votre image..." : "Décrivez l'image que vous souhaitez créer..."}
                  className="flex-1 px-4 py-2.5 md:py-3 rounded-lg bg-white border-2 border-cyan-300/60 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-sm md:text-base placeholder-slate-400 text-slate-900 shadow-md font-medium"
                />
                <button
                  onClick={handleGenerate}
                  disabled={loading || !prompt.trim()}
                  className={`px-3 md:px-6 py-2.5 md:py-3 rounded-lg font-bold flex items-center gap-2 transition-all text-sm md:text-base whitespace-nowrap flex-shrink-0 shadow-lg ${
                    loading || !prompt.trim()
                      ? "bg-slate-200 text-slate-500 cursor-not-allowed border-2 border-slate-300"
                      : "bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white hover:shadow-xl hover:from-teal-600 hover:via-cyan-600 hover:to-blue-600 active:scale-95 border-2 border-teal-400"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span className="hidden md:inline text-xs md:text-base">Génération...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} className="md:w-5 md:h-5" />
                      <span className="hidden md:inline text-xs md:text-base">Générer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
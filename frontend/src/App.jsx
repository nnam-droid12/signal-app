import React, { useEffect, useRef, useState } from "react";
import {
  X,
  Copy,
  Check,
  Volume2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { useSignalConnection } from "./hooks/useSignalConnection2";
import { GestureController } from "./components/GestureController";
import { toast, Toaster } from "react-hot-toast";
import ShowImage from "./components/ShowImage";

import PolyglotCodeCard from "./components/PolyglotCodeCard";

const SignalModal = ({ signal, onClose, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(signal.suggestedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSignalConfig = () => {
    switch (signal?.type) {
      case "DECISION_POINT":
        return {
          icon: Lightbulb,
          iconBg: "bg-blue-500",
          borderColor: "border-blue-500",
          accentColor: "text-blue-400",
          label: "Decision Point",
        };
      case "RISK_DETECTED":
        return {
          icon: AlertCircle,
          iconBg: "bg-amber-500",
          borderColor: "border-amber-500",
          accentColor: "text-amber-400",
          label: "Risk Alert",
        };
      case "INPUT_REQUIRED":
        return {
          icon: HelpCircle,
          iconBg: "bg-emerald-500",
          borderColor: "border-emerald-500",
          accentColor: "text-emerald-400",
          label: "Input Needed",
        };
      default:
        return {
          icon: Volume2,
          iconBg: "bg-gray-500",
          borderColor: "border-gray-500",
          accentColor: "text-gray-400",
          label: "Signal",
        };
    }
  };

  const config = getSignalConfig();
  const Icon = config.icon;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 animate-slideUp">
      <div
        className={`flex items-center justify-between p-6 border-b ${config.borderColor} border-opacity-30`}
      >
        <div className="flex items-center gap-3">
          <div className={`${config.iconBg} p-2.5 rounded-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold ${config.accentColor}`}>
                {config.label}
              </span>
              <span className="text-xs text-slate-400">
                • {Math.round(signal?.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(signal?.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white leading-tight">
            {signal?.title}
          </h2>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <p className="text-sm font-medium text-slate-300 mb-2">
            What's happening:
          </p>
          <p className="text-slate-200 leading-relaxed">
            {signal?.description}
          </p>
        </div>

        {signal?.suggestedResponse && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-300">
                💡 AI Suggested Response:
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-4 border border-slate-600">
              <p className="text-white leading-relaxed mb-4 pr-8">
                "{signal.suggestedResponse}"
              </p>

              <button
                onClick={handleCopy}
                className={`absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy Response</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 rounded-b-2xl">
        <p className="text-xs text-slate-400 text-center">
          This suggestion is AI-generated. Please review before using.
        </p>
      </div>
    </div>
  );
};

function App() {
  const [currentSignal, setCurrentSignal] = useState(null);
  const [showModal, setShowModal] = useState(false);
  // const [latestSuggestion, setLatestSuggestion] = useState(null);
  const [currentSignalIndex, setCurrentSignalIndex] = useState(null);
  const currentSignalIndexRef = useRef(currentSignalIndex);

  //  const [signals, setSignals] = useState([]);
  // const [status, setStatus] = useState("LISTENING"); // simulate listening
  // const [currentSignalIndex, setCurrentSignalIndex] = useState(0);
  // const [showModal, setShowModal] = useState(true);
  // const [latestSuggestion, setLatestSuggestion] = useState();

  //   useEffect(() => {
  //   const interval = setInterval(async () => {
  //     const res = await fetch("http://localhost:5000/api/next-signal");
  //     const data = await res.json();
  //     console.log("Polled data:", data);
  //     if (data.signal) {
  //       setSignals((prev) => [...prev, data.signal]);
  //       // setCurrentSignalIndex(prev => prev.length); // always show newest
  //       // setShowModal(true);
  //     //   const newestIndex = signals.length - 1;
  //     // setCurrentSignalIndex(newestIndex);
  //     // setCurrentSignal(signals[newestIndex]);
  //     setShowModal(true);
  //       // setLatestSuggestion(data.signal.suggestedResponse);
  //     }
  //     // console.log("Polled for new signal:", data);
  //   }, 5000); // every 5 seconds

  //   return () => clearInterval(interval);
  // }, []);

  const { connect, startListening, stopListening, signals, status } =
    useSignalConnection();
  const signalsRef = useRef(signals);
  useEffect(() => {
    signalsRef.current = signals;
  }, [signals]);

  // useEffect(() => {
  //   if (signals.length > 0 ) {
  //     const suggestedResponse = signals.map(s => s.suggestedResponse);
  //     setLatestSuggestion(suggestedResponse);
  //     console.log("Latest Suggested Response:", suggestedResponse);
  //   }
  // }, [signals]);

  // Update latest suggestion when new signals arrive
  // useEffect(() => {
  //   if (signals.length > 0 && signals[0].suggestedResponse) {
  //     setLatestSuggestion(signals[0].suggestedResponse);
  //     console.log("Latest Suggested Response:", signals[0].suggestedResponse);
  //   }
  // }, [signals]);

  useEffect(() => {
    if (signals.length > 0) {
      const newestIndex = signals.length - 1;
      setCurrentSignalIndex(newestIndex);
      setCurrentSignal(signals[newestIndex]);
      setShowModal(true);
    }
  }, [signals]);

  useEffect(() => {
    currentSignalIndexRef.current = currentSignalIndex;
  }, [currentSignalIndex]);

  const handleCopyResponse = (text) => {
    navigator.clipboard.writeText(text);
  };

  // console.log('Current Signal Index in App:', currentSignalIndex);

  const handleGesture = (command) => {
    if (command === "COPY_RESPONSE") {
      const index = currentSignalIndexRef.current;
      const allSignals = signalsRef.current;
      const activeSignal = allSignals[index];

      console.log("Correct Index:", index);
      console.log("Signals Length:", allSignals.length);
      console.log("Active Signal:", activeSignal);

      if (!activeSignal?.suggestedResponse) return;

      navigator.clipboard.writeText(activeSignal.suggestedResponse);

      new Audio("/success.mp3").play().catch(() => null);

      toast.custom(
        (t) => (
          <div
            className={`${t.visible ? "animate-enter" : "animate-leave"} 
              max-w-md w-full bg-blue-600 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-3xl">👍</span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-white">
                    Response Copied!
                  </p>
                  <p className="mt-1 text-sm text-blue-100">
                    Ready to paste into chat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ),
        { duration: 2000 },
      );
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen text-white font-sans">
      <Toaster position="top-center" />

      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                {status === "LISTENING" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse ring-2 ring-slate-900"></div>
                )}
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Signal</h1>
                <p className="text-xs text-slate-400">
                  AI-Powered Meeting Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-full">
                <div
                  className={`w-2 h-2 rounded-full ${
                    status === "LISTENING"
                      ? "bg-emerald-500 animate-pulse"
                      : status === "CONNECTED"
                        ? "bg-blue-500"
                        : "bg-slate-500"
                  }`}
                ></div>
                <span className="text-xs font-medium text-slate-300">
                  {status === "LISTENING"
                    ? "Active"
                    : status === "CONNECTED"
                      ? "Ready"
                      : "Offline"}
                </span>
              </div>

              {status === "DISCONNECTED" && (
                <button
                  onClick={connect}
                  className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg font-medium transition-all text-sm cursor-pointer"
                >
                  Connect
                </button>
              )}

              {status === "CONNECTED" && (
                <button
                  onClick={startListening}
                  className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-lg font-medium transition-all text-sm flex items-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  Start Listening
                </button>
              )}

              {status === "LISTENING" && (
                <button
                  onClick={stopListening}
                  className="bg-red-600 hover:bg-red-500 px-5 py-2.5 rounded-lg font-medium transition-all text-sm"
                >
                  Stop
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {status === "DISCONNECTED" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-6xl  mb-2">Welcome to Signal</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Connect to start receiving real-time meeting insights, important
              decisions, and AI-powered response suggestions.
            </p>
          </div>
        )}

        {status === "CONNECTED" && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-500/10 border-2 border-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Volume2 className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Ready to Listen</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Click "Start Listening" to begin monitoring your meeting for
              important moments.
            </p>
          </div>
        )}

        {status === "LISTENING" && signals.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Volume2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Listening to Meeting</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-6">
              Actively monitoring for decisions, risks, and questions that need
              your input.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>AI is processing audio in real-time</span>
            </div>
          </div>
        )}

        {status === "LISTENING" && signals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Signal History</h2>
              <span className="text-sm text-slate-400">
                {signals.length} signal{signals.length !== 1 ? "s" : ""}{" "}
                detected
              </span>
            </div>

            <div className="grid gap-3">
              {signals.map((signal, index) => {
                const config =
                  signal.type === "DECISION_POINT"
                    ? { color: "blue", label: "Decision" }
                    : signal.type === "RISK_DETECTED"
                      ? { color: "amber", label: "Risk" }
                      : { color: "emerald", label: "Input" };

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSignalIndex(index);
                      setShowModal(true);
                    }}
                    className="bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg p-4 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold text-${config.color}-400`}
                          >
                            {config.label}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(signal.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                          {signal.title}
                        </h3>
                      </div>
                      <div className="text-slate-400 group-hover:text-white transition-colors">
                        →
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>
      {console.log('signal', signals)}
      {console.log('signal index', currentSignalIndex)}
      {signals[currentSignalIndex] &&
        signals[currentSignalIndex].type === "CODE_GENERATED" &&
        signals[currentSignalIndex].codeSnippets && (
          <PolyglotCodeCard
            title={signals[currentSignalIndex].title}
            snippets={signals[currentSignalIndex].codeSnippets}
          />
        )}

      {/* {showModal && currentSignal && (
        <SignalModal
          signal={currentSignal}
          onClose={() => setShowModal(false)}
          onCopy={handleCopyResponse}
        />
      )} */}

      {showModal && currentSignalIndex !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4 flex items-center justify-center">
          <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl items-start justify-center animate-fadeIn">
            {(() => {
              const current = signals[currentSignalIndex];
              const prevIndex = currentSignalIndex - 1;

              const signalAtLeft =
                current?.type === "IMAGE_GENERATED" && prevIndex >= 0
                  ? signals[prevIndex]
                  : current;

              return (
                <SignalModal
                  key={signalAtLeft?.timestamp}
                  signal={signalAtLeft}
                  onClose={() => setShowModal(false)}
                  onCopy={handleCopyResponse}
                />
              );
            })()}

            {signals[currentSignalIndex]?.type === "IMAGE_GENERATED" &&
              signals[currentSignalIndex]?.imageBase64 && (
                <ShowImage
                  key={signals[currentSignalIndex]?.timestamp}
                  imageBase64={signals[currentSignalIndex]?.imageBase64}
                  timestamp={signals[currentSignalIndex]?.timestamp}
                  onClose={() => setShowModal(false)}
                />
              )}
          </div>
        </div>
      )}

      {status === "LISTENING" && (
        <GestureController
          onGesture={handleGesture}
          isReady={!!signals[currentSignalIndex]?.suggestedResponse}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;

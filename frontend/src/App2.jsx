import React, { useEffect, useRef } from "react";
import { useSignalConnection } from "./hooks/useSignalConnection2";
import { GestureController } from "./components/GestureController"; // Your Gesture Component

// Icons (You can use Lucide-React or Heroicons)
const Icons = {
  DECISION: () => <span className="text-2xl">🔨</span>,
  RISK: () => <span className="text-2xl">⚠️</span>,
  INPUT: () => <span className="text-2xl">🟢</span>,
  DEFAULT: () => <span className="text-2xl">📢</span>,
};

function App() {
  const {
    connect,
    startListening,
    stopListening,
    sendCommand,
    signals,
    status,
  } = useSignalConnection();
  const bottomRef = useRef(null);

  // Auto-scroll to new signals
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [signals]);

  // Handle Gesture Detection from Camera
  const handleGesture = (command) => {
    console.log("Hand Gesture Detected:", command);
    sendCommand(command);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans selection:bg-blue-500 selection:text-white">
      {/* HEADER */}
      <header className="fixed top-0 w-full bg-gray-900/95 backdrop-blur border-b border-gray-800 z-50 p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold tracking-wider">
            SIGNAL{" "}
            <span className="text-blue-400 text-sm font-normal">
              AI Co-Pilot
            </span>
          </h1>
        </div>

        <div className="flex gap-3">
          {status === "DISCONNECTED" && (
            <button
              onClick={connect}
              className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-full font-medium transition-all shadow-blue-500/20 shadow-lg"
            >
              Connect System
            </button>
          )}

          {status === "CONNECTED" && (
            <button
              onClick={startListening}
              className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-full font-medium transition-all animate-bounce-subtle"
            >
              🎙️ Start Listening
            </button>
          )}

          {status === "LISTENING" && (
            <button
              onClick={stopListening}
              className="bg-red-500/20 border border-red-500 text-red-400 px-6 py-2 rounded-full font-medium hover:bg-red-500/30"
            >
              ⏹ Stop
            </button>
          )}
        </div>
      </header>

      {/* MAIN FEED */}
      <main className="pt-24 pb-32 max-w-2xl mx-auto px-4 space-y-6">
        {signals.length === 0 && status === "LISTENING" && (
          <div className="text-center text-gray-500 mt-20 animate-pulse">
            <p className="text-lg">Listening to meeting audio...</p>
            <p className="text-sm">
              Waiting for decisions, risks, or questions.
            </p>
          </div>
        )}

        {signals.map((signal, index) => {
          // Determine Color Scheme based on Type
          let borderClass = "border-gray-700";
          let bgClass = "bg-gray-800";
          let Icon = Icons.DEFAULT;

          if (signal.type === "DECISION_POINT") {
            borderClass = "border-blue-500";
            bgClass = "bg-gray-800/50"; // slightly transparent
            Icon = Icons.DECISION;
          } else if (signal.type === "RISK_DETECTED") {
            borderClass = "border-red-500";
            bgClass = "bg-red-900/10";
            Icon = Icons.RISK;
          } else if (signal.type === "INPUT_REQUIRED") {
            borderClass =
              "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"; // Glowing effect
            bgClass = "bg-green-900/10";
            Icon = Icons.INPUT;
          }

          return (
            <div
              key={index}
              className={`relative p-5 rounded-xl border-l-4 ${borderClass} ${bgClass} shadow-xl transform transition-all hover:scale-[1.01] duration-300`}
            >
              {/* Timestamp & Confidence */}
              <div className="flex justify-between items-start mb-2 opacity-60 text-xs uppercase tracking-widest font-semibold">
                <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                <span>
                  Gemini 3 • {Math.round(signal.confidence * 100)}% Match
                </span>
              </div>

              {/* Content */}
              <div className="flex gap-4">
                <div className="pt-1">
                  <Icon />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    {signal.title}
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {signal.description}
                  </p>
                </div>
              </div>

              {/* AI Suggested Response (Agency Feature) */}
              {signal.suggestedResponse && (
                <div className="mt-4 bg-black/40 p-3 rounded-lg border border-white/10 flex flex-col gap-2">
                  <span className="text-xs text-blue-300 font-bold uppercase">
                    ✨ Suggested Response
                  </span>
                  <div className="flex justify-between items-center gap-4">
                    <code className="text-sm text-gray-200 font-mono italic">
                      "{signal.suggestedResponse}"
                    </code>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(signal.suggestedResponse)
                      }
                      className="bg-blue-600/80 hover:bg-blue-600 text-xs px-3 py-1.5 rounded uppercase font-bold tracking-wide transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      {/* GESTURE OVERLAY (Bottom Right) */}
      {status === "LISTENING" && (
        <GestureController onGesture={handleGesture} />
      )}
    </div>
  );
}

export default App;

// import React from 'react';
// import { useSignalConnection } from './hooks/useSignalConnection';

// function App() {
//   const { connect, startListening, signals, status } = useSignalConnection();

//   return (
//     <div className="p-10 bg-gray-900 min-h-screen text-white">
//       <h1 className="text-3xl font-bold mb-5">SIGNAL <span className="text-blue-400">Co-Pilot</span></h1>

//       {/* Controls */}
//       <div className="flex gap-4 mb-8">
//         <button onClick={connect} className="bg-gray-700 px-4 py-2 rounded">
//           1. Connect to Server ({status})
//         </button>

//         <button onClick={startListening} disabled={status !== 'CONNECTED'}
//           className="bg-blue-600 px-6 py-2 rounded font-bold hover:bg-blue-500 disabled:opacity-50">
//           2. Start Listening (Select Meeting Tab)
//         </button>
//       </div>

//       {/* Live Signals Feed */}
//       <div className="space-y-4">
//         {signals.map((signal, index) => (
//           <div key={index} className={`p-4 border-l-4 rounded bg-gray-800 ${
//             signal.type === 'DECISION_POINT' ? 'border-green-500' :
//             signal.type === 'RISK_DETECTED' ? 'border-red-500' : 'border-gray-500'
//           }`}>
//             <div className="flex justify-between items-start">
//               <h3 className="font-bold text-lg">{signal.title}</h3>
//               <span className="text-xs text-gray-400">{new Date(signal.timestamp).toLocaleTimeString()}</span>
//             </div>
//             <p className="text-gray-300 mt-1">{signal.description}</p>

//             {signal.suggestedResponse && (
//               <div className="mt-3 bg-gray-700 p-3 rounded flex justify-between items-center cursor-pointer hover:bg-gray-600"
//                    onClick={() => navigator.clipboard.writeText(signal.suggestedResponse)}>
//                 <code className="text-blue-300 text-sm">💬 {signal.suggestedResponse}</code>
//                 <span className="text-xs uppercase font-bold text-blue-400">Copy</span>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;

// import { useEffect, useRef, useState } from "react";

// export default function WebSocketExample() {
//   const socketRef = useRef(null);
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     socketRef.current = new WebSocket("https://signal-image-latest.onrender.com");

//     socketRef.current.onopen = () => {
//       console.log("WebSocket connected");
//     };

//     socketRef.current.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setMessages((prev) => [...prev, data]);
//     };

//     socketRef.current.onerror = (error) => {
//       console.error("WebSocket error:", error);
//     };

//     socketRef.current.onclose = () => {
//       console.log("WebSocket disconnected");
//     };

//     return () => {
//       socketRef.current.close();
//     };
//   }, []);

//   return (
//     <div>
//       {messages.map((msg, i) => (
//         <p key={i}>{msg.text}</p>
//       ))}
//     </div>
//   );
// }

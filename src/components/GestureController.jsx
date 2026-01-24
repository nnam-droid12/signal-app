import React, { useEffect, useRef } from "react";

export function GestureController({ onGesture }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access denied:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 w-64 bg-black/70 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl p-3 space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs uppercase tracking-widest text-blue-400 font-bold">
          Gesture Control
        </span>
        <span className="text-green-400 text-xs animate-pulse">LIVE</span>
      </div>

      {/* Camera Preview */}
      <div className="relative w-full h-36 bg-black rounded-lg overflow-hidden border border-white/10">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      </div>

      {/* Temporary Gesture Buttons (Simulation) */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <button
          onClick={() => onGesture("DECISION_POINT")}
          className="bg-blue-600/80 hover:bg-blue-600 rounded py-1 font-bold"
        >
          🔨 Decision
        </button>

        <button
          onClick={() => onGesture("RISK_DETECTED")}
          className="bg-red-600/80 hover:bg-red-600 rounded py-1 font-bold"
        >
          ⚠️ Risk
        </button>

        <button
          onClick={() => onGesture("INPUT_REQUIRED")}
          className="bg-green-600/80 hover:bg-green-600 rounded py-1 font-bold"
        >
          🟢 Input
        </button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-gray-400 text-center">
        Hand detection coming soon
      </p>
    </div>
  );
}

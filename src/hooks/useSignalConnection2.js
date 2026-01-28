import { useState, useRef, useEffect, useCallback } from "react";

export const useSignalConnection = () => {
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState("DISCONNECTED"); // DISCONNECTED, CONNECTED, LISTENING
  const [signals, setSignals] = useState([]);
  const mediaStreamRef = useRef(null);
  const shouldStopRef = useRef(false); // Ref to control the loop instantly

  // 1. Connect to Backend
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const connect = useCallback(() => {
    // Use wss:// for secure production (Render), ws:// for localhost
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // automatically gets 'signal-image-latest.onrender.com'
    // For local testing: const url = 'ws://localhost:8080/ws-signal';
    const url = `https://signal-image-latest.onrender.com/ws-signal`;

    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log("✅ Connected to Signal Backend");
      setStatus("CONNECTED");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📩 DATA:", data);

        if (data.type === "IMAGE_GENERATED") {
          console.log("🖼️ Image received! Size:", data.imageBase64.length);
        }
        // Only add non-IDLE signals to the UI
        if (data.type !== "IDLE") {
        //   console.log("📩 Signal Receivedddddd:", event);
          console.log("🚨 SIGNAL RECEIVED:", data);
          // Add new signal to top of list
          setSignals((prev) => [...prev, data]);

          // Optional: Play a subtle notification sound for "INPUT_REQUIRED"
          if (data.type === "INPUT_REQUIRED") {
            console.log("Playing notification sound");
            new Audio("/notification.mp3").play().catch(() => {});
          }
        }
      } catch (e) {
        console.error("Error parsing signal:", e);
      }
    };

    ws.onclose = () => {
      console.log("❌ Disconnected");
      setStatus("DISCONNECTED");
      stopListening(); // Safety cleanup
    };

    setSocket(ws);
  }, []);

  // 2. The "Discrete Loop" Recorder (Fixes 400 Error)
  const recordClip = (stream) => {
    if (shouldStopRef.current || !stream) return;

    // Create a NEW recorder for every 3-second clip
    // This ensures every blob sent to Gemini has a valid WebM Header
    let mimeType = "";

    if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
      mimeType = "audio/webm;codecs=opus";
    } else if (MediaRecorder.isTypeSupported("audio/webm")) {
      mimeType = "audio/webm";
    } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
      mimeType = "audio/ogg;codecs=opus";
    } else {
      throw new Error("No supported audio recording format found");
    }

    const recorder = new MediaRecorder(stream, { mimeType });

    const chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      if (shouldStopRef.current) return; // Stop if user clicked Stop

      const blob = new Blob(chunks, { type: "audio/webm" });

      // Send to Backend
      if (blob.size > 0 && socket?.readyState === WebSocket.OPEN) {
        blob.arrayBuffer().then((buffer) => {
          socket.send(buffer);
          console.log(`📤 Sent Clip (${blob.size} bytes)`);
        });
      }

      // RESTART IMMEDIATELY (The Infinite Loop)
      recordClip(stream);
    };

    // Record for 3 seconds, then stop (triggering onstop and the loop)
    recorder.start();
    setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 3000);
  };

  // 3. Start Listening
  const startListening = async () => {
    if (!socket) return;
    shouldStopRef.current = false;

    try {
      // Get Tab Audio (preferred) or Microphone
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const audioTracks = stream.getAudioTracks();

      if (audioTracks.length === 0) {
        throw new Error("No audio track found in captured stream");
      }

      const audioOnlyStream = new MediaStream(audioTracks);

      // For Microphone only (if you prefer):
      // const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaStreamRef.current = audioOnlyStream;
      setStatus("LISTENING");

      recordClip(audioOnlyStream);
    } catch (err) {
      console.error("Error accessing audio:", err);
      alert("Please allow audio access to use SIGNAL.");
    }
  };

  // 4. Stop Listening
  const stopListening = () => {
    shouldStopRef.current = true; // Breaks the loop

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setStatus("CONNECTED");
  };

  // 5. Send Manual Command (for Gestures)
  const sendCommand = (cmd) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(cmd);
    }
  };

  return {
    connect,
    startListening,
    stopListening,
    sendCommand,
    signals,
    status,
  };
};

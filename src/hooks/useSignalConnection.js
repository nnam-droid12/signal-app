import { useEffect, useRef, useState } from 'react';

export const useSignalConnection = () => {
    const [socket, setSocket] = useState(null);
    const [signals, setSignals] = useState([]); // Store AI responses
    const [status, setStatus] = useState('DISCONNECTED');
    const mediaRecorderRef = useRef(null);
    // console.log("Socket State:", socket);

//   useEffect(() => {
//     return () => {
//       // Cleanup on unmount
//       if (socket) {
//         socket.close();
//       }
//     };
//   }, []);

    // 1. Connect to Backend WebSocket
    const connect = () => {
        // Change URL to your Render URL when deploying
        // e.g. wss://nixora-backend.onrender.com/ws-signal
        const ws = new WebSocket('https://signal-image-latest.onrender.com/ws-signal');

        ws.onopen = () => {
            console.log('✅ Connected to Signal Backend');
            setStatus('CONNECTED');
        };

        ws.onmessage = (event) => {
            try {
                console.log(ws);
                console.log(event);
                const data = JSON.parse(event.data);
                console.log('📩 Signal Received:', data);
                
                // Add new signal to the list (for the UI to render)
                setSignals((prev) => [data, ...prev]);
                console.log("Updated Signals:", signals);
            } catch (e) {
                console.error('Error parsing signal:', e);
            }
        };

        ws.onclose = () => setStatus('DISCONNECTED');
        setSocket(ws);
    };
 // 2. Start Capturing Audio (System/Tab Audio)
    const startListening = async () => {
        if (!socket) return;

        try {
            // "getDisplayMedia" captures system audio (Google Meet sound)
            // Ideally, ask user to share the tab where the meeting is running
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true, // Must request video to get tab audio option usually
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000 // Standard for Speech-to-Text
                }
            });

            // We only need the audio track
            const audioTrack = stream.getAudioTracks()[0];
            const audioStream = new MediaStream([audioTrack]);

            // Create Recorder
            const mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;

            // 3. Send Audio Chunks to Backend
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                    socket.send(event.data); // Send Binary Data
                }
                // console.log("Sent audio chunk:", event.data);
            };

            // Slice audio into 1-second chunks to stream consistently
            mediaRecorder.start(1000); 
            setStatus('LISTENING');

        } catch (err) {
            console.error("Error accessing audio:", err);
            alert("Please enable 'Share Tab Audio' so SIGNAL can hear the meeting.");
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setStatus('CONNECTED');
    };

    return { connect, startListening, stopListening, signals, status };
};
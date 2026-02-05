import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export const GestureController = ({ onGesture, isReady }) => {
    const videoRef = useRef(null);
    const [loaded, setLoaded] = useState(false);
    const lastGestureTime = useRef(0);

   
    useEffect(() => {
        const initHandLandmarker = async () => {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );
            
            window.handLandmarker = await HandLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                    delegate: "GPU" 
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            setLoaded(true);
        };
        initHandLandmarker();
    }, []);

    
    useEffect(() => {
        if (!loaded || !isReady) return;

        let animationFrameId;
        const video = videoRef.current;

        const predict = async () => {
            if (video && video.readyState === 4) {
                const nowInMs = Date.now();
                const results = window.handLandmarker.detectForVideo(video, nowInMs);

                if (results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0];
                    detectGestures(landmarks);
                }
            }
            animationFrameId = requestAnimationFrame(predict);
        };

    
        navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
            video.srcObject = stream;
            video.addEventListener("loadeddata", predict);
        });

        return () => {
            cancelAnimationFrame(animationFrameId);
            if(video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [loaded, isReady]);

    const detectGestures = (landmarks) => {
        const now = Date.now();
        if (now - lastGestureTime.current < 2000) return; // 2s Cooldown

       

        const thumbTip = landmarks[4];
        const thumbIP  = landmarks[3];
        const indexTip = landmarks[8];
        const indexMCP = landmarks[5];
        const middleTip = landmarks[12];
        const middleMCP = landmarks[9];

        
        const isThumbUp = thumbTip.y < thumbIP.y;
        const isIndexCurled = indexTip.y > indexMCP.y;
        const isMiddleCurled = middleTip.y > middleMCP.y;

        if (isThumbUp && isIndexCurled && isMiddleCurled) {
            console.log("👍 THUMB UP DETECTED");
            lastGestureTime.current = now;
            onGesture('COPY_RESPONSE');
        }
    };

    return (
        <div className="fixed bottom-5 right-5 w-48 h-36 rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-2xl bg-black z-50">
          
            <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover transform -scale-x-100"
            />
            
          
            <div className="absolute top-0 left-0 w-full bg-black/60 text-center py-1">
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">
                    {loaded ? "Vision Active" : "Loading AI..."}
                </span>
            </div>
            
          
            {isReady && (
                <div className="absolute bottom-2 left-0 w-full text-center animate-pulse">
                   <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded-full">
                       👍 Copy Response
                   </span>
                </div>
            )}
        </div>
    );
};
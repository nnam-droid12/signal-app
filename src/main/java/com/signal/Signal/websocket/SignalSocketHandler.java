package com.signal.Signal.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.genai.Client;
import com.google.genai.types.*;
import com.signal.Signal.service.SignalResponse;
import jakarta.annotation.PostConstruct; // Standard for Spring Boot 3 / Java 17
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.FileInputStream;
import java.io.IOException;
import java.time.Instant;
import java.util.Collections;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@Component
public class SignalSocketHandler extends TextWebSocketHandler {

    private final CopyOnWriteArrayList<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    private final ObjectMapper objectMapper;

    private final ExecutorService executorService = Executors.newCachedThreadPool();
    private Client geminiClient;

    @Value("${google.cloud.project-id}")
    private String projectId;

    private byte[] audioBuffer = new byte[0];
    private static final int BUFFER_THRESHOLD = 60000;


    public SignalSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            log.info(" Initializing Gemini Client for Project: " + projectId);

            String keyPath = "/etc/secrets/google-key.json";

            GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(keyPath))
                    .createScoped(Collections.singletonList("https://www.googleapis.com/auth/cloud-platform"));

            this.geminiClient = Client.builder()
                    .project(projectId)
                    .location("global")
                    .credentials(credentials)
                    .vertexAI(true)
                    .build();

            log.info("Gemini 3 Client Ready!");
        } catch (Exception e) {
            log.error("CRITICAL: Failed to initialize Gemini Client", e);
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        sessions.add(session);
        log.info("🔌 Engineer connected: " + session.getId());

        SignalResponse welcome = SignalResponse.builder()
                .type(SignalResponse.SignalType.IDLE)
                .title("Signal Active")
                .description("Listening for high-impact meeting moments...")
                .timestamp(Instant.now())
                .confidence(1.0)
                .build();

        sendSignal(session, welcome);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
        log.info("🔌 Engineer disconnected: " + session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {

        String payload = message.getPayload();
        log.info("Received command: " + payload);
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        try {
            byte[] newChunk = message.getPayload().array();
            appendAudio(newChunk);

            if (audioBuffer.length > BUFFER_THRESHOLD) {
                byte[] audioToProcess = audioBuffer.clone();
                audioBuffer = new byte[0];
                executorService.submit(() -> processAudioWithGemini(session, audioToProcess));
            }
        } catch (Exception e) {
            log.error("Error handling binary audio", e);
        }
    }

    private void processAudioWithGemini(WebSocketSession session, byte[] audioData) {
        try {
            if (geminiClient == null) {
                log.warn("Gemini Client not initialized. Skipping.");
                return;
            }

            String systemText = """
                You are SIGNAL, a real-time accessibility co-pilot for deaf engineers.
                Analyze the audio buffer. If a key moment occurs, extract the specifics.
                
                1. DECISION_POINT: If a decision is made, set 'description' to exactly WHAT was decided (e.g., "Team agreed to use PostgreSQL").
                2. INPUT_REQUIRED: If the user is asked a question, set 'description' to exactly WHAT input is needed (e.g., "They are asking for your opinion on the API design").
                3. RISK_DETECTED: If a risk is flagged, set 'description' to the specific risk mentioned (e.g., "Concern raised about latency issues").
                4. IDLE: If no high-impact moment occurs.

                Output strict JSON:
                {
                  "type": "DECISION_POINT" | "INPUT_REQUIRED" | "RISK_DETECTED" | "IDLE",
                  "title": "Short Headline",
                  "description": "Specific details from the conversation as defined above.",
                  "suggestedResponse": "A helpful first-person response for the user to type.",
                  "confidence": 0.0 to 1.0
                }
                """;

            Content systemInstruction = Content.builder()
                    .parts(Collections.singletonList(
                            Part.builder().text(systemText).build()
                    ))
                    .build();

            GenerateContentConfig config = GenerateContentConfig.builder()
                    .responseMimeType("application/json")
                    .systemInstruction(systemInstruction)
                    .temperature(0.4f)
                    .build();

            Content userContent = Content.builder()
                    .role("user")
                    .parts(Collections.singletonList(
                            Part.builder()
                                    .inlineData(Blob.builder()
                                            .mimeType("audio/webm")
                                            .data(audioData)
                                            .build())
                                    .build()
                    ))
                    .build();

            GenerateContentResponse response = geminiClient.models.generateContent(
                    "gemini-3-pro-preview",
                    userContent,
                    config
            );

            String resultText = response.text();
            if (resultText != null) {

                resultText = resultText.replace("```json", "").replace("```", "").trim();

                SignalResponse signal = objectMapper.readValue(resultText, SignalResponse.class);

                if (signal.getType() != SignalResponse.SignalType.IDLE) {
                    signal.setTimestamp(Instant.now());
                    sendSignal(session, signal);
                }
            }

        } catch (Exception e) {
            log.error("Error in Gemini Processing: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void appendAudio(byte[] newChunk) {
        byte[] combined = new byte[audioBuffer.length + newChunk.length];
        System.arraycopy(audioBuffer, 0, combined, 0, audioBuffer.length);
        System.arraycopy(newChunk, 0, combined, audioBuffer.length, newChunk.length);
        audioBuffer = combined;
    }

    public void sendSignal(WebSocketSession session, SignalResponse signal) {
        try {
            if (session.isOpen()) {
                String json = objectMapper.writeValueAsString(signal);
                session.sendMessage(new TextMessage(json));
            }
        } catch (IOException e) {
            log.error("Error sending signal to frontend", e);
        }
    }
}
package com.signal.Signal.service;


import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.*;
import com.signal.Signal.dto.SignalResponse;
import com.signal.Signal.websocket.SignalSocketHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.WebSocketSession;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SignalCodeService {

    private final Client geminiClient;
    private final ObjectMapper objectMapper;

    @Lazy
    private final SignalSocketHandler socketHandler;

    @Async
    public void generateLiveCode(WebSocketSession session, String conversationContext) {

        sendLoadingSignal(session);


        String prompt = """
            You are a Senior Polyglot Software Engineer.
            Analyze this meeting transcript:
            "%s"
            
            Identify the core technical entity, function, or schema being discussed.
            Generate the production-ready code implementation for it in 3 languages: Java, Python, and Go.
            
            STRICT OUTPUT FORMAT:
            You must return ONLY a raw JSON object (no markdown, no backticks) with this exact structure:
            {
              "java": "public class ...",
              "python": "class ...",
              "go": "type ... struct ..."
            }
            """.formatted(conversationContext);

        GenerateContentConfig config = GenerateContentConfig.builder()
                .responseMimeType("application/json")
                .temperature(0.2f)
                .build();

        try {
            log.info("💻 Triggering Gemini 3 Code Agent...");

            GenerateContentResponse response = geminiClient.models.generateContent(
                    "gemini-3-pro-preview",
                    Content.builder().parts(Collections.singletonList(
                            Part.builder().text(prompt).build()
                    )).build(),
                    config
            );

            String jsonResult = response.text();


            if (jsonResult != null) {
                jsonResult = jsonResult.replace("```json", "").replace("```", "").trim();
            }


            Map<String, String> snippets = objectMapper.readValue(jsonResult, new TypeReference<>() {});

            SignalResponse codeSignal = SignalResponse.builder()
                    .type(SignalResponse.SignalType.CODE_GENERATED)
                    .title("Live Code Context")
                    .description("Gemini 3 generated implementation in Java, Python, and Go.")
                    .codeSnippets(snippets)
                    .timestamp(Instant.now())
                    .confidence(1.0)
                    .build();

            socketHandler.sendSignal(session, codeSignal);
            log.info("Live Code Sent to Frontend!");

        } catch (Exception e) {
            log.error("Code Gen Failed: " + e.getMessage());
        }
    }

    private void sendLoadingSignal(WebSocketSession session) {
        try {
            SignalResponse loading = SignalResponse.builder()
                    .type(SignalResponse.SignalType.IDLE)
                    .title("Drafting Code...")
                    .description("Generating polyglot implementation...")
                    .timestamp(Instant.now())
                    .confidence(1.0).build();
            socketHandler.sendSignal(session, loading);
        } catch (Exception e) {}
    }
}
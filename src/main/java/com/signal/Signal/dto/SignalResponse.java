package com.signal.Signal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignalResponse {
    private SignalType type;

    private String title;

    private String description;

    private String suggestedResponse;

    private double confidence;

    private Instant timestamp;

    private String imageBase64;

    private Map<String, String> codeSnippets;

    public enum SignalType {
        DECISION_POINT,
        INPUT_REQUIRED,
        RISK_DETECTED,
        CONTRADICTION,
        IDLE,
        IMAGE_GENERATED,
        CODE_GENERATED
    }
}
package com.signal.Signal.config;

import com.google.genai.Client;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GeminiConfig {

    @Value("${GOOGLE_API_KEY}")
    private String apiKey;

    @Bean
    public Client geminiClient() {
        if (apiKey == null || apiKey.isEmpty()) {
            throw new RuntimeException("GOOGLE_API_KEY is missing! Check your Cloud Run variables.");
        }


        return Client.builder()
                .apiKey(apiKey)
                .build();
    }
}
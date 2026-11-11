package com.edushare.modules.resource;

import com.fasterxml.jackson.databind.*;
import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GeminiStudyClient implements StudyAiClient {
  private final String key, model;
  private final ObjectMapper json;
  private final HttpClient http =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();

  public GeminiStudyClient(
      ObjectMapper json,
      @Value("${edushare.ai.api-key:}") String key,
      @Value("${edushare.ai.model:gemini-3.5-flash-lite}") String model) {
    this.json = json;
    this.key = key;
    this.model = model;
  }

  public boolean configured() {
    return key != null && !key.isBlank() && model != null && model.matches("[a-zA-Z0-9._-]+");
  }

  public String generate(String prompt, boolean structured, int outputTokens)
      throws IOException, InterruptedException {
    if (!configured())
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Configure GEMINI_API_KEY and a supported GEMINI_MODEL on the server.");
    Map<String, Object> config = new LinkedHashMap<>();
    config.put("maxOutputTokens", outputTokens);
    config.put("temperature", 0.2);
    if (structured) config.put("responseMimeType", "application/json");
    Map<String, Object> body =
        Map.of(
            "contents",
            List.of(Map.of("role", "user", "parts", List.of(Map.of("text", prompt)))),
            "generationConfig",
            config);
    HttpRequest request =
        HttpRequest.newBuilder(
                URI.create(
                    "https://generativelanguage.googleapis.com/v1beta/models/"
                        + model
                        + ":generateContent"))
            .timeout(Duration.ofSeconds(90))
            .header("Content-Type", "application/json")
            .header("x-goog-api-key", key)
            .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
            .build();
    HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() != 200) {
      String message;
      HttpStatus status = HttpStatus.BAD_GATEWAY;
      switch (response.statusCode()) {
        case 400:
          message =
              "The AI provider rejected the input. Try a smaller page range or check the configured"
                  + " model's context limit.";
          break;
        case 401:
        case 403:
          message = "The AI key or selected model is not available. Contact the administrator.";
          break;
        case 404:
          message = "AI model not found. Check GEMINI_MODEL in the server settings.";
          break;
        case 429:
          status = HttpStatus.TOO_MANY_REQUESTS;
          message =
              "The AI provider's quota or rate limit has been reached. Wait before trying again;"
                  + " increasing PDF limits does not increase provider quota.";
          break;
        default:
          message = "The AI provider is temporarily unavailable. Try again later.";
          break;
      }
      throw new ResponseStatusException(status, message);
    }
    JsonNode candidate = json.readTree(response.body()).path("candidates").path(0);
    StringBuilder text = new StringBuilder();
    for (JsonNode part : candidate.path("content").path("parts"))
      if (part.hasNonNull("text") && !part.path("thought").asBoolean(false))
        text.append(part.path("text").asText()).append('\n');
    if (text.toString().isBlank())
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "The provider returned no study content. Try another page range.");
    if ("MAX_TOKENS".equals(candidate.path("finishReason").asText()))
      throw new ResponseStatusException(
          HttpStatus.BAD_GATEWAY,
          "The provider reached its output limit. Try a smaller page range.");
    return text.toString().trim();
  }
}

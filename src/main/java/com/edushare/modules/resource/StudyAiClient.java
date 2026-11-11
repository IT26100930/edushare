package com.edushare.modules.resource;

/** Provider boundary so access, extraction and validation can be tested without a real API key. */
public interface StudyAiClient {
  boolean configured();

  String generate(String prompt, boolean json, int outputTokens)
      throws java.io.IOException, InterruptedException;
}

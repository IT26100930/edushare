package com.example.edushare.model;

public class VideoLink extends LearningLink {

    @Override public String getKind() { return "VIDEO"; }
    @Override public String getKindLabel() { return "WATCH"; }
    @Override public String getExtraLabel() { return "Duration"; }
}

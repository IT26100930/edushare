package com.example.edushare.model;

public class ArticleLink extends LearningLink {

    @Override public String getKind() { return "ARTICLE"; }
    @Override public String getKindLabel() { return "READ"; }
    @Override public String getExtraLabel() { return "Source"; }
}

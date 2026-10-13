package com.example.edushare.model;

public class PublicReview extends Review {

    @Override public String getKind() { return "PUBLIC"; }
    @Override public String getKindLabel() { return "MEMBER REVIEW"; }
}

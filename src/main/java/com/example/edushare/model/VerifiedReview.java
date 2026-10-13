package com.example.edushare.model;

public class VerifiedReview extends Review {

    @Override public String getKind() { return "VERIFIED"; }
    @Override public String getKindLabel() { return "VERIFIED DOWNLOAD"; }
}

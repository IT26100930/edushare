package com.edushare.modules.review;

public class PublicReview extends Review {

    public PublicReview() {}

    public PublicReview(long i, long r, long u, int s, String c) {
        super(i, r, u, s, c);
    }

    @Override
    public String getReviewType() {
        return "PUBLIC";
    }
}

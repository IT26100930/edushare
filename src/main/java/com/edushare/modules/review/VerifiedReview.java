package com.edushare.modules.review;

public class VerifiedReview extends Review {

    public VerifiedReview() {}

    public VerifiedReview(long i, long r, long u, int s, String c) {
        super(i, r, u, s, c);
    }

    @Override
    public String getReviewType() {
        return "VERIFIED";
    }
}

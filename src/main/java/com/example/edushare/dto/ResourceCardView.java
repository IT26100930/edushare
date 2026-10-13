package com.example.edushare.dto;

import com.example.edushare.model.Resource;

/** Everything a resource card needs to render, pre-computed for the current user. */
public class ResourceCardView {

    private final Resource resource;
    private final String categoryName;
    private final String categoryColor;
    private final boolean locked;
    private final boolean bookmarked;
    private final double averageRating;
    private final int reviewCount;

    public ResourceCardView(Resource resource, String categoryName, String categoryColor,
                            boolean locked, boolean bookmarked, double averageRating, int reviewCount) {
        this.resource = resource;
        this.categoryName = categoryName;
        this.categoryColor = categoryColor;
        this.locked = locked;
        this.bookmarked = bookmarked;
        this.averageRating = averageRating;
        this.reviewCount = reviewCount;
    }

    public Resource getResource() { return resource; }
    public String getCategoryName() { return categoryName; }
    public String getCategoryColor() { return categoryColor; }
    public boolean isLocked() { return locked; }
    public boolean isBookmarked() { return bookmarked; }
    public double getAverageRating() { return averageRating; }
    public int getReviewCount() { return reviewCount; }

    public String getRatingText() {
        return reviewCount == 0 ? "No reviews" : String.format("%.1f ★ (%d)", averageRating, reviewCount);
    }
}

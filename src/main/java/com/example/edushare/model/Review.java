package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

/** Abstract review. A PublicReview can be written by anyone; a VerifiedReview by someone who downloaded the resource. */
public abstract class Review {

    private String id;
    private String resourceId;
    private String userId;
    private String userName;
    private int rating;
    private String comment;
    private String date;

    public abstract String getKind();

    public abstract String getKindLabel();

    public static Review of(String kind) {
        return "VERIFIED".equals(kind) ? new VerifiedReview() : new PublicReview();
    }

    public static Review fromFields(String[] f) {
        Review r = of(FileUtil.get(f, 1));
        r.id = FileUtil.get(f, 0);
        r.resourceId = FileUtil.get(f, 2);
        r.userId = FileUtil.get(f, 3);
        r.userName = FileUtil.get(f, 4);
        r.rating = FileUtil.parseInt(FileUtil.get(f, 5), 5);
        r.comment = FileUtil.get(f, 6);
        r.date = FileUtil.get(f, 7);
        return r;
    }

    public String toLine() {
        return FileUtil.join(id, getKind(), resourceId, userId, userName, rating, comment, date);
    }

    public String getStars() {
        int r = Math.max(0, Math.min(5, rating));
        return "★".repeat(r) + "☆".repeat(5 - r);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
}

package com.edushare.modules.review;

public abstract class Review {

  private long id;

  private long resourceId;

  private long userId;

  @com.fasterxml.jackson.databind.annotation.JsonDeserialize(using = StarRatingDeserializer.class)
  private int rating;

  private String comment;

  public Review() {}

  public Review(long id, long resourceId, long userId, int rating, String comment) {
    this.id = id;
    this.resourceId = resourceId;
    this.userId = userId;
    this.rating = rating;
    this.comment = comment;
  }

  public abstract String getReviewType();

  public long getId() {
    return id;
  }

  public void setId(long v) {
    id = v;
  }

  public long getResourceId() {
    return resourceId;
  }

  public void setResourceId(long v) {
    resourceId = v;
  }

  public long getUserId() {
    return userId;
  }

  public void setUserId(long v) {
    userId = v;
  }

  public int getRating() {
    return rating;
  }

  public void setRating(int v) {
    rating = v;
  }

  public String getComment() {
    return comment;
  }

  public void setComment(String v) {
    comment = v;
  }
}

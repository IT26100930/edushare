package com.edushare.modules.community;

public class GroupPost {

    private long id, groupId, userId;
    private String authorName, message, resourceUrl, createdAt;

    public GroupPost() {}

    public GroupPost(
            long id,
            long groupId,
            long userId,
            String authorName,
            String message,
            String resourceUrl,
            String createdAt) {
        this.id = id;
        this.groupId = groupId;
        this.userId = userId;
        this.authorName = authorName;
        this.message = message;
        this.resourceUrl = resourceUrl;
        this.createdAt = createdAt;
    }

    public long getId() {
        return id;
    }

    public void setId(long v) {
        id = v;
    }

    public long getGroupId() {
        return groupId;
    }

    public void setGroupId(long v) {
        groupId = v;
    }

    public long getUserId() {
        return userId;
    }

    public void setUserId(long v) {
        userId = v;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String v) {
        authorName = v;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String v) {
        message = v;
    }

    public String getResourceUrl() {
        return resourceUrl;
    }

    public void setResourceUrl(String v) {
        resourceUrl = v;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String v) {
        createdAt = v;
    }
}

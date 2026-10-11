package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

/** A member asking the community for a resource they cannot find. */
public class ResourceRequest {

    private String id;
    private String userId;
    private String userName;
    private String title;
    private String description;
    private String status = "OPEN";
    private String createdAt;

    public ResourceRequest() {
    }

    public static ResourceRequest fromFields(String[] f) {
        ResourceRequest r = new ResourceRequest();
        r.id = FileUtil.get(f, 0);
        r.userId = FileUtil.get(f, 1);
        r.userName = FileUtil.get(f, 2);
        r.title = FileUtil.get(f, 3);
        r.description = FileUtil.get(f, 4);
        r.status = FileUtil.get(f, 5);
        r.createdAt = FileUtil.get(f, 6);
        return r;
    }

    public String toLine() {
        return FileUtil.join(id, userId, userName, title, description, status, createdAt);
    }

    public boolean isOpen() {
        return "OPEN".equals(status);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}

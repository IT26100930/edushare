package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

public class Bookmark {

    private String id;
    private String userId;
    private String resourceId;
    private String date;

    public Bookmark() {
    }

    public Bookmark(String id, String userId, String resourceId, String date) {
        this.id = id;
        this.userId = userId;
        this.resourceId = resourceId;
        this.date = date;
    }

    public static Bookmark fromFields(String[] f) {
        return new Bookmark(FileUtil.get(f, 0), FileUtil.get(f, 1), FileUtil.get(f, 2), FileUtil.get(f, 3));
    }

    public String toLine() {
        return FileUtil.join(id, userId, resourceId, date);
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getResourceId() { return resourceId; }
    public String getDate() { return date; }
}

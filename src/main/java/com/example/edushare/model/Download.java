package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

public class Download {

    private String id;
    private String userId;
    private String resourceId;
    private String resourceTitle;
    private String date;

    public Download() {
    }

    public Download(String id, String userId, String resourceId, String resourceTitle, String date) {
        this.id = id;
        this.userId = userId;
        this.resourceId = resourceId;
        this.resourceTitle = resourceTitle;
        this.date = date;
    }

    public static Download fromFields(String[] f) {
        return new Download(FileUtil.get(f, 0), FileUtil.get(f, 1), FileUtil.get(f, 2),
                FileUtil.get(f, 3), FileUtil.get(f, 4));
    }

    public String toLine() {
        return FileUtil.join(id, userId, resourceId, resourceTitle, date);
    }

    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getResourceId() { return resourceId; }
    public String getResourceTitle() { return resourceTitle; }
    public String getDate() { return date; }
}

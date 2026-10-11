package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

/**
 * Abstract learning resource. Concrete types (EBook, LectureNote, PastPaper) add their own
 * two "extra" details and a label, so the rest of the system can treat them polymorphically.
 */
public abstract class Resource {

    private String id;
    private String title;
    private String description;
    private String categoryId;
    private String uploaderId;
    private String uploaderName;
    private boolean premium;
    private String content;
    private String createdAt;
    private int downloads;

    public abstract String getType();

    public abstract String getTypeLabel();

    public abstract String getExtraALabel();

    public abstract String getExtraBLabel();

    public abstract String getExtraA();

    public abstract String getExtraB();

    public abstract void setExtraA(String value);

    public abstract void setExtraB(String value);

    /** Factory used by the repository and the controllers. */
    public static Resource of(String type) {
        if (type == null) {
            throw new IllegalArgumentException("Resource type is required");
        }
        return switch (type) {
            case "EBOOK" -> new EBook();
            case "LECTURE_NOTE" -> new LectureNote();
            case "PAST_PAPER" -> new PastPaper();
            default -> throw new IllegalArgumentException("Unknown resource type: " + type);
        };
    }

    public static Resource fromFields(String[] f) {
        Resource r = of(FileUtil.get(f, 1));
        r.id = FileUtil.get(f, 0);
        r.title = FileUtil.get(f, 2);
        r.description = FileUtil.get(f, 3);
        r.categoryId = FileUtil.get(f, 4);
        r.uploaderId = FileUtil.get(f, 5);
        r.uploaderName = FileUtil.get(f, 6);
        r.premium = Boolean.parseBoolean(FileUtil.get(f, 7));
        r.content = FileUtil.get(f, 8);
        r.createdAt = FileUtil.get(f, 9);
        r.downloads = FileUtil.parseInt(FileUtil.get(f, 10), 0);
        r.setExtraA(FileUtil.get(f, 11));
        r.setExtraB(FileUtil.get(f, 12));
        return r;
    }

    public String toLine() {
        return FileUtil.join(id, getType(), title, description, categoryId, uploaderId, uploaderName,
                premium, content, createdAt, downloads, getExtraA(), getExtraB());
    }

    public void incrementDownloads() {
        downloads++;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public String getUploaderId() { return uploaderId; }
    public void setUploaderId(String uploaderId) { this.uploaderId = uploaderId; }
    public String getUploaderName() { return uploaderName; }
    public void setUploaderName(String uploaderName) { this.uploaderName = uploaderName; }
    public boolean isPremium() { return premium; }
    public void setPremium(boolean premium) { this.premium = premium; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    public int getDownloads() { return downloads; }
    public void setDownloads(int downloads) { this.downloads = downloads; }
}

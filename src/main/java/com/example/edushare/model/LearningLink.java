package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

/** Abstract "Watch & Read" link: either a VideoLink or an ArticleLink. */
public abstract class LearningLink {

    private String id;
    private String title;
    private String url;
    private String description;
    private String addedBy;
    private String addedByName;
    private String date;
    private String extra = "";

    public abstract String getKind();

    public abstract String getKindLabel();

    public abstract String getExtraLabel();

    public static LearningLink of(String kind) {
        return "VIDEO".equals(kind) ? new VideoLink() : new ArticleLink();
    }

    public static LearningLink fromFields(String[] f) {
        LearningLink l = of(FileUtil.get(f, 1));
        l.id = FileUtil.get(f, 0);
        l.title = FileUtil.get(f, 2);
        l.url = FileUtil.get(f, 3);
        l.description = FileUtil.get(f, 4);
        l.addedBy = FileUtil.get(f, 5);
        l.addedByName = FileUtil.get(f, 6);
        l.date = FileUtil.get(f, 7);
        l.extra = FileUtil.get(f, 8);
        return l;
    }

    public String toLine() {
        return FileUtil.join(id, getKind(), title, url, description, addedBy, addedByName, date, extra);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getAddedBy() { return addedBy; }
    public void setAddedBy(String addedBy) { this.addedBy = addedBy; }
    public String getAddedByName() { return addedByName; }
    public void setAddedByName(String addedByName) { this.addedByName = addedByName; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getExtra() { return extra; }
    public void setExtra(String extra) { this.extra = extra; }
}

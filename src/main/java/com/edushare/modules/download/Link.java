package com.edushare.modules.download;

public abstract class Link {

    private String status = "NEEDS_REVIEW";

    private String moderationReason = "Awaiting content review.";

    public String getStatus() {
        return status;
    }

    public void setStatus(String value) {
        status = value;
    }

    public String getModerationReason() {
        return moderationReason;
    }

    public void setModerationReason(String value) {
        moderationReason = value;
    }

    private String category = "General";

    private String moduleCode = "LINK";

    public String getCategory() {
        return category;
    }

    public void setCategory(String value) {
        category = value == null || value.isBlank() ? "General" : value;
    }

    public String getModuleCode() {
        return moduleCode;
    }

    public void setModuleCode(String value) {
        moduleCode = value == null || value.isBlank() ? "LINK" : value;
    }

    public boolean isLegacyPublication() {
        return moderationReason.startsWith("Previously published link");
    }

    private String originalCreator = "";

    public String getOriginalCreator() {
        return originalCreator;
    }

    public void setOriginalCreator(String value) {
        originalCreator = value;
    }

    private boolean hidden;

    public boolean isHidden() {
        return hidden;
    }

    public void setHidden(boolean value) {
        hidden = value;
    }

    private String ownership = "THIRD_PARTY", priceType = "Free";

    private int price;

    private boolean hasPreview;

    public String getOwnership() {
        return ownership;
    }

    public void setOwnership(String value) {
        ownership = value;
    }

    public String getPriceType() {
        return priceType;
    }

    public void setPriceType(String value) {
        priceType = value;
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int value) {
        price = value;
    }

    public boolean isHasPreview() {
        return hasPreview;
    }

    public void setHasPreview(boolean value) {
        hasPreview = value;
    }

    public boolean isOwnedVideo() {
        return "VIDEO".equals(getLinkType())
                && ("OWNED".equals(ownership) || "AUTHORIZED".equals(ownership));
    }

    private long id;

    private String title;

    private String url;

    private String uploaderEmail;

    private String chapters = "[]";

    public Link() {}

    public Link(long id, String title, String url) {
        this.id = id;
        this.title = title;
        this.url = url;
    }

    public abstract String getLinkType();

    public long getId() {
        return id;
    }

    public void setId(long value) {
        id = value;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String value) {
        title = value;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String value) {
        url = value;
    }

    public String getChapters() {
        return chapters;
    }

    public void setChapters(String chapters) {
        this.chapters = chapters == null ? "[]" : chapters;
    }

    public String getUploaderEmail() {
        return uploaderEmail;
    }

    public void setUploaderEmail(String value) {
        uploaderEmail = value;
    }
}

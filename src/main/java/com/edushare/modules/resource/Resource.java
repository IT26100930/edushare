package com.edushare.modules.resource;

public abstract class Resource {

    private long id;

    private String title;

    private String moduleCode;

    private String category;

    private String uploaderEmail;

    private String fileName;

    private String filePath;

    private String status = "PENDING";

    private String priceType = "Free";

    private int price = 0;

    private int pages = 0;

    private String description = "";

    private String academicYear = "";

    private String semester = "";

    private String tags = "";

    private String fileSize = "";

    public Resource() {}

    public Resource(
            long id,
            String title,
            String moduleCode,
            String category,
            String uploaderEmail,
            String fileName,
            String filePath) {
        this.id = id;
        this.title = title;
        this.moduleCode = moduleCode;
        this.category = category;
        this.uploaderEmail = uploaderEmail;
        this.fileName = fileName;
        this.filePath = filePath;
    }

    public abstract String getResourceType();

    public String getDisplayLabel() {
        return getResourceType() + " - " + title;
    }

    public long getId() {
        return id;
    }

    public void setId(long v) {
        id = v;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getModuleCode() {
        return moduleCode;
    }

    public void setModuleCode(String v) {
        moduleCode = v;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String v) {
        category = v;
    }

    public String getUploaderEmail() {
        return uploaderEmail;
    }

    public void setUploaderEmail(String v) {
        uploaderEmail = v;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String v) {
        fileName = v;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String v) {
        filePath = v;
    }

    public String getPriceType() {
        return priceType;
    }

    public void setPriceType(String v) {
        priceType =
                "Paid".equalsIgnoreCase(v)
                        ? "Paid"
                        : ("Premium".equalsIgnoreCase(v) ? "Premium" : "Free");
    }

    public int getPrice() {
        return price;
    }

    public void setPrice(int v) {
        price = Math.max(0, v);
    }

    public int getPages() {
        return pages;
    }

    public void setPages(int v) {
        pages = Math.max(0, v);
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v == null ? "" : v;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String v) {
        academicYear = v == null ? "" : v;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String v) {
        semester = v == null ? "" : v;
    }

    public String getTags() {
        return tags;
    }

    public void setTags(String v) {
        tags = v == null ? "" : v;
    }

    public String getFileSize() {
        return fileSize;
    }

    public void setFileSize(String v) {
        fileSize = v == null ? "" : v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        status = v;
    }
}

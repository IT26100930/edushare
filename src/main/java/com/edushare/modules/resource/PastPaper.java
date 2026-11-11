package com.edushare.modules.resource;

public class PastPaper extends Resource {

    public PastPaper() {}

    public PastPaper(
            long id,
            String title,
            String moduleCode,
            String category,
            String uploader,
            String fileName,
            String filePath) {
        super(id, title, moduleCode, category, uploader, fileName, filePath);
    }

    @Override
    public String getResourceType() {
        return "PAST_PAPER";
    }
}

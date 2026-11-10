package com.edushare.modules.resource;

public class EBook extends Resource {

    public EBook() {}

    public EBook(
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
        return "EBOOK";
    }
}

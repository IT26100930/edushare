package com.edushare.modules.resource;

public class LectureNote extends Resource {

    public LectureNote() {}

    public LectureNote(
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
        return "LECTURE_NOTE";
    }
}

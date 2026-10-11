package com.example.edushare.model;

public class LectureNote extends Resource {

    private String module = "";
    private String lecturer = "";

    @Override public String getType() { return "LECTURE_NOTE"; }
    @Override public String getTypeLabel() { return "LECTURE NOTE"; }
    @Override public String getExtraALabel() { return "Module"; }
    @Override public String getExtraBLabel() { return "Lecturer"; }
    @Override public String getExtraA() { return module; }
    @Override public String getExtraB() { return lecturer; }
    @Override public void setExtraA(String value) { this.module = value; }
    @Override public void setExtraB(String value) { this.lecturer = value; }
}

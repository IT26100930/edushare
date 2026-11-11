package com.edushare.modules.admin;

public class AcademicModule {

    private long id;

    private String code;

    private String name;

    private String facultySubject;

    private boolean active = true;

    public AcademicModule() {}

    public AcademicModule(
            long id, String code, String name, String facultySubject, boolean active) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.facultySubject = facultySubject;
        this.active = active;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getFacultySubject() {
        return facultySubject;
    }

    public void setFacultySubject(String facultySubject) {
        this.facultySubject = facultySubject;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}

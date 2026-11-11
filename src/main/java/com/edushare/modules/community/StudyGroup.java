package com.edushare.modules.community;

public class StudyGroup {

    private long id;

    private String name;

    private String moduleCode;

    private String schedule;

    private String description;

    private String badgeColor;

    public StudyGroup() {}

    public StudyGroup(
            long id,
            String name,
            String moduleCode,
            String schedule,
            String description,
            String badgeColor) {
        this.id = id;
        this.name = name;
        this.moduleCode = moduleCode;
        this.schedule = schedule;
        this.description = description;
        this.badgeColor = badgeColor;
    }

    public long getId() {
        return id;
    }

    public void setId(long v) {
        id = v;
    }

    public String getName() {
        return name;
    }

    public void setName(String v) {
        name = v;
    }

    public String getModuleCode() {
        return moduleCode;
    }

    public void setModuleCode(String v) {
        moduleCode = v;
    }

    public String getSchedule() {
        return schedule;
    }

    public void setSchedule(String v) {
        schedule = v;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String v) {
        description = v;
    }

    public String getBadgeColor() {
        return badgeColor;
    }

    public void setBadgeColor(String v) {
        badgeColor = v;
    }
}

package com.edushare.modules.admin;

public class Category {

    private long id;

    private String name;

    private String parentName;

    private String image = "";

    public String getImage() {
        return image;
    }

    public void setImage(String v) {
        image = v;
    }

    public Category() {}

    public Category(long id, String name, String parentName) {
        this.id = id;
        this.name = name;
        this.parentName = parentName;
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

    public String getParentName() {
        return parentName;
    }

    public void setParentName(String v) {
        parentName = v;
    }
}

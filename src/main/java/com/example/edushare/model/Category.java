package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

public class Category {

    private String id;
    private String name;
    private String color;

    public Category() {
    }

    public Category(String id, String name, String color) {
        this.id = id;
        this.name = name;
        this.color = color;
    }

    public static Category fromFields(String[] f) {
        return new Category(FileUtil.get(f, 0), FileUtil.get(f, 1), FileUtil.get(f, 2));
    }

    public String toLine() {
        return FileUtil.join(id, name, color);
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}

package com.example.edushare.dto;

import com.example.edushare.model.Category;

public class CategoryCount {

    private final Category category;
    private final long count;

    public CategoryCount(Category category, long count) {
        this.category = category;
        this.count = count;
    }

    public Category getCategory() { return category; }
    public long getCount() { return count; }
}

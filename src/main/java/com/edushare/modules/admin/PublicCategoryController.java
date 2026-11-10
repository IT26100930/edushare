package com.edushare.modules.admin;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class PublicCategoryController {

    private final CategoryFileRepository categories;

    public PublicCategoryController(CategoryFileRepository categories) {
        this.categories = categories;
    }

    @GetMapping("/api/categories")
    public List<Category> list() {
        return categories.findAll();
    }
}

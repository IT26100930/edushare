package com.example.edushare.service;

import com.example.edushare.dto.CategoryCount;
import com.example.edushare.model.Category;
import com.example.edushare.model.Resource;
import com.example.edushare.repository.CategoryFileRepository;
import com.example.edushare.repository.ResourceFileRepository;
import com.example.edushare.util.ColorUtil;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryFileRepository repo;
    private final ResourceFileRepository resourceRepo;

    public CategoryService(CategoryFileRepository repo, ResourceFileRepository resourceRepo) {
        this.repo = repo;
        this.resourceRepo = resourceRepo;
    }

    public List<Category> findAll() {
        return repo.findAll().stream().sorted(Comparator.comparing(Category::getName)).toList();
    }

    public Category findById(String id) {
        return id == null ? null : repo.findById(id);
    }

    public Category add(String name, String color) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Category name is required.");
        }
        for (Category c : repo.findAll()) {
            if (c.getName().equalsIgnoreCase(name.trim())) {
                throw new IllegalArgumentException("That category already exists.");
            }
        }
        Category c = new Category(FileUtil.newId("c"), name.trim(), ColorUtil.safe(color, name));
        repo.save(c);
        return c;
    }

    public List<CategoryCount> counts() {
        List<Resource> resources = resourceRepo.findAll();
        List<CategoryCount> out = new ArrayList<>();
        for (Category c : findAll()) {
            long n = resources.stream().filter(r -> c.getId().equals(r.getCategoryId())).count();
            out.add(new CategoryCount(c, n));
        }
        return out;
    }
}

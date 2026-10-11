package com.example.edushare.repository;

import com.example.edushare.model.Category;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class CategoryFileRepository {

    private static final String FILE = "categories.txt";

    public synchronized List<Category> findAll() {
        List<Category> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(Category.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public Category findById(String id) {
        return findAll().stream().filter(c -> c.getId().equals(id)).findFirst().orElse(null);
    }

    public synchronized void save(Category category) {
        List<Category> all = findAll();
        boolean replaced = false;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getId().equals(category.getId())) {
                all.set(i, category);
                replaced = true;
            }
        }
        if (!replaced) {
            all.add(category);
        }
        FileUtil.writeLines(FILE, all.stream().map(Category::toLine).toList());
    }
}

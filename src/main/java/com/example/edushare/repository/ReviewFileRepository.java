package com.example.edushare.repository;

import com.example.edushare.model.Review;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ReviewFileRepository {

    private static final String FILE = "reviews.txt";

    public synchronized List<Review> findAll() {
        List<Review> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(Review.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public synchronized void add(Review review) {
        List<Review> all = findAll();
        all.add(review);
        writeAll(all);
    }

    public synchronized void delete(String id) {
        List<Review> all = findAll();
        all.removeIf(r -> r.getId().equals(id));
        writeAll(all);
    }

    public synchronized void deleteByResource(String resourceId) {
        List<Review> all = findAll();
        all.removeIf(r -> r.getResourceId().equals(resourceId));
        writeAll(all);
    }

    private void writeAll(List<Review> all) {
        FileUtil.writeLines(FILE, all.stream().map(Review::toLine).toList());
    }
}

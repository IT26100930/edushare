package com.edushare.modules.review;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ReviewService {

    private final ReviewFileRepository repo;

    public ReviewService(ReviewFileRepository r) {
        repo = r;
    }

    public List<Review> all() {
        return repo.findAll();
    }

    public List<Review> forResource(long id) {
        List<Review> results = new ArrayList<>();
        for (Review item : repo.findAll()) {
            if (!(item.getResourceId() == id)) {
                continue;
            }
            results.add(item);
        }
        return Collections.unmodifiableList(results);
    }

    public Review save(Review r) {
        return repo.save(r);
    }

    public boolean delete(long id) {
        return repo.delete(id);
    }
}

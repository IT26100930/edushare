package com.example.edushare.service;

import com.example.edushare.model.PublicReview;
import com.example.edushare.model.Review;
import com.example.edushare.model.User;
import com.example.edushare.model.VerifiedReview;
import com.example.edushare.repository.ReviewFileRepository;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class ReviewService {

    private final ReviewFileRepository repo;
    private final DownloadService downloadService;

    public ReviewService(ReviewFileRepository repo, DownloadService downloadService) {
        this.repo = repo;
        this.downloadService = downloadService;
    }

    /** A review becomes a VerifiedReview automatically when the author has downloaded the resource. */
    public Review add(User user, String resourceId, int rating, String comment) {
        if (comment == null || comment.isBlank()) {
            throw new IllegalArgumentException("Please write a short comment.");
        }
        Review r = downloadService.hasDownloaded(user.getId(), resourceId)
                ? new VerifiedReview() : new PublicReview();
        r.setId(FileUtil.newId("v"));
        r.setResourceId(resourceId);
        r.setUserId(user.getId());
        r.setUserName(user.getName());
        r.setRating(Math.max(1, Math.min(5, rating)));
        r.setComment(comment.trim());
        r.setDate(LocalDate.now().toString());
        repo.add(r);
        return r;
    }

    public List<Review> findAll() {
        return repo.findAll().stream().sorted(Comparator.comparing(Review::getDate).reversed()).toList();
    }

    public List<Review> findByResource(String resourceId) {
        return findAll().stream().filter(r -> r.getResourceId().equals(resourceId)).toList();
    }

    public double average(String resourceId) {
        return findByResource(resourceId).stream().mapToInt(Review::getRating).average().orElse(0);
    }

    public int count(String resourceId) {
        return findByResource(resourceId).size();
    }

    public void delete(String id) {
        repo.delete(id);
    }

    public void removeAllFor(String resourceId) {
        repo.deleteByResource(resourceId);
    }
}

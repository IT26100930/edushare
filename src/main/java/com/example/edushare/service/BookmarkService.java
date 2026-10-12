package com.example.edushare.service;

import com.example.edushare.model.Bookmark;
import com.example.edushare.repository.BookmarkFileRepository;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BookmarkService {

    private final BookmarkFileRepository repo;

    public BookmarkService(BookmarkFileRepository repo) {
        this.repo = repo;
    }

    /** Adds the bookmark if missing, removes it if present. Returns true when it is now bookmarked. */
    public boolean toggle(String userId, String resourceId) {
        if (idsFor(userId).contains(resourceId)) {
            repo.remove(userId, resourceId);
            return false;
        }
        repo.add(new Bookmark(FileUtil.newId("b"), userId, resourceId, LocalDate.now().toString()));
        return true;
    }

    public Set<String> idsFor(String userId) {
        return repo.findAll().stream()
                .filter(b -> b.getUserId().equals(userId))
                .map(Bookmark::getResourceId)
                .collect(Collectors.toSet());
    }

    public List<Bookmark> findByUser(String userId) {
        return repo.findAll().stream().filter(b -> b.getUserId().equals(userId)).toList();
    }

    public long countByUser(String userId) {
        return findByUser(userId).size();
    }

    public void removeAllFor(String resourceId) {
        repo.deleteByResource(resourceId);
    }
}

package com.example.edushare.service;

import com.example.edushare.model.ResourceRequest;
import com.example.edushare.model.User;
import com.example.edushare.repository.RequestFileRepository;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class RequestService {

    private final RequestFileRepository repo;

    public RequestService(RequestFileRepository repo) {
        this.repo = repo;
    }

    public List<ResourceRequest> findAll() {
        return repo.findAll().stream()
                .sorted(Comparator.comparing(ResourceRequest::isOpen).reversed()
                        .thenComparing(ResourceRequest::getCreatedAt, Comparator.reverseOrder()))
                .toList();
    }

    public ResourceRequest create(User user, String title, String description) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Please say what resource you are looking for.");
        }
        ResourceRequest r = new ResourceRequest();
        r.setId(FileUtil.newId("q"));
        r.setUserId(user.getId());
        r.setUserName(user.getName());
        r.setTitle(title.trim());
        r.setDescription(description == null ? "" : description.trim());
        r.setStatus("OPEN");
        r.setCreatedAt(LocalDate.now().toString());
        repo.save(r);
        return r;
    }

    public void markFulfilled(User user, String id) {
        ResourceRequest r = repo.findById(id);
        if (r != null && (user.isAdmin() || r.getUserId().equals(user.getId()))) {
            r.setStatus("FULFILLED");
            repo.save(r);
        }
    }

    public void delete(User user, String id) {
        ResourceRequest r = repo.findById(id);
        if (r != null && (user.isAdmin() || r.getUserId().equals(user.getId()))) {
            repo.delete(id);
        }
    }
}

package com.edushare.modules.request;

import com.edushare.modules.user.UserService;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RequestService {

    private final RequestFileRepository repo;

    private final UserService users;

    public RequestService(RequestFileRepository repo, UserService users) {
        this.repo = repo;
        this.users = users;
    }

    public List<ResourceRequest> all() {
        List<ResourceRequest> list = new ArrayList<>(repo.findAll());
        list.forEach(r -> users.byId(r.getRequestedById()).ifPresent(r::setRequestedBy));
        return list;
    }

    public ResourceRequest create(ResourceRequest r, long userId) {
        r.setRequestedById(userId);
        r.setStatus("OPEN");
        r.setCreatedAt(java.time.Instant.now().toString());
        return repo.save(r);
    }

    public boolean active(long id) {
        return users.byId(id).filter(u -> !u.isSuspended()).isPresent();
    }

    public boolean admin(long id) {
        return users.byId(id)
                .filter(u -> !u.isSuspended() && "ADMIN".equals(u.getRole()))
                .isPresent();
    }

    public Optional<ResourceRequest> update(long id, ResourceRequest input) {
        {
            Optional<ResourceRequest> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            ResourceRequest saved = foundRecord.get();
            saved.setTitle(input.getTitle());
            saved.setMessage(input.getMessage());
            saved.setModuleCode(input.getModuleCode());
            saved.setResourceType(input.getResourceType());
            saved.setAcademicYear(input.getAcademicYear());
            saved.setNeededBy(input.getNeededBy());
            return Optional.of(repo.save(saved));
        }
    }

    public Optional<ResourceRequest> updateStatus(long id, String status) {
        {
            Optional<ResourceRequest> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            ResourceRequest r = foundRecord.get();
            r.setStatus(status);
            return Optional.of(repo.save(r));
        }
    }

    public boolean delete(long id) {
        return repo.delete(id);
    }
}

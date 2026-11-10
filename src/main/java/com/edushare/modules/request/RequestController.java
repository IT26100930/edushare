package com.edushare.modules.request;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/requests")
public class RequestController {

    private final RequestService service;

    public RequestController(RequestService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ResourceRequest>> all(HttpSession s) {
        if (s.getAttribute("userId") == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(service.all());
    }

    @PostMapping
    public ResponseEntity<ResourceRequest> create(@RequestBody ResourceRequest r, HttpSession s) {
        Object uid = s.getAttribute("userId");
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        if (!valid(r)) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.create(r, Long.parseLong(uid.toString())));
    }

    private boolean valid(ResourceRequest r) {
        return !(r == null
                || r.getTitle() == null
                || r.getTitle().trim().length() < 6
                || r.getTitle().length() > 150
                || r.getMessage() == null
                || r.getMessage().length() < 12
                || r.getMessage().length() > 1000
                || r.getResourceType() == null
                || !Set.of("Notes", "Past Paper", "Video Lesson", "Article", "Other")
                        .contains(r.getResourceType())
                || r.getModuleCode() == null
                || !r.getModuleCode().matches("[a-zA-Z0-9 -]{2,20}")
                || r.getAcademicYear() == null
                || !r.getAcademicYear().matches("[0-9]{4}|N/A")
                || r.getNeededBy() == null
                || r.getNeededBy().length() > 10
                || (!r.getNeededBy().isBlank()
                        && !r.getNeededBy().matches("[0-9]{4}-[0-9]{2}-[0-9]{2}")));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable long id, @RequestBody ResourceRequest input, HttpSession s) {
        Object uid = s.getAttribute("userId");
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        long userId;
        try {
            userId = Long.parseLong(uid.toString());
        } catch (NumberFormatException e) {
            return ResponseEntity.status(401).build();
        }
        if (!service.active(userId)) {
            return ResponseEntity.status(401).build();
        }
        java.util.Optional<com.edushare.modules.request.ResourceRequest> existing =
                service.all().stream().filter(r -> r.getId() == id).findFirst();
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (existing.get().getRequestedById() != userId && !service.admin(userId)) {
            return ResponseEntity.status(403).build();
        }
        if (!valid(input)) {
            return ResponseEntity.badRequest().build();
        }
        return service.update(id, input)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ResourceRequest> status(
            @PathVariable long id, @RequestParam String value, HttpSession s) {
        if (!"ADMIN".equals(s.getAttribute("role"))) {
            return ResponseEntity.status(403).build();
        }
        if (!Set.of("OPEN", "FULFILLED").contains(value)) {
            return ResponseEntity.badRequest().build();
        }
        return service.updateStatus(id, value)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, HttpSession s) {
        Object uid = s.getAttribute("userId");
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        Optional<ResourceRequest> found =
                service.all().stream().filter(r -> r.getId() == id).findFirst();
        if (found.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        boolean admin = "ADMIN".equals(s.getAttribute("role"));
        if (!admin && found.get().getRequestedById() != Long.parseLong(uid.toString())) {
            return ResponseEntity.status(403).build();
        }
        return service.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}

package com.edushare.modules.admin;

import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;
import jakarta.servlet.http.HttpSession;
import java.time.Instant;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
public class ModuleRequestController {
  private final TextFileStore store;
  private final UserService users;
  private final AcademicModuleFileRepository modules;
  private final CategoryFileRepository categories;

  public ModuleRequestController(
      TextFileStore store,
      UserService users,
      AcademicModuleFileRepository modules,
      CategoryFileRepository categories) {
    this.store = store;
    this.users = users;
    this.modules = modules;
    this.categories = categories;
  }

  private User account(HttpSession session) {
    try {
      return users
          .byId(Long.parseLong(Objects.toString(session.getAttribute("userId"), "")))
          .filter(u -> !u.isSuspended())
          .orElse(null);
    } catch (NumberFormatException invalid) {
      return null;
    }
  }

  private String field(Map<String, String> input, String key) {
    if (input == null) return "";
    return Objects.toString(input.get(key), "").trim();
  }

  private String subject(String value) {
    return categories.findAll().stream()
        .filter(c -> c.getName().equalsIgnoreCase(value))
        .map(Category::getName)
        .findFirst()
        .orElse(null);
  }

  private ResponseEntity<?> error(int status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }

  @GetMapping("/api/module-requests")
  public ResponseEntity<?> mine(HttpSession session) {
    User user = account(session);
    if (user == null) return error(401, "Please sign in again.");
    return ResponseEntity.ok(
        new ModuleRequestStore(store)
            .all().stream().filter(r -> r.getRequestedBy() == user.getId()).toList());
  }

  @PostMapping("/api/module-requests")
  public ResponseEntity<?> submit(@RequestBody Map<String, String> input, HttpSession session) {
    User user = account(session);
    if (user == null) return error(401, "Please sign in again.");
    String code = field(input, "code").toUpperCase(Locale.ROOT),
        name = field(input, "name"),
        reason = field(input, "reason"),
        category = subject(field(input, "facultySubject"));
    if (!code.matches("[A-Z][A-Z0-9-]{1,19}")
        || name.length() < 3
        || name.length() > 140
        || reason.length() < 10
        || reason.length() > 500
        || category == null)
      return error(
          400,
          "Use a module code (2–20 letters/digits/hyphens), module name (3–140 characters), an"
              + " existing subject and a reason (10–500 characters).");
    synchronized (store) {
      ModuleRequestStore requests = new ModuleRequestStore(store);
      if (modules.findAll().stream()
          .anyMatch(m -> m.isActive() && m.getCode().equalsIgnoreCase(code)))
        return error(409, "This module is already available. Refresh the module list.");
      List<ModuleRequest> mine =
          requests.all().stream()
              .filter(r -> r.getRequestedBy() == user.getId() && "PENDING".equals(r.getStatus()))
              .toList();
      if (mine.stream().anyMatch(r -> r.getCode().equals(code)))
        return error(
            409,
            "You already have a pending request for this code. Check My module requests below.");
      if (mine.size() >= 10)
        return error(
            429,
            "You already have 10 pending module requests. Wait for an administrator to review"
                + " them.");
      ModuleRequest request =
          new ModuleRequest(
              requests.nextId(),
              user.getId(),
              code,
              name,
              category,
              reason,
              "PENDING",
              "",
              Instant.now().toString(),
              "",
              0);
      requests.save(request);
      return ResponseEntity.status(201).body(request);
    }
  }

  @GetMapping("/api/admin/module-requests")
  public ResponseEntity<?> adminList(HttpSession session) {
    User user = account(session);
    if (user == null) return error(401, "Please sign in again.");
    if (!"ADMIN".equals(user.getRole())) return error(403, "Administrator access is required.");
    return ResponseEntity.ok(new ModuleRequestStore(store).all());
  }

  @PostMapping("/api/admin/module-requests/{id}/decision")
  public ResponseEntity<?> decide(
      @PathVariable long id, @RequestBody Map<String, String> input, HttpSession session) {
    User user = account(session);
    if (user == null) return error(401, "Please sign in again.");
    if (!"ADMIN".equals(user.getRole())) return error(403, "Administrator access is required.");
    String status = field(input, "status"), note = field(input, "note");
    if (!Set.of("APPROVED", "REJECTED").contains(status)
        || note.length() > 500
        || ("REJECTED".equals(status) && note.length() < 5))
      return error(400, "Choose Approve or Reject. Rejections need a reason of 5–500 characters.");
    synchronized (store) {
      ModuleRequestStore requests = new ModuleRequestStore(store);
      ModuleRequest request =
          requests.all().stream().filter(r -> r.getId() == id).findFirst().orElse(null);
      if (request == null) return error(404, "Module request not found.");
      if (!"PENDING".equals(request.getStatus()))
        return error(409, "This request has already been reviewed. Refresh the list.");
      long moduleId = 0;
      boolean created = false;
      AcademicModule changed = null;
      boolean wasActive = false;
      if ("APPROVED".equals(status)) {
        if (subject(request.getFacultySubject()) == null)
          return error(
              400, "The requested subject no longer exists. Restore the subject before approving.");
        changed =
            modules.findAll().stream()
                .filter(m -> m.getCode().equalsIgnoreCase(request.getCode()))
                .findFirst()
                .orElse(null);
        if (changed == null) {
          changed =
              new AcademicModule(
                  0, request.getCode(), request.getName(), request.getFacultySubject(), true);
          created = true;
        } else wasActive = changed.isActive();
        changed.setActive(true);
        modules.save(changed);
        moduleId = changed.getId();
      }
      request.decide(
          status,
          note.isBlank() ? "Module is now available in the catalog." : note,
          Instant.now().toString(),
          moduleId);
      try {
        requests.save(request);
      } catch (RuntimeException failure) {
        if (created) modules.delete(moduleId);
        else if (changed != null) {
          changed.setActive(wasActive);
          modules.save(changed);
        }
        throw failure;
      }
      return ResponseEntity.ok(request);
    }
  }
}

package com.edushare.modules.admin;

import com.edushare.modules.download.LinkFileRepository;
import com.edushare.modules.request.RequestService;
import com.edushare.modules.resource.ResourceService;
import com.edushare.modules.review.ReviewService;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;
import jakarta.servlet.http.HttpSession;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.time.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

  private final TextFileStore store;

  private final CategoryFileRepository categories;

  private final AcademicModuleFileRepository modules;

  private final UserService users;

  private final ResourceService resources;

  private final LinkFileRepository links;

  private final RequestService requests;

  private final ReviewService reviews;

  public AdminController(
      CategoryFileRepository c,
      AcademicModuleFileRepository modules,
      UserService u,
      ResourceService r,
      RequestService q,
      ReviewService v,
      TextFileStore store,
      LinkFileRepository links) {
    this.store = store;
    this.links = links;
    categories = c;
    this.modules = modules;
    users = u;
    resources = r;
    requests = q;
    reviews = v;
  }

  private boolean admin(HttpSession s) {
    Object id = s.getAttribute("userId");
    if (id == null) {
      return false;
    }
    return users
        .byId(Long.parseLong(id.toString()))
        .filter(u -> "ADMIN".equals(u.getRole()) && !u.isSuspended())
        .isPresent();
  }

  @GetMapping("/stats")
  public ResponseEntity<Map<String, Object>> stats(HttpSession s) {
    if (!admin(s)) {
      return ResponseEntity.status(403).build();
    }
    Map<String, Object> m = new LinkedHashMap<>();
    m.put("users", users.all().size());
    m.put(
        "pendingModuleRequests",
        new ModuleRequestStore(store)
            .all().stream().filter(r -> "PENDING".equals(r.getStatus())).count());
    m.put(
        "resources",
        resources.all(null, null, null).size() + links.findAllIncludingHidden().size());
    m.put("documents", resources.all(null, null, null).size());
    m.put("externalLinks", links.findAllIncludingHidden().size());
    m.put(
        "openRequests", requests.all().stream().filter(r -> "OPEN".equals(r.getStatus())).count());
    m.put("reviews", reviews.all().size());
    List<String> dl = store.read("downloads.txt");
    m.put("downloads", dl.stream().filter(x -> !x.isBlank()).count());
    String today = LocalDate.now().toString();
    Map<String, Long> daily = new TreeMap<>();
    for (int i = 29; i >= 0; i--) {
      daily.put(LocalDate.now().minusDays(i).toString(), 0L);
    }
    for (String line : dl) {
      String[] p = line.split("\\|", -1);
      if (p.length >= 3 && p[2].length() >= 10) {
        String date = p[2].substring(0, 10);
        if (daily.containsKey(date)) {
          daily.put(date, daily.get(date) + 1);
        }
      }
    }
    m.put("dailyDownloads", daily);
    long revenue = 0;
    for (String line : store.read("demo_payments.txt")) {
      String[] p = line.split("\\|", -1);
      if (p.length >= 8 && "SIMULATED_SUCCESS".equals(p[7])) {
        try {
          revenue += Long.parseLong(p[4]);
        } catch (NumberFormatException ignored) {
        }
      }
    }
    m.put("demoPaymentTotal", revenue);
    java.util.List<com.edushare.modules.resource.Resource> allDocuments =
        resources.all(null, null, null);
    java.util.List<com.edushare.modules.download.Link> allLinks = links.findAllIncludingHidden();
    long pendingDocuments =
        allDocuments.stream()
            .filter(
                r ->
                    "PENDING".equalsIgnoreCase(r.getStatus())
                        || "NEEDS_REVIEW".equalsIgnoreCase(r.getStatus()))
            .count();
    long pendingLinks = allLinks.stream().filter(l -> "NEEDS_REVIEW".equals(l.getStatus())).count();
    m.put("pendingDocuments", pendingDocuments);
    m.put("pendingLinks", pendingLinks);
    m.put("pendingResources", pendingDocuments + pendingLinks);
    m.put(
        "publicResources",
        allDocuments.stream().filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus())).count()
            + links.findAll().size());
    m.put(
        "rejectedResources",
        allDocuments.stream().filter(r -> "REJECTED".equalsIgnoreCase(r.getStatus())).count()
            + allLinks.stream().filter(l -> "REJECTED".equals(l.getStatus())).count());
    m.put("hiddenLinks", allLinks.stream().filter(l -> links.isHidden(l.getId())).count());
    Map<String, Long> categoryCounts = new TreeMap<>();
    allDocuments.forEach(r -> categoryCounts.merge(r.getCategory(), 1L, Long::sum));
    allLinks.forEach(l -> categoryCounts.merge(l.getCategory(), 1L, Long::sum));
    m.put("categoryCounts", categoryCounts);
    List<Map<String, Object>> catalogRows = new ArrayList<>();
    allDocuments.forEach(
        r ->
            catalogRows.add(
                Map.of(
                    "id",
                    "pdf-" + r.getId(),
                    "title",
                    r.getTitle(),
                    "uploaderEmail",
                    Objects.toString(r.getUploaderEmail(), ""),
                    "kind",
                    "PDF",
                    "status",
                    r.getStatus())));
    allLinks.forEach(
        l ->
            catalogRows.add(
                Map.of(
                    "id",
                    "link-" + l.getId(),
                    "title",
                    l.getTitle(),
                    "uploaderEmail",
                    Objects.toString(l.getUploaderEmail(), ""),
                    "kind",
                    l.getLinkType(),
                    "status",
                    l.getStatus())));
    Collections.reverse(catalogRows);
    m.put("recentCatalog", catalogRows.stream().limit(6).toList());
    m.put("pendingReports", countOpenReports(store.read("reports.txt")));
    return ResponseEntity.ok(m);
  }

  // Match the report reader's valid rows and the Reports page's two open statuses.
  static long countOpenReports(List<String> rows) {
    long count = 0;
    for (String row : rows) {
      String[] fields = row.split("\\|", -1);
      if (fields.length < 8) continue;
      try {
        Long.parseLong(fields[1]);
        Long.parseLong(fields[3]);
        if ("pending".equals(fields[7]) || "needs_evidence".equals(fields[7])) count++;
      } catch (NumberFormatException ignored) {
        // Malformed rows are also omitted by ResourceReportController.read().
      }
    }
    return count;
  }

  public static final class StatusRequest {

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    private final String status;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public StatusRequest(@com.fasterxml.jackson.annotation.JsonProperty("status") String status) {
      this.status = status;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
      return status;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      StatusRequest value = (StatusRequest) other;
      return java.util.Objects.equals(status, value.status);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(status);
      return result;
    }

    @Override
    public String toString() {
      return "StatusRequest[" + "status=" + status + "]";
    }
  }

  /** Legacy endpoint cannot bypass reason-required audited resource moderation. */
  @PatchMapping("/resources/{id}/status")
  public ResponseEntity<?> resourceStatus(
      @PathVariable long id, @RequestBody StatusRequest action, HttpSession session) {
    if (!admin(session)) {
      return ResponseEntity.status(403).build();
    }
    return ResponseEntity.status(409)
        .body(Map.of("error", "Use Resource Inspection to record a review decision and reason."));
  }

  /** Delete a persisted resource, not just a card in the React interface. */
  @DeleteMapping("/resources/{id}")
  public ResponseEntity<?> deleteResource(@PathVariable long id, HttpSession session) {
    if (!admin(session)) {
      return ResponseEntity.status(403)
          .body(Map.of("error", "Please sign in with a valid administrator account."));
    }
    if (resources.byId(id).isEmpty()) {
      return ResponseEntity.status(404)
          .body(Map.of("error", "This resource has already been removed."));
    }
    boolean removed = resources.delete(id);
    if (!removed || resources.byId(id).isPresent()) {
      return ResponseEntity.status(500)
          .body(Map.of("error", "The resource could not be removed from storage."));
    }
    return ResponseEntity.noContent().build();
  }
}


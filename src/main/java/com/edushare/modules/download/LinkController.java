package com.edushare.modules.download;

import com.edushare.modules.user.FollowResourceAlertService;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;
import jakarta.servlet.http.HttpSession;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/links")
public class LinkController {

  private final LinkContentPolicy policy;

  private final LinkFileRepository repo;

  private final UserService users;

  private final FollowResourceAlertService followAlerts;

  private final TextFileStore store;

  public LinkController(
      LinkFileRepository r,
      UserService u,
      TextFileStore textStore,
      FollowResourceAlertService followAlerts,
      LinkContentPolicy policy) {
    this.policy = policy;
    repo = r;
    users = u;
    store = textStore;
    this.followAlerts = followAlerts;
  }

  public static final class LinkDto {

    @com.fasterxml.jackson.annotation.JsonProperty("type")
    private final String type;

    @com.fasterxml.jackson.annotation.JsonProperty("title")
    private final String title;

    @com.fasterxml.jackson.annotation.JsonProperty("url")
    private final String url;

    @com.fasterxml.jackson.annotation.JsonProperty("chapters")
    private final String chapters;

    @com.fasterxml.jackson.annotation.JsonProperty("originalCreator")
    private final String originalCreator;

    @com.fasterxml.jackson.annotation.JsonProperty("thirdPartyConfirmed")
    private final Boolean thirdPartyConfirmed;

    @com.fasterxml.jackson.annotation.JsonProperty("category")
    private final String category;

    @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
    private final String moduleCode;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public LinkDto(
        @com.fasterxml.jackson.annotation.JsonProperty("type") String type,
        @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
        @com.fasterxml.jackson.annotation.JsonProperty("url") String url,
        @com.fasterxml.jackson.annotation.JsonProperty("chapters") String chapters,
        @com.fasterxml.jackson.annotation.JsonProperty("originalCreator") String originalCreator,
        @com.fasterxml.jackson.annotation.JsonProperty("thirdPartyConfirmed")
            Boolean thirdPartyConfirmed,
        @com.fasterxml.jackson.annotation.JsonProperty("category") String category,
        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode) {
      this.type = type;
      this.title = title;
      this.url = url;
      this.chapters = chapters;
      this.originalCreator = originalCreator;
      this.thirdPartyConfirmed = thirdPartyConfirmed;
      this.category = category;
      this.moduleCode = moduleCode;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("type")
    public String getType() {
      return type;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("title")
    public String getTitle() {
      return title;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("url")
    public String getUrl() {
      return url;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("chapters")
    public String getChapters() {
      return chapters;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("originalCreator")
    public String getOriginalCreator() {
      return originalCreator;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("thirdPartyConfirmed")
    public Boolean getThirdPartyConfirmed() {
      return thirdPartyConfirmed;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("category")
    public String getCategory() {
      return category;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
    public String getModuleCode() {
      return moduleCode;
    }

    public LinkDto(
        String type, String title, String url, String chapters, String creator, Boolean confirmed) {
      this(type, title, url, chapters, creator, confirmed, null, null);
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      LinkDto value = (LinkDto) other;
      return java.util.Objects.equals(type, value.type)
          && java.util.Objects.equals(title, value.title)
          && java.util.Objects.equals(url, value.url)
          && java.util.Objects.equals(chapters, value.chapters)
          && java.util.Objects.equals(originalCreator, value.originalCreator)
          && java.util.Objects.equals(thirdPartyConfirmed, value.thirdPartyConfirmed)
          && java.util.Objects.equals(category, value.category)
          && java.util.Objects.equals(moduleCode, value.moduleCode);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(type);
      result = 31 * result + java.util.Objects.hashCode(title);
      result = 31 * result + java.util.Objects.hashCode(url);
      result = 31 * result + java.util.Objects.hashCode(chapters);
      result = 31 * result + java.util.Objects.hashCode(originalCreator);
      result = 31 * result + java.util.Objects.hashCode(thirdPartyConfirmed);
      result = 31 * result + java.util.Objects.hashCode(category);
      result = 31 * result + java.util.Objects.hashCode(moduleCode);
      return result;
    }

    @Override
    public String toString() {
      return "LinkDto["
          + "type="
          + type
          + ", title="
          + title
          + ", url="
          + url
          + ", chapters="
          + chapters
          + ", originalCreator="
          + originalCreator
          + ", thirdPartyConfirmed="
          + thirdPartyConfirmed
          + ", category="
          + category
          + ", moduleCode="
          + moduleCode
          + "]";
    }
  }

  private boolean validAttribution(LinkDto d) {
    if (d == null
        || d.getType() == null
        || !Set.of("VIDEO", "ARTICLE").contains(d.getType().toUpperCase(Locale.ROOT))
        || !Boolean.TRUE.equals(d.getThirdPartyConfirmed())) {
      return false;
    }
    String creator = Objects.toString(d.getOriginalCreator(), "").trim();
    if (creator.length() < 2
        || creator.length() > 120
        || creator.contains("|")
        || creator.contains("\n")) {
      return false;
    }
    if (Objects.toString(d.getCategory(), "").length() > 100
        || Objects.toString(d.getModuleCode(), "").length() > 40) {
      return false;
    }
    String url = Objects.toString(d.getUrl(), "").trim();
    if (url.length() > 2048
        || d.getTitle() == null
        || d.getTitle().trim().isEmpty()
        || d.getTitle().length() > 200) {
      return false;
    }
    try {
      java.net.URI uri = java.net.URI.create(url);
      return "https".equalsIgnoreCase(uri.getScheme())
          && uri.getHost() != null
          && !uri.getHost().isBlank()
          && uri.getRawUserInfo() == null;
    } catch (IllegalArgumentException error) {
      return false;
    }
  }

  private void saveAttribution(long id, LinkDto d) {
    // Separate metadata file preserves compatibility with existing 6-column links.txt.
    synchronized (store) {
      List<String> rows = store.read("external-link-attribution.txt");
      rows.removeIf(row -> row.startsWith(id + "|"));
      String encoded =
          Base64.getEncoder()
              .encodeToString(
                  d.getOriginalCreator().trim().getBytes(java.nio.charset.StandardCharsets.UTF_8));
      rows.add(id + "|" + encoded + "|true|" + java.time.Instant.now());
      store.write("external-link-attribution.txt", rows);
    }
  }

  @GetMapping("/{id}/attribution")
  public ResponseEntity<?> attribution(@PathVariable long id, HttpSession s) {
    if (s.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    if (repo.findById(id).isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    for (String row : store.read("external-link-attribution.txt")) {
      String[] parts = row.split("\\|", -1);
      if (parts.length >= 3 && parts[0].equals(Long.toString(id))) {
        try {
          String creator =
              new String(
                  Base64.getDecoder().decode(parts[1]), java.nio.charset.StandardCharsets.UTF_8);
          return ResponseEntity.ok(
              Map.of(
                  "originalCreator",
                  creator,
                  "attributionProvided",
                  true,
                  "independentlyVerified",
                  false));
        } catch (IllegalArgumentException ignored) {
          break;
        }
      }
    }
    return ResponseEntity.ok(Map.of("attributionProvided", false, "independentlyVerified", false));
  }

  private boolean validChapters(String json) {
    if (json == null || json.isBlank()) {
      return true;
    }
    if (json.length() > 12000) {
      return false;
    }
    try {
      com.fasterxml.jackson.databind.JsonNode array =
          new com.fasterxml.jackson.databind.ObjectMapper().readTree(json);
      if (!array.isArray() || array.size() > 50) {
        return false;
      }
      int previous = -1;
      for (com.fasterxml.jackson.databind.JsonNode row : array) {
        if (!row.isObject() || !row.path("seconds").canConvertToInt()) {
          return false;
        }
        int second = row.path("seconds").intValue();
        String label = row.path("label").asText("").trim();
        String time = row.path("time").asText("").trim();
        if (second <= previous
            || second < 0
            || label.isEmpty()
            || label.length() > 120
            || !time.matches("\\d{1,3}:\\d{2}(:\\d{2})?")) {
          return false;
        }
        String[] parts = time.split(":");
        int computed;
        if (parts.length == 2) {
          int mm = Integer.parseInt(parts[0]);
          int ss = Integer.parseInt(parts[1]);
          if (ss >= 60 || mm > 999) {
            return false;
          }
          computed = mm * 60 + ss;
        } else {
          int hh = Integer.parseInt(parts[0]);
          int mm = Integer.parseInt(parts[1]);
          int ss = Integer.parseInt(parts[2]);
          if (hh > 99 || mm >= 60 || ss >= 60) {
            return false;
          }
          computed = hh * 3600 + mm * 60 + ss;
        }
        if (computed != second) {
          return false;
        }
        previous = second;
      }
      return true;
    } catch (Exception ignored) {
      return false;
    }
  }

  @GetMapping
  public ResponseEntity<List<Link>> all(HttpSession s) {
    if (s.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    com.edushare.modules.user.User user =
        users
            .byId(Long.parseLong(s.getAttribute("userId").toString()))
            .filter(u -> !u.isSuspended())
            .orElse(null);
    if (user == null) {
      return ResponseEntity.status(401).build();
    }
    return ResponseEntity.ok(
        repo.findAllIncludingHidden().stream()
            .filter(
                l ->
                    "ADMIN".equals(user.getRole())
                        || user.getEmail().equalsIgnoreCase(l.getUploaderEmail())
                        || ("APPROVED".equals(l.getStatus()) && !repo.isHidden(l.getId())))
            .toList());
  }

  @PostMapping
  public ResponseEntity<Link> create(@RequestBody LinkDto d, HttpSession s) {
    if (s.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    if (d == null || !validChapters(d.getChapters()) || !validAttribution(d)) {
      return ResponseEntity.badRequest().build();
    }
    Link l = "ARTICLE".equalsIgnoreCase(d.getType()) ? new ArticleLink() : new VideoLink();
    l.setTitle(d.getTitle());
    l.setUrl(d.getUrl());
    l.setChapters(d.getChapters());
    l.setCategory(d.getCategory());
    l.setModuleCode(d.getModuleCode());
    java.util.Optional<com.edushare.modules.user.User> owner =
        users
            .byId(Long.parseLong(s.getAttribute("userId").toString()))
            .filter(user -> !user.isSuspended());
    if (owner.isEmpty()) {
      return ResponseEntity.status(401).build();
    }
    l.setUploaderEmail(owner.get().getEmail());
    new com.edushare.modules.admin.SellingPolicyStore(store)
        .validatePricing(
            "ARTICLE".equalsIgnoreCase(d.getType()) ? "Article link" : "Video link",
            "Free",
            d.getTitle(),
            "");
    applyCheck(l);
    Link saved = repo.save(l);
    repo.audit(saved, "AUTOMATIC");
    saveAttribution(saved.getId(), d);
    if ("APPROVED".equals(saved.getStatus())) {
      followAlerts.published(
          "backend-link-" + saved.getId(),
          saved.getTitle(),
          saved.getLinkType(),
          saved.getUploaderEmail());
    }
    return ResponseEntity.ok(saved);
  }

  @PutMapping("/{id}")
  public ResponseEntity<Link> update(@PathVariable long id, @RequestBody LinkDto d, HttpSession s) {
    if (s.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    if (d == null || !validChapters(d.getChapters()) || !validAttribution(d)) {
      return ResponseEntity.badRequest().build();
    }
    Link original = repo.findByIdIncludingHidden(id).orElse(null);
    if (original == null) {
      return ResponseEntity.notFound().build();
    }
    if (original.isOwnedVideo()) {
      return ResponseEntity.badRequest().build();
    }
    String email =
        users
            .byId(Long.parseLong(s.getAttribute("userId").toString()))
            .map(user -> user.getEmail())
            .orElse("");
    if (!"ADMIN".equals(s.getAttribute("role"))
        && !email.equalsIgnoreCase(String.valueOf(original.getUploaderEmail()))) {
      return ResponseEntity.status(403).build();
    }
    Link l = "ARTICLE".equalsIgnoreCase(d.getType()) ? new ArticleLink() : new VideoLink();
    l.setId(id);
    l.setTitle(d.getTitle());
    l.setUrl(d.getUrl());
    l.setChapters(d.getChapters());
    l.setCategory(d.getCategory());
    l.setModuleCode(d.getModuleCode());
    l.setUploaderEmail(original.getUploaderEmail());
    new com.edushare.modules.admin.SellingPolicyStore(store)
        .validatePricing(
            "ARTICLE".equalsIgnoreCase(d.getType()) ? "Article link" : "Video link",
            "Free",
            d.getTitle(),
            "");
    applyCheck(l);
    Link saved;
    synchronized (repo) {
      Link latest = repo.findByIdIncludingHidden(id).orElse(null);
      if (latest == null) {
        return ResponseEntity.notFound().build();
      }
      if (!Objects.equals(latest.getUrl(), original.getUrl())
          || !Objects.equals(latest.getTitle(), original.getTitle())
          || !Objects.equals(latest.getStatus(), original.getStatus())) {
        return ResponseEntity.status(409).build();
      }
      saved = repo.save(l);
      repo.audit(saved, "AUTOMATIC_EDIT");
    }
    saveAttribution(saved.getId(), d);
    if ("APPROVED".equals(saved.getStatus()) && !repo.isHidden(id)) {
      followAlerts.published(
          "backend-link-" + saved.getId(),
          saved.getTitle(),
          saved.getLinkType(),
          saved.getUploaderEmail());
    }
    return ResponseEntity.ok(saved);
  }

  private void applyCheck(Link link) {
    LinkContentPolicy.Result result = policy.check(link);
    link.setStatus(result.getStatus());
    link.setModerationReason(result.getReason());
  }

  @GetMapping("/mine")
  public ResponseEntity<?> mine(HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    String email =
        users
            .byId(Long.parseLong(session.getAttribute("userId").toString()))
            .map(u -> u.getEmail())
            .orElse("");
    if (email.isBlank()) {
      return ResponseEntity.status(401).build();
    }
    return ResponseEntity.ok(
        repo.findAllIncludingHidden().stream()
            .filter(l -> email.equalsIgnoreCase(l.getUploaderEmail()))
            .toList());
  }

  public static final class OwnerDeleteRequest {

    @com.fasterxml.jackson.annotation.JsonProperty("reason")
    private final String reason;

    @com.fasterxml.jackson.annotation.JsonProperty("feedback")
    private final String feedback;

    @com.fasterxml.jackson.annotation.JsonProperty("confirmation")
    private final String confirmation;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public OwnerDeleteRequest(
        @com.fasterxml.jackson.annotation.JsonProperty("reason") String reason,
        @com.fasterxml.jackson.annotation.JsonProperty("feedback") String feedback,
        @com.fasterxml.jackson.annotation.JsonProperty("confirmation") String confirmation) {
      this.reason = reason;
      this.feedback = feedback;
      this.confirmation = confirmation;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("reason")
    public String getReason() {
      return reason;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("feedback")
    public String getFeedback() {
      return feedback;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("confirmation")
    public String getConfirmation() {
      return confirmation;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      OwnerDeleteRequest value = (OwnerDeleteRequest) other;
      return java.util.Objects.equals(reason, value.reason)
          && java.util.Objects.equals(feedback, value.feedback)
          && java.util.Objects.equals(confirmation, value.confirmation);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(reason);
      result = 31 * result + java.util.Objects.hashCode(feedback);
      result = 31 * result + java.util.Objects.hashCode(confirmation);
      return result;
    }

    @Override
    public String toString() {
      return "OwnerDeleteRequest["
          + "reason="
          + reason
          + ", feedback="
          + feedback
          + ", confirmation="
          + confirmation
          + "]";
    }
  }

  @PostMapping("/{id}/owner-delete")
  public ResponseEntity<Map<String, String>> ownerDelete(
      @PathVariable long id, @RequestBody OwnerDeleteRequest d, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    Link link = repo.findByIdIncludingHidden(id).orElse(null);
    if (link == null) {
      return ResponseEntity.notFound().build();
    }
    String email =
        users
            .byId(Long.parseLong(session.getAttribute("userId").toString()))
            .map(u -> u.getEmail())
            .orElse("");
    if (email.isBlank() || !email.equalsIgnoreCase(String.valueOf(link.getUploaderEmail()))) {
      return ResponseEntity.status(403)
          .body(Map.of("error", "Only the uploader can remove this link"));
    }
    String reason = Objects.toString(d.getReason(), "").trim(),
        feedback = Objects.toString(d.getFeedback(), "").trim();
    if (!"DELETE".equals(d.getConfirmation())
        || reason.isBlank()
        || feedback.length() < 10
        || feedback.length() > 1000) {
      return ResponseEntity.badRequest()
          .body(
              Map.of(
                  "error",
                  "Select a reason, give feedback (10-1000 characters) and type" + " DELETE"));
    }
    synchronized (repo) {
      Link current = repo.findByIdIncludingHidden(id).orElse(null);
      if (current == null) {
        return ResponseEntity.notFound().build();
      }
      if (!email.equalsIgnoreCase(String.valueOf(current.getUploaderEmail()))) {
        return ResponseEntity.status(403).build();
      }
      if (!repo.delete(id)) {
        return ResponseEntity.notFound().build();
      }
      List<String> audit = store.read("resource_deletion_feedback.txt");
      audit.add(
          java.time.Instant.now()
              + "|link-"
              + id
              + "|"
              + TextFileStore.clean(email)
              + "|"
              + TextFileStore.clean(current.getTitle())
              + "|"
              + TextFileStore.clean(reason)
              + "|"
              + TextFileStore.clean(feedback));
      store.write("resource_deletion_feedback.txt", audit);
    }
    return ResponseEntity.ok(Map.of("status", "DELETED"));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id, HttpSession s) {
    if (!"ADMIN".equals(s.getAttribute("role"))) {
      return ResponseEntity.status(403).build();
    }
    return repo.delete(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
  }
}

package com.edushare.modules.request;

import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;
import jakarta.servlet.http.HttpSession;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Student replies to resource requests, persisted in request-offers.txt; no database. */
@RestController
@RequestMapping("/api/requests")
public class RequestOfferController {

  private final TextFileStore store;

  private final RequestService service;

  private final UserService users;

  public RequestOfferController(TextFileStore store, RequestService service, UserService users) {
    this.store = store;
    this.service = service;
    this.users = users;
  }

  public static final class Offer {

    @com.fasterxml.jackson.annotation.JsonProperty("id")
    private final long id;

    @com.fasterxml.jackson.annotation.JsonProperty("requestId")
    private final long requestId;

    @com.fasterxml.jackson.annotation.JsonProperty("offeredById")
    private final long offeredById;

    @com.fasterxml.jackson.annotation.JsonProperty("url")
    private final String url;

    @com.fasterxml.jackson.annotation.JsonProperty("note")
    private final String note;

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    private final String status;

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    private final String createdAt;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public Offer(
        @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
        @com.fasterxml.jackson.annotation.JsonProperty("requestId") long requestId,
        @com.fasterxml.jackson.annotation.JsonProperty("offeredById") long offeredById,
        @com.fasterxml.jackson.annotation.JsonProperty("url") String url,
        @com.fasterxml.jackson.annotation.JsonProperty("note") String note,
        @com.fasterxml.jackson.annotation.JsonProperty("status") String status,
        @com.fasterxml.jackson.annotation.JsonProperty("createdAt") String createdAt) {
      this.id = id;
      this.requestId = requestId;
      this.offeredById = offeredById;
      this.url = url;
      this.note = note;
      this.status = status;
      this.createdAt = createdAt;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("id")
    public long getId() {
      return id;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("requestId")
    public long getRequestId() {
      return requestId;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("offeredById")
    public long getOfferedById() {
      return offeredById;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("url")
    public String getUrl() {
      return url;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("note")
    public String getNote() {
      return note;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("status")
    public String getStatus() {
      return status;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
    public String getCreatedAt() {
      return createdAt;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      Offer value = (Offer) other;
      return java.util.Objects.equals(id, value.id)
          && java.util.Objects.equals(requestId, value.requestId)
          && java.util.Objects.equals(offeredById, value.offeredById)
          && java.util.Objects.equals(url, value.url)
          && java.util.Objects.equals(note, value.note)
          && java.util.Objects.equals(status, value.status)
          && java.util.Objects.equals(createdAt, value.createdAt);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(id);
      result = 31 * result + java.util.Objects.hashCode(requestId);
      result = 31 * result + java.util.Objects.hashCode(offeredById);
      result = 31 * result + java.util.Objects.hashCode(url);
      result = 31 * result + java.util.Objects.hashCode(note);
      result = 31 * result + java.util.Objects.hashCode(status);
      result = 31 * result + java.util.Objects.hashCode(createdAt);
      return result;
    }

    @Override
    public String toString() {
      return "Offer["
          + "id="
          + id
          + ", requestId="
          + requestId
          + ", offeredById="
          + offeredById
          + ", url="
          + url
          + ", note="
          + note
          + ", status="
          + status
          + ", createdAt="
          + createdAt
          + "]";
    }
  }

  public static final class SubmitOffer {

    @com.fasterxml.jackson.annotation.JsonProperty("url")
    private final String url;

    @com.fasterxml.jackson.annotation.JsonProperty("note")
    private final String note;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public SubmitOffer(
        @com.fasterxml.jackson.annotation.JsonProperty("url") String url,
        @com.fasterxml.jackson.annotation.JsonProperty("note") String note) {
      this.url = url;
      this.note = note;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("url")
    public String getUrl() {
      return url;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("note")
    public String getNote() {
      return note;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      SubmitOffer value = (SubmitOffer) other;
      return java.util.Objects.equals(url, value.url) && java.util.Objects.equals(note, value.note);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(url);
      result = 31 * result + java.util.Objects.hashCode(note);
      return result;
    }

    @Override
    public String toString() {
      return "SubmitOffer[" + "url=" + url + ", note=" + note + "]";
    }
  }

  private long current(HttpSession session) {
    try {
      return Long.parseLong(Objects.toString(session.getAttribute("userId"), "-1"));
    } catch (NumberFormatException e) {
      return -1;
    }
  }

  private String encode(String s) {
    return Base64.getEncoder().encodeToString(s.getBytes(StandardCharsets.UTF_8));
  }

  private String decode(String s) {
    try {
      return new String(Base64.getDecoder().decode(s), StandardCharsets.UTF_8);
    } catch (Exception e) {
      return "";
    }
  }

  private synchronized List<Offer> read() {
    List<Offer> out = new ArrayList<>();
    for (String l : store.read("request-offers.txt")) {
      String[] p = l.split("\\|", -1);
      if (p.length != 7) {
        continue;
      }
      try {
        out.add(
            new Offer(
                Long.parseLong(p[0]),
                Long.parseLong(p[1]),
                Long.parseLong(p[2]),
                decode(p[3]),
                decode(p[4]),
                p[5],
                p[6]));
      } catch (NumberFormatException ignored) {
      }
    }
    return out;
  }

  private synchronized void write(List<Offer> list) {
    List<String> rows = new ArrayList<>();
    for (Offer o : list) {
      rows.add(
          String.join(
              "|",
              Long.toString(o.getId()),
              Long.toString(o.getRequestId()),
              Long.toString(o.getOfferedById()),
              encode(o.getUrl()),
              encode(o.getNote()),
              o.getStatus(),
              o.getCreatedAt()));
    }
    store.write("request-offers.txt", rows);
  }

  @org.springframework.beans.factory.annotation.Value(
      "${edushare.public-url:http://localhost:8080}")
  private String publicUrl = "http://localhost:8080";

  private boolean validUrl(String url) {
    if (url == null || url.length() > 650) {
      return false;
    }
    try {
      URI u = URI.create(url.trim());
      if (u.getHost() == null || u.getHost().isBlank() || u.getUserInfo() != null) return false;
      if ("https".equalsIgnoreCase(u.getScheme())) return true;
      if (!"http".equalsIgnoreCase(u.getScheme())
          || u.getRawPath() == null
          || !u.getRawPath().matches("/resource/backend-(resource|link)-[1-9][0-9]*")) return false;
      URI application = URI.create(publicUrl);
      boolean local =
          Set.of("localhost", "127.0.0.1", "[::1]", "::1")
              .contains(u.getHost().toLowerCase(Locale.ROOT));
      return local
          || ("http".equalsIgnoreCase(application.getScheme())
              && u.getHost().equalsIgnoreCase(application.getHost())
              && u.getPort() == application.getPort());
    } catch (Exception e) {
      return false;
    }
  }

  @GetMapping("/{id}/offers")
  public ResponseEntity<?> offers(@PathVariable long id, HttpSession session) {
    if (current(session) <= 0 || users.byId(current(session)).isEmpty()) {
      return ResponseEntity.status(401).build();
    }
    return ResponseEntity.ok(read().stream().filter(o -> o.getRequestId() == id).toList());
  }

  @PostMapping("/{id}/offers")
  public synchronized ResponseEntity<?> offer(
      @PathVariable long id, @RequestBody SubmitOffer input, HttpSession session) {
    long uid = current(session);
    java.util.Optional<com.edushare.modules.user.User> account = users.byId(uid);
    if (uid <= 0 || account.isEmpty() || account.get().isSuspended()) {
      return ResponseEntity.status(401).build();
    }
    java.util.Optional<com.edushare.modules.request.ResourceRequest> request =
        service.all().stream().filter(r -> r.getId() == id).findFirst();
    if (request.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    if (!"OPEN".equals(request.get().getStatus())) {
      return ResponseEntity.status(409).body(Map.of("error", "This request is already fulfilled."));
    }
    if (request.get().getRequestedById() == uid) {
      return ResponseEntity.status(403)
          .body(Map.of("error", "You cannot respond to your own request."));
    }
    if (input == null
        || !validUrl(input.getUrl())
        || input.getNote() == null
        || input.getNote().trim().length() < 10
        || input.getNote().length() > 600) {
      return ResponseEntity.badRequest()
          .body(
              Map.of(
                  "error",
                  "Provide an HTTPS link or an EduShare resource-page link and an explanation"
                      + " (10–600 characters)."));
    }
    List<Offer> old = read();
    if (old.stream().anyMatch(o -> o.getRequestId() == id && o.getOfferedById() == uid)) {
      return ResponseEntity.status(409)
          .body(Map.of("error", "You have already suggested a resource for this request."));
    }
    Offer o =
        new Offer(
            store.nextId(store.read("request-offers.txt")),
            id,
            uid,
            input.getUrl().trim(),
            input.getNote().trim(),
            "OFFERED",
            Instant.now().toString());
    old.add(o);
    write(old);
    return ResponseEntity.ok(o);
  }

  @PutMapping("/{id}/offers/{offerId}/accept")
  public synchronized ResponseEntity<?> accept(
      @PathVariable long id, @PathVariable long offerId, HttpSession session) {
    long uid = current(session);
    java.util.Optional<com.edushare.modules.user.User> account = users.byId(uid);
    if (uid <= 0 || account.isEmpty()) {
      return ResponseEntity.status(401).build();
    }
    java.util.Optional<com.edushare.modules.request.ResourceRequest> request =
        service.all().stream().filter(r -> r.getId() == id).findFirst();
    if (request.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    if (request.get().getRequestedById() != uid && !"ADMIN".equals(account.get().getRole())) {
      return ResponseEntity.status(403).build();
    }
    if (!"OPEN".equals(request.get().getStatus())) {
      return ResponseEntity.status(409).body(Map.of("error", "Request is no longer open."));
    }
    List<Offer> offers = read();
    if (offers.stream().noneMatch(o -> o.getRequestId() == id && o.getId() == offerId)) {
      return ResponseEntity.notFound().build();
    }
    List<Offer> updated = new ArrayList<>();
    for (Offer o : offers) {
      updated.add(
          o.getRequestId() == id && o.getId() == offerId
              ? new Offer(
                  o.getId(),
                  o.getRequestId(),
                  o.getOfferedById(),
                  o.getUrl(),
                  o.getNote(),
                  "ACCEPTED",
                  o.getCreatedAt())
              : o);
    }
    write(updated);
    service.updateStatus(id, "FULFILLED");
    Offer accepted =
        updated.stream().filter(offer -> offer.getId() == offerId).findFirst().orElseThrow();
    List<String> acceptanceHistory = store.read("request-offer-acceptances.txt");
    acceptanceHistory.add(
        offerId + "|" + id + "|" + accepted.getOfferedById() + "|" + uid + "|" + Instant.now());
    store.write("request-offer-acceptances.txt", acceptanceHistory);
    return ResponseEntity.ok(Map.of("status", "FULFILLED", "acceptedOfferId", offerId));
  }
}

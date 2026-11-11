package com.edushare.modules.admin;

import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/** Persistent administrator settings shared by the React storefront and checkout service. */
@RestController
@RequestMapping("/api/config")
public class AdminConfigurationController {

    private final TextFileStore store;

    private final UserService users;

    private final NotificationMailService delivery;

    public AdminConfigurationController(
            TextFileStore store, UserService users, NotificationMailService delivery) {
        this.store = store;
        this.users = users;
        this.delivery = delivery;
    }

    private boolean isAdmin(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return false;
        }
        try {
            return users.byId(Long.parseLong(id.toString()))
                    .filter(u -> "ADMIN".equals(u.getRole()) && !u.isSuspended())
                    .isPresent();
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public static final Map<String, Integer> DEFAULT_PRICES =
            Map.of(
                    "premiumMonthly",
                    199,
                    "premiumSemester",
                    799,
                    "premiumYearly",
                    1499,
                    "batchMonthly",
                    1499,
                    "batchSemester",
                    5999,
                    "batchYearly",
                    11999,
                    "platformRoyaltyShare",
                    90,
                    "freeMonthly",
                    0,
                    "studentDiscountPercent",
                    20);

    public Map<String, Integer> prices() {
        Map<String, Integer> prices = new LinkedHashMap<>(DEFAULT_PRICES);
        for (String line : store.read("plan_prices.txt")) {
            String[] parts = line.split("\\|", -1);
            if (parts.length != 2 || !DEFAULT_PRICES.containsKey(parts[0])) {
                continue;
            }
            try {
                prices.put(parts[0], Integer.parseInt(parts[1]));
            } catch (NumberFormatException ignored) {
            }
        }
        return prices;
    }

    @GetMapping("/prices")
    public ResponseEntity<Map<String, Integer>> getPrices() {
        return ResponseEntity.ok(prices());
    }

    @PutMapping("/prices")
    public ResponseEntity<?> setPrices(
            @RequestBody Map<String, Integer> incoming, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (incoming == null
                || !incoming.keySet()
                        .containsAll(
                                DEFAULT_PRICES.keySet().stream()
                                        .filter(k -> !k.equals("studentDiscountPercent"))
                                        .toList())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "All price fields are required."));
        }
        Map<String, Integer> updated = new LinkedHashMap<>(incoming);
        updated.putIfAbsent("studentDiscountPercent", prices().get("studentDiscountPercent"));
        for (String key : DEFAULT_PRICES.keySet()) {
            Integer v = updated.get(key);
            if (v == null
                    || v < 0
                    || v > 1_000_000
                    || ((key.equals("platformRoyaltyShare") || key.equals("studentDiscountPercent"))
                            && v > 100)
                    || (key.equals("freeMonthly") && v != 0)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid value for " + key));
            }
        }
        synchronized (store) {
            List<String> rows = new ArrayList<>();
            for (String key : new TreeSet<>(DEFAULT_PRICES.keySet())) {
                rows.add(key + "|" + updated.get(key));
            }
            store.write("plan_prices.txt", rows);
        }
        return ResponseEntity.ok(prices());
    }

    public static final class Announcement {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final String id;

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        private final String title;

        @com.fasterxml.jackson.annotation.JsonProperty("message")
        private final String message;

        @com.fasterxml.jackson.annotation.JsonProperty("audience")
        private final String audience;

        @com.fasterxml.jackson.annotation.JsonProperty("type")
        private final String type;

        @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
        private final String createdAt;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Announcement(
                @com.fasterxml.jackson.annotation.JsonProperty("id") String id,
                @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
                @com.fasterxml.jackson.annotation.JsonProperty("message") String message,
                @com.fasterxml.jackson.annotation.JsonProperty("audience") String audience,
                @com.fasterxml.jackson.annotation.JsonProperty("type") String type,
                @com.fasterxml.jackson.annotation.JsonProperty("createdAt") String createdAt) {
            this.id = id;
            this.title = title;
            this.message = message;
            this.audience = audience;
            this.type = type;
            this.createdAt = createdAt;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public String getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        public String getTitle() {
            return title;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("message")
        public String getMessage() {
            return message;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("audience")
        public String getAudience() {
            return audience;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("type")
        public String getType() {
            return type;
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
            Announcement value = (Announcement) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(title, value.title)
                    && java.util.Objects.equals(message, value.message)
                    && java.util.Objects.equals(audience, value.audience)
                    && java.util.Objects.equals(type, value.type)
                    && java.util.Objects.equals(createdAt, value.createdAt);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(title);
            result = 31 * result + java.util.Objects.hashCode(message);
            result = 31 * result + java.util.Objects.hashCode(audience);
            result = 31 * result + java.util.Objects.hashCode(type);
            result = 31 * result + java.util.Objects.hashCode(createdAt);
            return result;
        }

        @Override
        public String toString() {
            return "Announcement["
                    + "id="
                    + id
                    + ", title="
                    + title
                    + ", message="
                    + message
                    + ", audience="
                    + audience
                    + ", type="
                    + type
                    + ", createdAt="
                    + createdAt
                    + "]";
        }
    }

    public static final class CreateAnnouncement {

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        private final String title;

        @com.fasterxml.jackson.annotation.JsonProperty("message")
        private final String message;

        @com.fasterxml.jackson.annotation.JsonProperty("audience")
        private final String audience;

        @com.fasterxml.jackson.annotation.JsonProperty("type")
        private final String type;

        @com.fasterxml.jackson.annotation.JsonProperty("sendEmail")
        private final boolean sendEmail;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public CreateAnnouncement(
                @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
                @com.fasterxml.jackson.annotation.JsonProperty("message") String message,
                @com.fasterxml.jackson.annotation.JsonProperty("audience") String audience,
                @com.fasterxml.jackson.annotation.JsonProperty("type") String type,
                @com.fasterxml.jackson.annotation.JsonProperty("sendEmail") boolean sendEmail) {
            this.title = title;
            this.message = message;
            this.audience = audience;
            this.type = type;
            this.sendEmail = sendEmail;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        public String getTitle() {
            return title;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("message")
        public String getMessage() {
            return message;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("audience")
        public String getAudience() {
            return audience;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("type")
        public String getType() {
            return type;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("sendEmail")
        public boolean getSendEmail() {
            return sendEmail;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            CreateAnnouncement value = (CreateAnnouncement) other;
            return java.util.Objects.equals(title, value.title)
                    && java.util.Objects.equals(message, value.message)
                    && java.util.Objects.equals(audience, value.audience)
                    && java.util.Objects.equals(type, value.type)
                    && java.util.Objects.equals(sendEmail, value.sendEmail);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(title);
            result = 31 * result + java.util.Objects.hashCode(message);
            result = 31 * result + java.util.Objects.hashCode(audience);
            result = 31 * result + java.util.Objects.hashCode(type);
            result = 31 * result + java.util.Objects.hashCode(sendEmail);
            return result;
        }

        @Override
        public String toString() {
            return "CreateAnnouncement["
                    + "title="
                    + title
                    + ", message="
                    + message
                    + ", audience="
                    + audience
                    + ", type="
                    + type
                    + ", sendEmail="
                    + sendEmail
                    + "]";
        }
    }

    @GetMapping("/announcements")
    public ResponseEntity<?> getAnnouncements(HttpSession session) {
        if (session.getAttribute("userId") == null) {
            return ResponseEntity.status(401).build();
        }
        boolean premium = false;
        boolean contributor = false;
        Object id = session.getAttribute("userId");
        if (id != null) {
            java.util.Optional<com.edushare.modules.user.User> user =
                    users.byId(Long.parseLong(id.toString()));
            premium = user.map(u -> u.isPremium()).orElse(false);
            // Contributor-specific filtering is not enabled for the demo.
        }
        List<Announcement> results = new ArrayList<>();
        for (String row : store.read("announcements.txt")) {
            String[] v = row.split("\\|", -1);
            if (v.length < 6) {
                continue;
            }
            if ("premium".equals(v[3]) && !premium && !isAdmin(session)) {
                continue;
            }
            if ("tutors".equals(v[3]) && !contributor && !isAdmin(session)) {
                continue;
            }
            results.add(new Announcement(v[0], v[1], v[2], v[3], v[4], v[5]));
        }
        Collections.reverse(results);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/announcements")
    public ResponseEntity<?> addAnnouncement(
            @RequestBody CreateAnnouncement a, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (a == null
                || a.getTitle() == null
                || a.getTitle().isBlank()
                || a.getMessage() == null
                || a.getMessage().isBlank()
                || a.getTitle().length() > 160
                || a.getMessage().length() > 1200
                || !Set.of("all", "premium", "tutors").contains(a.getAudience())
                || !Set.of("info", "warning", "success").contains(a.getType())) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Enter a valid announcement title, message and audience."));
        }
        Announcement created =
                new Announcement(
                        UUID.randomUUID().toString(),
                        TextFileStore.clean(a.getTitle()),
                        TextFileStore.clean(a.getMessage()),
                        a.getAudience(),
                        a.getType(),
                        LocalDateTime.now().toString());
        synchronized (store) {
            List<String> rows = store.read("announcements.txt");
            rows.add(
                    String.join(
                            "|",
                            created.getId(),
                            created.getTitle(),
                            created.getMessage(),
                            created.getAudience(),
                            created.getType(),
                            created.getCreatedAt()));
            store.write("announcements.txt", rows);
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", created.getId());
        result.put("title", created.getTitle());
        result.put("message", created.getMessage());
        result.put("type", created.getType());
        result.put("audience", created.getAudience());
        result.put("createdAt", created.getCreatedAt());
        result.put(
                "emailSummary",
                a.getSendEmail()
                        ? delivery.broadcast(
                                created.getId(),
                                created.getTitle(),
                                created.getMessage(),
                                created.getAudience())
                        : Map.of("sent", 0, "failed", 0, "skipped", 0));
        return ResponseEntity.ok(result);
    }

    /** Retries only recipients without a successful delivery, to prevent repeated bulk mail. */
    @PostMapping("/announcements/{id}/retry-email")
    public ResponseEntity<?> retryAnnouncement(@PathVariable String id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        for (String row : store.read("announcements.txt")) {
            String[] p = row.split("\\|", -1);
            if (p.length >= 6 && p[0].equals(id)) {
                return ResponseEntity.ok(delivery.broadcast(p[0], p[1], p[2], p[3]));
            }
        }
        return ResponseEntity.notFound().build();
    }

    private static final List<String> DEFAULT_DOMAINS =
            List.of(
                    "mailinator.com",
                    "tempmail.com",
                    "10minutemail.com",
                    "guerrillamail.com",
                    "disposablemail.org",
                    "throwawaymail.com",
                    "trashmail.net");

    public List<String> blockedDomains() {
        return store.exists("blocked_domains.txt")
                ? store.read("blocked_domains.txt")
                : DEFAULT_DOMAINS;
    }

    @GetMapping("/blocked-domains")
    public ResponseEntity<?> getBlocked(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(blockedDomains());
    }

    @PutMapping("/blocked-domains")
    public ResponseEntity<?> setBlocked(@RequestBody List<String> domains, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (domains == null
                || domains.size() > 200
                || domains.stream()
                        .anyMatch(
                                d ->
                                        d == null
                                                || !d.matches(
                                                        "[a-z0-9][a-z0-9.-]{1,250}\\.[a-z]{2,}"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Enter valid domain names."));
        }
        List<String> clean = domains.stream().map(String::toLowerCase).distinct().sorted().toList();
        store.write("blocked_domains.txt", clean);
        return ResponseEntity.ok(clean);
    }
}

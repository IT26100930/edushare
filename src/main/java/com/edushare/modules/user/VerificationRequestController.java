package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/** Manual account verification requests; no fake email OTP or auto-verified identity. */
@RestController
@RequestMapping("/api/verification")
public class VerificationRequestController {

    private static final String FILE = "account-verification-requests.txt";

    private final TextFileStore store;

    private final UserService users;

    public VerificationRequestController(TextFileStore store, UserService users) {
        this.store = store;
        this.users = users;
    }

    public static final class Request {

        @com.fasterxml.jackson.annotation.JsonProperty("note")
        private final String note;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Request(@com.fasterxml.jackson.annotation.JsonProperty("note") String note) {
            this.note = note;
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
            Request value = (Request) other;
            return java.util.Objects.equals(note, value.note);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(note);
            return result;
        }

        @Override
        public String toString() {
            return "Request[" + "note=" + note + "]";
        }
    }

    public static final class Review {

        @com.fasterxml.jackson.annotation.JsonProperty("userId")
        private final long userId;

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("university")
        private final String university;

        @com.fasterxml.jackson.annotation.JsonProperty("degree")
        private final String degree;

        @com.fasterxml.jackson.annotation.JsonProperty("note")
        private final String note;

        @com.fasterxml.jackson.annotation.JsonProperty("submittedAt")
        private final String submittedAt;

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        private final String status;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Review(
                @com.fasterxml.jackson.annotation.JsonProperty("userId") long userId,
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("university") String university,
                @com.fasterxml.jackson.annotation.JsonProperty("degree") String degree,
                @com.fasterxml.jackson.annotation.JsonProperty("note") String note,
                @com.fasterxml.jackson.annotation.JsonProperty("submittedAt") String submittedAt,
                @com.fasterxml.jackson.annotation.JsonProperty("status") String status) {
            this.userId = userId;
            this.name = name;
            this.email = email;
            this.university = university;
            this.degree = degree;
            this.note = note;
            this.submittedAt = submittedAt;
            this.status = status;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("userId")
        public long getUserId() {
            return userId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        public String getName() {
            return name;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        public String getEmail() {
            return email;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("university")
        public String getUniversity() {
            return university;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("degree")
        public String getDegree() {
            return degree;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("note")
        public String getNote() {
            return note;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("submittedAt")
        public String getSubmittedAt() {
            return submittedAt;
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
            Review value = (Review) other;
            return java.util.Objects.equals(userId, value.userId)
                    && java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(university, value.university)
                    && java.util.Objects.equals(degree, value.degree)
                    && java.util.Objects.equals(note, value.note)
                    && java.util.Objects.equals(submittedAt, value.submittedAt)
                    && java.util.Objects.equals(status, value.status);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(userId);
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(university);
            result = 31 * result + java.util.Objects.hashCode(degree);
            result = 31 * result + java.util.Objects.hashCode(note);
            result = 31 * result + java.util.Objects.hashCode(submittedAt);
            result = 31 * result + java.util.Objects.hashCode(status);
            return result;
        }

        @Override
        public String toString() {
            return "Review["
                    + "userId="
                    + userId
                    + ", name="
                    + name
                    + ", email="
                    + email
                    + ", university="
                    + university
                    + ", degree="
                    + degree
                    + ", note="
                    + note
                    + ", submittedAt="
                    + submittedAt
                    + ", status="
                    + status
                    + "]";
        }
    }

    private Long userId(HttpSession session) {
        Object value = session.getAttribute("userId");
        if (value == null) {
            return null;
        }
        return users.byId(Long.parseLong(value.toString()))
                .filter(u -> !u.isSuspended())
                .map(User::getId)
                .orElse(null);
    }

    private boolean isAdmin(HttpSession session) {
        Long id = userId(session);
        return id != null && users.byId(id).map(u -> "ADMIN".equals(u.getRole())).orElse(false);
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> status(HttpSession session) {
        Long id = userId(session);
        if (id == null) {
            return ResponseEntity.status(401).build();
        }
        boolean verified = users.byId(id).map(User::isVerified).orElse(false);
        String state =
                store.read(FILE).stream()
                        .map(line -> line.split("\\|", -1))
                        .filter(p -> p.length >= 4 && p[0].equals(Long.toString(id)))
                        .map(p -> p[3])
                        .reduce((a, b) -> b)
                        .orElse("not_requested");
        return ResponseEntity.ok(
                Map.of("verified", verified, "status", verified ? "approved" : state));
    }

    @PostMapping("/requests")
    public ResponseEntity<?> request(@RequestBody Request request, HttpSession session) {
        Long id = userId(session);
        if (id == null) {
            return ResponseEntity.status(401).build();
        }
        if (users.byId(id).map(User::isVerified).orElse(false)) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "This account is already verified."));
        }
        String note = request == null ? "" : Objects.toString(request.getNote(), "").trim();
        if (note.length() > 1000) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message is too long."));
        }
        synchronized (store) {
            List<String> lines = store.read(FILE);
            if (lines.stream()
                    .anyMatch(line -> line.startsWith(id + "|") && line.endsWith("|pending"))) {
                return ResponseEntity.status(409)
                        .body(Map.of("error", "Your request is already pending."));
            }
            lines.add(
                    id + "|" + TextFileStore.clean(note) + "|" + LocalDateTime.now() + "|pending");
            store.write(FILE, lines);
            return ResponseEntity.ok(Map.of("status", "pending"));
        }
    }

    @GetMapping("/admin")
    public ResponseEntity<List<Review>> pending(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        // Return the latest pending request per user, even if old demo data contains duplicates.
        Map<Long, Review> latestPending = new LinkedHashMap<>();
        for (String line : store.read(FILE)) {
            String[] p = line.split("\\|", -1);
            if (p.length < 4 || !p[3].equals("pending")) {
                continue;
            }
            users.byId(parseId(p[0]))
                    .ifPresent(
                            user -> {
                                if (!user.isVerified()) {
                                    latestPending.put(
                                            user.getId(),
                                            new Review(
                                                    user.getId(),
                                                    user.getName(),
                                                    user.getEmail(),
                                                    user.getUniversity(),
                                                    user.getDegree(),
                                                    p[1],
                                                    p[2],
                                                    p[3]));
                                }
                            });
        }
        return ResponseEntity.ok(new ArrayList<>(latestPending.values()));
    }

    @PostMapping("/admin/{id}/{action}")
    public ResponseEntity<?> review(
            @PathVariable long id, @PathVariable String action, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (!Set.of("approve", "reject").contains(action)) {
            return ResponseEntity.badRequest().build();
        }
        if (users.byId(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        synchronized (store) {
            List<String> lines = store.read(FILE);
            boolean found = false;
            for (int i = 0; i < lines.size(); i++) {
                String[] p = lines.get(i).split("\\|", -1);
                if (p.length >= 4 && p[0].equals(Long.toString(id)) && p[3].equals("pending")) {
                    lines.set(
                            i,
                            p[0]
                                    + "|"
                                    + p[1]
                                    + "|"
                                    + p[2]
                                    + "|"
                                    + (action.equals("approve") ? "approved" : "rejected"));
                    found = true;
                }
            }
            if (!found) {
                return ResponseEntity.status(409)
                        .body(Map.of("error", "No pending request found."));
            }
            if (action.equals("approve")) {
                users.administer(id, "verify");
            }
            store.write(FILE, lines);
        }
        return ResponseEntity.ok(
                Map.of("status", action.equals("approve") ? "approved" : "rejected"));
    }

    private static long parseId(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return -1;
        }
    }
}

package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Admin-assisted demo recovery. Email is not sent and the public endpoint does not disclose account
 * existence.
 */
@RestController
@RequestMapping("/api/password-recovery")
public class PasswordRecoveryController {

    public static final String FILE = "password-recovery-requests.txt";

    private final TextFileStore store;

    private final UserService users;

    private final Map<String, Long> requestThrottle = new ConcurrentHashMap<>();

    private final Map<String, Long> redemptionThrottle = new ConcurrentHashMap<>();

    private static final long CODE_LIFETIME_MS = 30 * 60 * 1000L;

    private static final SecureRandom RANDOM = new SecureRandom();

    public PasswordRecoveryController(TextFileStore store, UserService users) {
        this.store = store;
        this.users = users;
    }

    public static final class RecoveryInput {

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public RecoveryInput(@com.fasterxml.jackson.annotation.JsonProperty("email") String email) {
            this.email = email;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        public String getEmail() {
            return email;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            RecoveryInput value = (RecoveryInput) other;
            return java.util.Objects.equals(email, value.email);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(email);
            return result;
        }

        @Override
        public String toString() {
            return "RecoveryInput[" + "email=" + email + "]";
        }
    }

    public static final class ApproveInput {

        @com.fasterxml.jackson.annotation.JsonProperty("adminPassword")
        private final String adminPassword;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public ApproveInput(
                @com.fasterxml.jackson.annotation.JsonProperty("adminPassword")
                        String adminPassword) {
            this.adminPassword = adminPassword;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("adminPassword")
        public String getAdminPassword() {
            return adminPassword;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            ApproveInput value = (ApproveInput) other;
            return java.util.Objects.equals(adminPassword, value.adminPassword);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(adminPassword);
            return result;
        }

        @Override
        public String toString() {
            return "ApproveInput[" + "adminPassword=" + adminPassword + "]";
        }
    }

    public static final class CompleteInput {

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("code")
        private final String code;

        @com.fasterxml.jackson.annotation.JsonProperty("newPassword")
        private final String newPassword;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public CompleteInput(
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("code") String code,
                @com.fasterxml.jackson.annotation.JsonProperty("newPassword") String newPassword) {
            this.email = email;
            this.code = code;
            this.newPassword = newPassword;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        public String getEmail() {
            return email;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("code")
        public String getCode() {
            return code;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("newPassword")
        public String getNewPassword() {
            return newPassword;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            CompleteInput value = (CompleteInput) other;
            return java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(code, value.code)
                    && java.util.Objects.equals(newPassword, value.newPassword);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(code);
            result = 31 * result + java.util.Objects.hashCode(newPassword);
            return result;
        }

        @Override
        public String toString() {
            return "CompleteInput["
                    + "email="
                    + email
                    + ", code="
                    + code
                    + ", newPassword="
                    + newPassword
                    + "]";
        }
    }

    private static String codeHash(String code) {
        try {
            byte[] digest =
                    MessageDigest.getInstance("SHA-256")
                            .digest(code.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (java.security.NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static boolean sameHash(String expected, String suppliedCode) {
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                codeHash(suppliedCode).getBytes(StandardCharsets.UTF_8));
    }

    private static String genericResetError() {
        return "The reset code is invalid, expired, or already used. Request a new recovery code.";
    }

    public static final class RecoveryItem {

        @com.fasterxml.jackson.annotation.JsonProperty("userId")
        private final long userId;

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("username")
        private final String username;

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("submittedAt")
        private final String submittedAt;

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        private final String status;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public RecoveryItem(
                @com.fasterxml.jackson.annotation.JsonProperty("userId") long userId,
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("username") String username,
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("submittedAt") String submittedAt,
                @com.fasterxml.jackson.annotation.JsonProperty("status") String status) {
            this.userId = userId;
            this.name = name;
            this.username = username;
            this.email = email;
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

        @com.fasterxml.jackson.annotation.JsonProperty("username")
        public String getUsername() {
            return username;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        public String getEmail() {
            return email;
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
            RecoveryItem value = (RecoveryItem) other;
            return java.util.Objects.equals(userId, value.userId)
                    && java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(username, value.username)
                    && java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(submittedAt, value.submittedAt)
                    && java.util.Objects.equals(status, value.status);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(userId);
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(username);
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(submittedAt);
            result = 31 * result + java.util.Objects.hashCode(status);
            return result;
        }

        @Override
        public String toString() {
            return "RecoveryItem["
                    + "userId="
                    + userId
                    + ", name="
                    + name
                    + ", username="
                    + username
                    + ", email="
                    + email
                    + ", submittedAt="
                    + submittedAt
                    + ", status="
                    + status
                    + "]";
        }
    }

    private boolean admin(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return false;
        }
        try {
            return users.byId(Long.parseLong(id.toString()))
                    .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()) && !u.isSuspended())
                    .isPresent();
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    @PostMapping("/request")
    public ResponseEntity<?> request(@RequestBody RecoveryInput input, HttpServletRequest http) {
        if (input == null
                || input.getEmail() == null
                || input.getEmail().length() > 254
                || !input.getEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Enter a valid registered email address."));
        }
        String email = input.getEmail().trim().toLowerCase(Locale.ROOT);
        // Coarse throttling per address and remote client; not a replacement for edge-layer
        // protection.
        String client = Objects.toString(http.getRemoteAddr(), "unknown");
        String throttleKey = client + ":" + email;
        long now = System.currentTimeMillis();
        Long last = requestThrottle.get(throttleKey);
        if (last != null && now - last < 60_000) {
            return ResponseEntity.ok(Map.of("message", genericMessage()));
        }
        requestThrottle.put(throttleKey, now);
        synchronized (store) {
            users.all().stream()
                    .filter(
                            u ->
                                    "STUDENT".equalsIgnoreCase(u.getRole())
                                            && !u.isSuspended()
                                            && email.equalsIgnoreCase(u.getEmail()))
                    .findFirst()
                    .ifPresent(
                            user -> {
                                List<String> lines = store.read(FILE);
                                String prefix = user.getId() + "|";
                                boolean outstanding =
                                        lines.stream()
                                                .anyMatch(
                                                        line -> {
                                                            if (!line.startsWith(prefix)) {
                                                                return false;
                                                            }
                                                            String[] row = line.split("\\|", -1);
                                                            if (row.length < 3) {
                                                                return false;
                                                            }
                                                            if ("pending".equals(row[2])) {
                                                                return true;
                                                            }
                                                            if (!"approved".equals(row[2])
                                                                    || row.length < 5) {
                                                                return false;
                                                            }
                                                            try {
                                                                return Long.parseLong(row[4])
                                                                        > System
                                                                                .currentTimeMillis();
                                                            } catch (NumberFormatException e) {
                                                                return false;
                                                            }
                                                        });
                                if (!outstanding) {
                                    lines.add(
                                            user.getId() + "|" + LocalDateTime.now() + "|pending");
                                    store.write(FILE, lines);
                                }
                            });
        }
        return ResponseEntity.ok(Map.of("message", genericMessage()));
    }

    private static String genericMessage() {
        return "If a student account matches this email, the recovery request has been sent to the"
                   + " EduShare administrator. No email is sent. Please contact your administrator"
                   + " to verify your identity.";
    }

    @GetMapping("/admin")
    public ResponseEntity<?> pending(HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Administrator access required."));
        }
        Map<Long, RecoveryItem> result = new LinkedHashMap<>();
        for (String line : store.read(FILE)) {
            String[] p = line.split("\\|", -1);
            if (p.length < 3 || !"pending".equals(p[2])) {
                continue;
            }
            try {
                long userId = Long.parseLong(p[0]);
                users.byId(userId)
                        .filter(u -> "STUDENT".equalsIgnoreCase(u.getRole()))
                        .ifPresent(
                                u ->
                                        result.put(
                                                userId,
                                                new RecoveryItem(
                                                        userId,
                                                        u.getName(),
                                                        u.getUsername(),
                                                        u.getEmail(),
                                                        p[1],
                                                        p[2])));
            } catch (NumberFormatException ignored) {
            }
        }
        return ResponseEntity.ok(new ArrayList<>(result.values()));
    }

    /**
     * Requires an existing pending request, active admin session AND current admin password. The
     * one-time code is returned only once and NEVER stored in plaintext. Admin must identify the
     * requester through a separate trusted channel before sharing it.
     */
    @PostMapping("/admin/{id}/approve")
    public ResponseEntity<?> approve(
            @PathVariable long id, @RequestBody ApproveInput input, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Administrator access required."));
        }
        if (input == null
                || input.getAdminPassword() == null
                || input.getAdminPassword().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Enter your current administrator password."));
        }
        long actorId = Long.parseLong(session.getAttribute("userId").toString());
        User actor = users.byId(actorId).orElse(null);
        if (actor == null || users.login(actor.getEmail(), input.getAdminPassword()).isEmpty()) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Administrator password is incorrect."));
        }
        synchronized (store) {
            User target = users.byId(id).orElse(null);
            if (target == null
                    || !"STUDENT".equalsIgnoreCase(target.getRole())
                    || target.isSuspended()) {
                return ResponseEntity.status(404)
                        .body(Map.of("error", "Active student account not found."));
            }
            List<String> lines = store.read(FILE);
            int idx = -1;
            for (int i = 0; i < lines.size(); i++) {
                String[] row = lines.get(i).split("\\|", -1);
                if (row.length >= 3
                        && row[0].equals(Long.toString(id))
                        && "pending".equals(row[2])) {
                    idx = i;
                }
            }
            if (idx < 0) {
                return ResponseEntity.status(409)
                        .body(Map.of("error", "No pending recovery request."));
            }
            byte[] bytes = new byte[32];
            RANDOM.nextBytes(bytes);
            String code = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            long expiry = System.currentTimeMillis() + CODE_LIFETIME_MS;
            String[] old = lines.get(idx).split("\\|", -1);
            // userId|requestTime|status|sha256(code)|expiresAtUnixMs
            lines.set(idx, old[0] + "|" + old[1] + "|approved|" + codeHash(code) + "|" + expiry);
            store.write(FILE, lines);
            return ResponseEntity.ok(
                    Map.of(
                            "code",
                            code,
                            "expiresAt",
                            Instant.ofEpochMilli(expiry).toString(),
                            "message",
                            "Share this one-time code privately with the identity-verified student."
                                + " It is displayed only once."));
        }
    }

    /** No login or email provider required. Email, one-use code and password must all match. */
    @PostMapping("/complete")
    public ResponseEntity<?> complete(
            @RequestBody CompleteInput input, HttpServletRequest request) {
        if (input == null
                || input.getEmail() == null
                || input.getCode() == null
                || input.getNewPassword() == null
                || input.getEmail().length() > 254
                || input.getCode().length() > 200) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Enter your email, reset code and new password."));
        }
        String address = input.getEmail().trim().toLowerCase(Locale.ROOT);
        String throttleKey = Objects.toString(request.getRemoteAddr(), "unknown") + ":" + address;
        long now = System.currentTimeMillis();
        Long last = redemptionThrottle.get(throttleKey);
        if (last != null && now - last < 1500) {
            return ResponseEntity.status(429)
                    .body(Map.of("error", "Please wait before trying again."));
        }
        redemptionThrottle.put(throttleKey, now);
        synchronized (store) {
            User target =
                    users.all().stream()
                            .filter(
                                    u ->
                                            "STUDENT".equalsIgnoreCase(u.getRole())
                                                    && !u.isSuspended()
                                                    && address.equalsIgnoreCase(u.getEmail()))
                            .findFirst()
                            .orElse(null);
            if (target == null) {
                return ResponseEntity.badRequest().body(Map.of("error", genericResetError()));
            }
            List<String> lines = store.read(FILE);
            int matching = -1;
            for (int i = 0; i < lines.size(); i++) {
                String[] row = lines.get(i).split("\\|", -1);
                if (row.length >= 5
                        && row[0].equals(Long.toString(target.getId()))
                        && "approved".equals(row[2])) {
                    long expiry;
                    try {
                        expiry = Long.parseLong(row[4]);
                    } catch (NumberFormatException ex) {
                        continue;
                    }
                    if (expiry > now && sameHash(row[3], input.getCode().trim())) {
                        matching = i;
                    }
                }
            }
            if (matching < 0) {
                return ResponseEntity.badRequest().body(Map.of("error", genericResetError()));
            }
            try {
                users.resetStudentPasswordByAdmin(target.getId(), input.getNewPassword());
            } catch (IllegalArgumentException ex) {
                return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
            }
            String[] old = lines.get(matching).split("\\|", -1);
            lines.set(matching, old[0] + "|" + old[1] + "|completed");
            // Revoke any other outstanding tokens for the same account.
            for (int i = 0; i < lines.size(); i++) {
                if (i == matching) {
                    continue;
                }
                String[] row = lines.get(i).split("\\|", -1);
                if (row.length >= 3
                        && row[0].equals(Long.toString(target.getId()))
                        && ("approved".equals(row[2]) || "pending".equals(row[2]))) {
                    lines.set(i, row[0] + "|" + row[1] + "|completed");
                }
            }
            store.write(FILE, lines);
            return ResponseEntity.ok(
                    Map.of("message", "Password updated. You can sign in with your new password."));
        }
    }

    @PostMapping("/admin/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable long id, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        finish(store, id, "rejected");
        return ResponseEntity.ok(Map.of("status", "rejected"));
    }

    /** The existing admin-password-confirmed reset endpoint marks a recovery request completed. */
    public static void finish(TextFileStore store, long userId, String outcome) {
        synchronized (store) {
            List<String> lines = store.read(FILE);
            boolean changed = false;
            for (int i = 0; i < lines.size(); i++) {
                String[] p = lines.get(i).split("\\|", -1);
                if (p.length >= 3
                        && p[0].equals(Long.toString(userId))
                        && ("pending".equals(p[2]) || "approved".equals(p[2]))) {
                    lines.set(i, p[0] + "|" + p[1] + "|" + outcome);
                    changed = true;
                }
            }
            if (changed) {
                store.write(FILE, lines);
            }
        }
    }
}

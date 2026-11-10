package com.edushare.modules.user;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/email-auth")
public class EmailIdentityController {

    private final EmailIdentityService emails;

    private final UserService users;

    private final Map<String, Long> lastRequest = new ConcurrentHashMap<>();

    public EmailIdentityController(EmailIdentityService emails, UserService users) {
        this.emails = emails;
        this.users = users;
    }

    private static boolean localOnly(HttpServletRequest req) {
        String address = req.getRemoteAddr();
        String host = req.getHeader("Host");
        return ("127.0.0.1".equals(address)
                        || "::1".equals(address)
                        || "0:0:0:0:0:0:0:1".equals(address))
                && host != null
                && host.matches("(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?");
    }

    /**
     * Run locally at /api/email-auth/smtp-diagnostics; only safe booleans and categories are
     * returned.
     */
    @GetMapping("/smtp-diagnostics")
    public ResponseEntity<?> smtpDiagnostics(HttpServletRequest req) {
        if (!localOnly(req)) {
            return ResponseEntity.status(403).body(Map.of("error", "Local diagnostic only"));
        }
        return ResponseEntity.ok(emails.diagnoseSmtpConnection());
    }

    public static final class EmailInput {

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public EmailInput(@com.fasterxml.jackson.annotation.JsonProperty("email") String email) {
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
            EmailInput value = (EmailInput) other;
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
            return "EmailInput[" + "email=" + email + "]";
        }
    }

    public static final class TokenInput {

        @com.fasterxml.jackson.annotation.JsonProperty("token")
        private final String token;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public TokenInput(@com.fasterxml.jackson.annotation.JsonProperty("token") String token) {
            this.token = token;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("token")
        public String getToken() {
            return token;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            TokenInput value = (TokenInput) other;
            return java.util.Objects.equals(token, value.token);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(token);
            return result;
        }

        @Override
        public String toString() {
            return "TokenInput[" + "token=" + token + "]";
        }
    }

    public static final class ResetInput {

        @com.fasterxml.jackson.annotation.JsonProperty("token")
        private final String token;

        @com.fasterxml.jackson.annotation.JsonProperty("password")
        private final String password;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public ResetInput(
                @com.fasterxml.jackson.annotation.JsonProperty("token") String token,
                @com.fasterxml.jackson.annotation.JsonProperty("password") String password) {
            this.token = token;
            this.password = password;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("token")
        public String getToken() {
            return token;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("password")
        public String getPassword() {
            return password;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            ResetInput value = (ResetInput) other;
            return java.util.Objects.equals(token, value.token)
                    && java.util.Objects.equals(password, value.password);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(token);
            result = 31 * result + java.util.Objects.hashCode(password);
            return result;
        }

        @Override
        public String toString() {
            return "ResetInput[" + "token=" + token + ", password=" + password + "]";
        }
    }

    @GetMapping("/status")
    public Map<String, Boolean> status() {
        return Map.of("configured", emails.configured());
    }

    @PostMapping("/forgot")
    public ResponseEntity<?> forgot(@RequestBody EmailInput input, HttpServletRequest req) {
        String email =
                input == null || input.getEmail() == null
                        ? ""
                        : input.getEmail().trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || email.length() > 254) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Enter a valid email address."));
        }
        String key = req.getRemoteAddr() + ":" + email;
        long now = System.currentTimeMillis();
        Long previous = lastRequest.putIfAbsent(key, now);
        if (previous != null && now - previous < 60_000) {
            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "If that address is registered and verified, a reset link will be"
                                + " emailed."));
        }
        lastRequest.put(key, now);
        try {
            emails.sendPasswordReset(email);
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(503)
                    .body(
                            Map.of(
                                    "error",
                                    "Email service unavailable. Try again later or contact the"
                                        + " administrator."));
        }
        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "If that address is registered and verified, a reset link will be"
                            + " emailed."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<?> resend(@RequestBody EmailInput input, HttpServletRequest req) {
        String email =
                input == null || input.getEmail() == null
                        ? ""
                        : input.getEmail().trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") || email.length() > 254) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Enter a valid email address."));
        }
        String key = "verify:" + req.getRemoteAddr() + ":" + email;
        long now = System.currentTimeMillis();
        Long previous = lastRequest.putIfAbsent(key, now);
        if (previous != null && now - previous < 60_000) {
            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "If email verification is pending, a new link will be sent."));
        }
        lastRequest.put(key, now);
        try {
            users.all().stream()
                    .filter(u -> email.equalsIgnoreCase(u.getEmail()) && !emails.canLogIn(u))
                    .findFirst()
                    .ifPresent(emails::sendVerification);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(503).body(Map.of("error", "Email delivery unavailable."));
        }
        return ResponseEntity.ok(
                Map.of("message", "If email verification is pending, a new link will be sent."));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody TokenInput input) {
        String signInPath = emails.verifyEmailSignInPath(input == null ? null : input.getToken());
        if (signInPath == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Link is invalid, expired or already used."));
        }
        return ResponseEntity.ok(
                Map.of(
                        "message",
                        "Email verified. You may now sign in.",
                        "signInPath",
                        signInPath));
    }

    @PostMapping("/reset")
    public ResponseEntity<?> reset(@RequestBody ResetInput input) {
        if (input == null || !emails.useResetToken(input.getToken(), input.getPassword(), users)) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Reset link is invalid/expired, or password does not meet"
                                        + " requirements."));
        }
        return ResponseEntity.ok(Map.of("message", "Password changed. Please sign in again."));
    }
}

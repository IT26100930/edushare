package com.edushare.modules.user;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService users;

    private final UserFileRepository userRepository;

    private final EmailIdentityService emails;

    public AuthController(
            UserService users, UserFileRepository userRepository, EmailIdentityService emails) {
        this.emails = emails;
        this.users = users;
        this.userRepository = userRepository;
    }

    public static final class LoginRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("password")
        private final String password;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public LoginRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("password") String password) {
            this.email = email;
            this.password = password;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        public String getEmail() {
            return email;
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
            LoginRequest value = (LoginRequest) other;
            return java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(password, value.password);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(password);
            return result;
        }

        @Override
        public String toString() {
            return "LoginRequest[" + "email=" + email + ", password=" + password + "]";
        }
    }

    private static final String DEMO_EMAIL = "demo.admin@edushare.example";

    private static boolean isLoopback(HttpServletRequest request) {
        String address = request.getRemoteAddr();
        return "127.0.0.1".equals(address)
                || "0:0:0:0:0:0:0:1".equals(address)
                || "::1".equals(address);
    }

    private boolean realAdminExists() {
        return users.all().stream()
                .anyMatch(
                        u ->
                                "ADMIN".equalsIgnoreCase(u.getRole())
                                        && !DEMO_EMAIL.equalsIgnoreCase(u.getEmail()));
    }

    /** Localhost-only, first-run setup information. Never returns passwords. */
    @GetMapping("/admin-setup-status")
    public Map<String, Object> adminSetupStatus(HttpServletRequest request) {
        String host = request.getHeader("Host");
        if (!isLoopback(request)
                || host == null
                || !host.matches("(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?")) {
            return Map.of("setupAvailable", false, "configured", true);
        }
        Optional<User> admin =
                users.all().stream()
                        .filter(
                                u ->
                                        "ADMIN".equalsIgnoreCase(u.getRole())
                                                && !DEMO_EMAIL.equalsIgnoreCase(u.getEmail()))
                        .findFirst();
        if (admin.isPresent()
                && admin.get().publicProfileEnabled()
                && admin.get().emailVisibleToMembers()) {
            return Map.of(
                    "setupAvailable",
                    false,
                    "configured",
                    true,
                    "adminEmail",
                    admin.get().getEmail());
        }
        if (admin.isPresent()) {
            return Map.of("setupAvailable", false, "configured", true);
        }
        return Map.of("setupAvailable", true, "configured", false);
    }

    public static final class FirstAdminRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("password")
        private final String password;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public FirstAdminRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("password") String password) {
            this.name = name;
            this.email = email;
            this.password = password;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        public String getName() {
            return name;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        public String getEmail() {
            return email;
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
            FirstAdminRequest value = (FirstAdminRequest) other;
            return java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(password, value.password);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(password);
            return result;
        }

        @Override
        public String toString() {
            return "FirstAdminRequest["
                    + "name="
                    + name
                    + ", email="
                    + email
                    + ", password="
                    + password
                    + "]";
        }
    }

    /**
     * One-time setup, restricted to this machine. For deployed websites use a controlled
     * provisioning process.
     */
    @PostMapping("/first-admin")
    public synchronized ResponseEntity<?> createFirstAdmin(
            @RequestBody FirstAdminRequest input, HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        String host = request.getHeader("Host");
        if (!isLoopback(request)
                || host == null
                || !host.matches("(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?")
                || (origin != null
                        && !origin.matches(
                                "https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?"))) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Admin setup is available only on this computer."));
        }
        if (realAdminExists()) {
            return ResponseEntity.status(409)
                    .body(
                            Map.of(
                                    "error",
                                    "A real administrator already exists. Sign in with that"
                                        + " account."));
        }
        if (input == null
                || input.getEmail() == null
                || input.getPassword() == null
                || input.getName() == null
                || !input.getEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
                || input.getPassword().length() < 8
                || input.getName().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Enter a name, valid email, and password with at least 8"
                                        + " characters."));
        }
        if (DEMO_EMAIL.equalsIgnoreCase(input.getEmail().trim())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Choose your own administrator email."));
        }
        if (users.all().stream()
                .anyMatch(u -> u.getEmail().equalsIgnoreCase(input.getEmail().trim()))) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Email already belongs to another account."));
        }
        String email = input.getEmail().trim().toLowerCase(Locale.ROOT);
        String username = "admin_" + UUID.randomUUID().toString().substring(0, 8);
        User admin =
                new Admin(
                        0,
                        input.getName().trim(),
                        username,
                        email,
                        PasswordHash.hash(input.getPassword()));
        // Use UserService persistence so the account survives restarts.
        if (!emails.configured()) {
            return ResponseEntity.status(503)
                    .body(
                            Map.of(
                                    "error",
                                    "Email delivery must be enabled before administrator email"
                                        + " verification can continue."));
        }
        User saved = users.createAdministratorDuringSetup(admin);
        try {
            emails.sendVerification(saved);
        } catch (RuntimeException ex) {
            users.delete(saved.getId());
            return ResponseEntity.status(503)
                    .body(
                            Map.of(
                                    "error",
                                    "Could not deliver the administrator verification email."));
        }
        return ResponseEntity.ok(
                Map.of(
                        "created",
                        true,
                        "email",
                        saved.getEmail(),
                        "message",
                        "Verify your email before administrator login.",
                        "next",
                        "/admin/login"));
    }

    /** Explicit owner-authorized recovery: localhost + server secret + current admin email. */
    public static final class AdminRecoveryRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("recoveryToken")
        private final String recoveryToken;

        @com.fasterxml.jackson.annotation.JsonProperty("newPassword")
        private final String newPassword;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public AdminRecoveryRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("recoveryToken")
                        String recoveryToken,
                @com.fasterxml.jackson.annotation.JsonProperty("newPassword") String newPassword) {
            this.email = email;
            this.recoveryToken = recoveryToken;
            this.newPassword = newPassword;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        public String getEmail() {
            return email;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("recoveryToken")
        public String getRecoveryToken() {
            return recoveryToken;
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
            AdminRecoveryRequest value = (AdminRecoveryRequest) other;
            return java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(recoveryToken, value.recoveryToken)
                    && java.util.Objects.equals(newPassword, value.newPassword);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(recoveryToken);
            result = 31 * result + java.util.Objects.hashCode(newPassword);
            return result;
        }

        @Override
        public String toString() {
            return "AdminRecoveryRequest["
                    + "email="
                    + email
                    + ", recoveryToken="
                    + recoveryToken
                    + ", newPassword="
                    + newPassword
                    + "]";
        }
    }

    @PostMapping("/admin-recovery")
    public synchronized ResponseEntity<?> recoverAdmin(
            @RequestBody AdminRecoveryRequest input,
            HttpServletRequest request,
            HttpSession session) {
        String host = request.getHeader("Host");
        String origin = request.getHeader("Origin");
        if (!isLoopback(request)
                || host == null
                || !host.matches("(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?")
                || (origin != null
                        && !origin.matches(
                                "https?://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]+)?"))) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Recovery is only available on the server computer."));
        }
        String secret = System.getenv("EDUSHARE_ADMIN_RECOVERY_TOKEN");
        if (secret == null || secret.length() < 24) {
            return ResponseEntity.status(403)
                    .body(
                            Map.of(
                                    "error",
                                    "Administrator recovery is unavailable. Contact the person"
                                        + " managing EduShare."));
        }
        if (input == null
                || input.getEmail() == null
                || input.getRecoveryToken() == null
                || input.getNewPassword() == null
                || input.getNewPassword().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Enter the admin email, recovery token and a new password of at"
                                        + " least 8 characters."));
        }
        boolean validToken =
                java.security.MessageDigest.isEqual(
                        secret.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                        input.getRecoveryToken().getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if (!validToken) {
            return ResponseEntity.status(403).body(Map.of("error", "Invalid recovery token."));
        }
        // Look up the account directly in the same repository used by login;
        // do not run subscription/account-list updates during password recovery.
        Optional<User> admin =
                userRepository
                        .findByEmail(input.getEmail().trim())
                        .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                        .filter(u -> !DEMO_EMAIL.equalsIgnoreCase(u.getEmail()));
        if (admin.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(
                            Map.of(
                                    "error",
                                    "Administrator account not found. Check your sign-in details or"
                                        + " contact the site administrator."));
        }
        users.resetAdministratorPassword(admin.get().getId(), input.getNewPassword());
        session.invalidate();
        return ResponseEntity.ok(
                Map.of(
                        "updated",
                        true,
                        "message",
                        "Admin password changed. Sign in with your new password."));
    }

    /**
     * Public login is restricted to student accounts. Admins use the separate administrator portal.
     */
    @PostMapping("/login")
    public ResponseEntity<User> login(
            @RequestBody LoginRequest r, HttpSession session, HttpServletRequest request) {
        Optional<User> found =
                users.login(r.getEmail(), r.getPassword()).filter(u -> !u.isSuspended());
        if (found.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        if (!emails.canLogIn(found.get())) {
            return ResponseEntity.status(403).build();
        }
        User user = found.get();
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(403).build();
        }
        request.changeSessionId();
        session.setAttribute("userId", user.getId());
        session.setAttribute("role", user.getRole());
        session.setAttribute("email", user.getEmail());
        return ResponseEntity.ok(user);
    }

    /** Separate admin authentication endpoint; no role is accepted from the browser. */
    @PostMapping("/admin-login")
    public ResponseEntity<User> adminLogin(
            @RequestBody LoginRequest r, HttpSession session, HttpServletRequest request) {
        if (r.getEmail() != null && DEMO_EMAIL.equalsIgnoreCase(r.getEmail().trim())) {
            return ResponseEntity.status(403).build();
        }
        Optional<User> found =
                users.login(r.getEmail(), r.getPassword())
                        .filter(u -> !u.isSuspended() && "ADMIN".equalsIgnoreCase(u.getRole()));
        if (found.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        if (!emails.canLogIn(found.get())) {
            return ResponseEntity.status(403).build();
        }
        User admin = found.get();
        request.changeSessionId();
        session.setAttribute("userId", admin.getId());
        session.setAttribute("role", admin.getRole());
        session.setAttribute("email", admin.getEmail());
        return ResponseEntity.ok(admin);
    }

    @PostMapping("/logout")
    public void logout(HttpSession s) {
        s.invalidate();
    }

    @GetMapping("/session")
    public Map<String, Object> session(HttpSession s) {
        Object id = s.getAttribute("userId");
        if (id != null
                && users.byId(Long.parseLong(id.toString()))
                        .filter(u -> !u.isSuspended() && !DEMO_EMAIL.equalsIgnoreCase(u.getEmail()))
                        .isEmpty()) {
            s.invalidate();
            return Map.of("loggedIn", false, "userId", "", "role", "GUEST", "email", "");
        }
        return Map.of(
                "loggedIn",
                s.getAttribute("userId") != null,
                "userId",
                Objects.toString(s.getAttribute("userId"), ""),
                "role",
                Objects.toString(s.getAttribute("role"), "GUEST"),
                "email",
                Objects.toString(s.getAttribute("email"), ""));
    }
}

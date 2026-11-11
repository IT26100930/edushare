package com.edushare.modules.admin;

import com.edushare.modules.user.Admin;
import com.edushare.modules.user.EmailIdentityService;
import com.edushare.modules.user.PasswordHash;
import com.edushare.modules.user.User;
import com.edushare.modules.user.UserFileRepository;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Map;

/** An existing administrator authorizes additional administrators. */
@RestController
@RequestMapping("/api/admin/accounts")
public class AdminRegistrationController {
    private final UserService users;
    private final UserFileRepository repository;
    private final EmailIdentityService emails;
    private final TextFileStore store;

    public AdminRegistrationController(
            UserService users,
            UserFileRepository repository,
            EmailIdentityService emails,
            TextFileStore store) {
        this.users = users;
        this.repository = repository;
        this.emails = emails;
        this.store = store;
    }

    public static class Registration {
        private String name, username, email, password, adminPassword;

        public String getName() {
            return name;
        }

        public void setName(String value) {
            name = value;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String value) {
            username = value;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String value) {
            email = value;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String value) {
            password = value;
        }

        public String getAdminPassword() {
            return adminPassword;
        }

        public void setAdminPassword(String value) {
            adminPassword = value;
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Registration input, HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null)
            return ResponseEntity.status(401).body(Map.of("error", "Sign in as an administrator."));
        User actor;
        try {
            actor = users.byId(Long.parseLong(id.toString())).orElse(null);
        } catch (NumberFormatException ex) {
            actor = null;
        }
        if (actor == null || actor.isSuspended() || !"ADMIN".equals(actor.getRole()))
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Administrator access required."));
        if (input == null || !users.matchesCurrentPassword(actor.getId(), input.getAdminPassword()))
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Your administrator password is incorrect."));
        try {
            if (input.getName() == null
                    || input.getName().isBlank()
                    || input.getName().length() > 100)
                throw new IllegalArgumentException(
                        "Enter the new administrator's name (up to 100 characters).");
            if (input.getUsername() == null
                    || !input.getUsername().trim().matches("[a-zA-Z0-9_.-]{3,40}"))
                throw new IllegalArgumentException(
                        "Use a username with 3–40 letters, numbers, dots, hyphens or underscores.");
            if (input.getEmail() == null
                    || input.getEmail().length() > 254
                    || !input.getEmail().trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
                throw new IllegalArgumentException("Enter a valid email address.");
            UserService.validateNewPassword(input.getPassword());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
        if (!emails.configured())
            return ResponseEntity.status(503)
                    .body(
                            Map.of(
                                    "error",
                                    "Email delivery is unavailable. Configure SMTP before creating"
                                        + " an administrator."));
        String email = input.getEmail().trim().toLowerCase(Locale.ROOT);
        String username = input.getUsername().trim().toLowerCase(Locale.ROOT);
        User created;
        synchronized (store) {
            for (User account : repository.findAll()) {
                if (email.equalsIgnoreCase(account.getEmail()))
                    return ResponseEntity.status(409)
                            .body(
                                    Map.of(
                                            "error",
                                            "This email already has an account. Use Users to update"
                                                + " its role."));
                if (username.equalsIgnoreCase(account.getUsername()))
                    return ResponseEntity.status(409)
                            .body(Map.of("error", "This username is already taken."));
            }
            created =
                    new Admin(
                            0,
                            input.getName().trim(),
                            username,
                            email,
                            PasswordHash.hash(input.getPassword()));
            created.setVerified(false);
            // No sign-in is possible while the verification message is being prepared.
            created.setSuspended(true);
            repository.save(created);
        }
        try {
            emails.sendVerification(created);
            created.setSuspended(false);
            repository.save(created);
        } catch (RuntimeException ex) {
            users.delete(created.getId());
            return ResponseEntity.status(503)
                    .body(
                            Map.of(
                                    "error",
                                    "The verification email could not be sent. The account was not"
                                        + " created; please retry."));
        }
        return ResponseEntity.status(201)
                .body(
                        Map.of(
                                "created",
                                true,
                                "id",
                                created.getId(),
                                "username",
                                username,
                                "email",
                                email,
                                "message",
                                "Administrator account created. Verify the email before signing"
                                    + " in.",
                                "next",
                                "/admin/login"));
    }
}

package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class UserService {

    private final UserFileRepository repo;

    private final TextFileStore store;

    public UserService(UserFileRepository repo, TextFileStore store) {
        this.repo = repo;
        this.store = store;
    }

    /** Only for the localhost-only first administrator setup, guarded by AuthController. */
    public User createAdministratorDuringSetup(User admin) {
        return repo.save(admin);
    }

    public List<User> all() {
        // Resolve membership expiration for every account before admin views the roster.
        List<User> accounts = repo.findAll();
        for (User account : accounts) {
            if (account.isPremium()) {
                byId(account.getId());
            }
        }
        return repo.findAll();
    }

    public Optional<User> byId(long id) {
        Optional<User> account = repo.findById(id);
        if (account.isEmpty() || !account.get().isPremium()) {
            return account;
        }
        // Keep premium access in sync with the saved billing end date.
        for (String line : store.read("subscriptions.txt")) {
            String[] parts = line.split("\\|", -1);
            if (parts.length < 5 || !parts[0].equals(Long.toString(id))) {
                continue;
            }
            try {
                if (!java.time.LocalDateTime.now()
                        .isBefore(java.time.LocalDateTime.parse(parts[4]))) {
                    account.get().setPremium(false);
                    repo.save(account.get());
                }
            } catch (java.time.format.DateTimeParseException ignored) {
                // Keep legacy records until an administrator can review them.
            }
            break;
        }
        return account;
    }

    public User register(User u) {
        if (u.getEmail() == null || u.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email required");
        }
        String email = u.getEmail().trim().toLowerCase(Locale.ROOT);
        String domain = email.contains("@") ? email.substring(email.lastIndexOf('@') + 1) : "";
        List<String> blocked =
                store.exists("blocked_domains.txt")
                        ? store.read("blocked_domains.txt")
                        : List.of(
                                "mailinator.com",
                                "tempmail.com",
                                "10minutemail.com",
                                "guerrillamail.com",
                                "disposablemail.org",
                                "throwawaymail.com",
                                "trashmail.net");
        if (blocked.stream().anyMatch(d -> domain.equalsIgnoreCase(d.trim()))) {
            throw new IllegalArgumentException(
                    "Please use a personal or university email address.");
        }
        if (repo.findByEmail(u.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (u.getUsername() == null || u.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (repo.findAll().stream()
                .anyMatch(
                        account ->
                                account.getUsername() != null
                                        && account.getUsername()
                                                .equalsIgnoreCase(u.getUsername().trim()))) {
            throw new IllegalArgumentException("Username is already taken");
        }
        u.setUsername(u.getUsername().trim());
        u.setId(0);
        u.setRole("STUDENT");
        u.setPremium(false);
        u.setVerified(false);
        if (u.getPassword() == null || u.getPassword().length() < 8) {
            throw new IllegalArgumentException("Password must contain at least 8 characters.");
        }
        u.setPassword(PasswordHash.hash(u.getPassword()));
        return repo.save(u);
    }

    /**
     * Admin-assisted student password reset. The controller authenticates the acting admin again.
     */
    public void resetStudentPasswordByAdmin(long studentId, String newPassword) {
        User account =
                repo.findById(studentId)
                        .orElseThrow(
                                () -> new IllegalArgumentException("Student account not found."));
        if (!"STUDENT".equalsIgnoreCase(account.getRole())) {
            throw new IllegalArgumentException("Only student accounts may be reset here.");
        }
        if (newPassword == null
                || newPassword.length() < 8
                || newPassword.length() > 128
                || newPassword.chars().noneMatch(Character::isLetter)
                || newPassword.chars().noneMatch(Character::isDigit)) {
            throw new IllegalArgumentException(
                    "New password must be 8–128 characters and include a letter and a number.");
        }
        account.setPassword(PasswordHash.hash(newPassword));
        repo.save(account);
    }

    /** Recovery is authorized by AuthController; never trusts a browser-supplied role. */
    public void resetAdministratorPassword(long id, String newPassword) {
        User account =
                repo.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        if (!"ADMIN".equalsIgnoreCase(account.getRole())
                || newPassword == null
                || newPassword.length() < 8) {
            throw new IllegalArgumentException("Invalid admin recovery request");
        }
        account.setPassword(PasswordHash.hash(newPassword));
        repo.save(account);
    }

    /** Verified password change for the authenticated account only. */
    public synchronized void changePassword(long id, String currentPassword, String newPassword) {
        User account =
                repo.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Account not found."));
        if (currentPassword == null
                || !PasswordHash.matches(currentPassword, account.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        validateNewPassword(newPassword);
        if (PasswordHash.matches(newPassword, account.getPassword())) {
            throw new IllegalArgumentException(
                    "Choose a password different from your current password.");
        }
        account.setPassword(PasswordHash.hash(newPassword));
        repo.save(account);
    }

    public static void validateNewPassword(String password) {
        if (password == null
                || password.length() < 8
                || password.length() > 128
                || password.chars().noneMatch(Character::isLetter)
                || password.chars().noneMatch(Character::isDigit)) {
            throw new IllegalArgumentException(
                    "Password must have 8–128 characters, at least one letter and a number.");
        }
    }

    public boolean matchesCurrentPassword(long id, String password) {
        return password != null
                && repo.findById(id)
                        .filter(u -> PasswordHash.matches(password, u.getPassword()))
                        .isPresent();
    }

    public synchronized void applyVerifiedEmailChange(long id, String email) {
        User account =
                repo.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Account not found."));
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (repo.findAll().stream()
                .anyMatch(u -> u.getId() != id && normalized.equalsIgnoreCase(u.getEmail()))) {
            throw new IllegalArgumentException("Email belongs to another account.");
        }
        account.setEmail(normalized);
        repo.save(account);
    }

    public Optional<User> update(long id, User in) {
        if (in.getInterests() != null
                && (in.getInterests().size() > 20
                        || in.getInterests().stream()
                                .anyMatch(
                                        tag ->
                                                tag == null
                                                        || tag.isBlank()
                                                        || tag.length() > 60))) {
            throw new IllegalArgumentException(
                    "Use up to 20 interests, with 1–60 characters each.");
        }
        if (in.getNotifications() != null
                && in.getNotifications().entrySet().stream()
                        .anyMatch(
                                e ->
                                        !Set.of("emailDigest", "newReviews", "payouts")
                                                        .contains(e.getKey())
                                                || e.getValue() == null)) {
            throw new IllegalArgumentException("Invalid notification preference.");
        }
        {
            Optional<User> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            User u = foundRecord.get();
            // Profile editing must never set email or password. Use verified credential endpoints.
            if (in.getEmail() != null && !in.getEmail().equalsIgnoreCase(u.getEmail())) {
                throw new IllegalArgumentException("Email changes require inbox verification.");
            }
            if (in.getPassword() != null && !in.getPassword().isBlank()) {
                throw new IllegalArgumentException("Use the secure change-password endpoint.");
            }
            if (in.getName() == null || in.getName().isBlank()) {
                throw new IllegalArgumentException("Name cannot be empty.");
            }
            if (in.getUsername() == null || !in.getUsername().matches("[a-zA-Z0-9_.-]{3,40}")) {
                throw new IllegalArgumentException(
                        "Username must be 3–40 letters, numbers, dots, hyphens or underscores.");
            }
            if (repo.findAll().stream()
                    .anyMatch(
                            other ->
                                    other.getId() != id
                                            && other.getUsername() != null
                                            && other.getUsername()
                                                    .equalsIgnoreCase(in.getUsername()))) {
                throw new IllegalArgumentException("Username already in use.");
            }
            u.setName(in.getName().trim());
            u.setUsername(in.getUsername().trim());
            if (in.getBio() != null) {
                u.setBio(in.getBio());
            }
            if (in.getUniversity() != null) {
                u.setUniversity(in.getUniversity());
            }
            if (in.getDegree() != null) {
                u.setDegree(in.getDegree());
            }
            if (in.getBatch() != null) {
                u.setBatch(in.getBatch());
            }
            if (in.getCoverPattern() != null) {
                u.setCoverPattern(in.getCoverPattern());
            }
            if (in.getGithubUrl() != null) {
                u.setGithubUrl(in.getGithubUrl());
            }
            if (in.getLinkedinUrl() != null) {
                u.setLinkedinUrl(in.getLinkedinUrl());
            }
            if (in.getLanguage() != null) {
                if (!java.util.Set.of("en", "si").contains(in.getLanguage())) {
                    throw new IllegalArgumentException("Unsupported language");
                }
                u.setLanguage(in.getLanguage());
            }
            if (in.getShowEmail() != null) {
                u.setShowEmail(in.getShowEmail());
            }
            if (in.getIsPublic() != null) {
                u.setIsPublic(in.getIsPublic());
            }
            if (in.getInterests() != null) {
                u.setInterests(in.getInterests().stream().map(String::trim).distinct().toList());
            }
            if (in.getNotifications() != null) {
                Map<String, Boolean> preferences =
                        new HashMap<>(
                                u.getNotifications() == null
                                        ? Map.of(
                                                "emailDigest",
                                                false,
                                                "newReviews",
                                                true,
                                                "payouts",
                                                false)
                                        : u.getNotifications());
                preferences.putAll(in.getNotifications());
                u.setNotifications(preferences);
            }
            return Optional.of(repo.save(u));
        }
    }

    public Optional<User> updateAvatar(long id, String avatar) {
        {
            Optional<User> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            User u = foundRecord.get();
            u.setAvatar(avatar);
            return Optional.of(repo.save(u));
        }
    }

    public Optional<User> setPremium(long id, boolean premium) {
        {
            Optional<User> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            User u = foundRecord.get();
            u.setPremium(premium);
            return Optional.of(repo.save(u));
        }
    }

    public Optional<User> administer(long id, String action) {
        {
            Optional<User> foundRecord = repo.findById(id);
            if (foundRecord.isEmpty()) {
                return Optional.empty();
            }
            User u = foundRecord.get();
            switch (action) {
                case "verify":
                    u.setVerified(true);
                    break;
                case "unverify":
                    u.setVerified(false);
                    break;
                case "suspend":
                    u.setSuspended(true);
                    break;
                case "activate":
                    u.setSuspended(false);
                    break;
                case "role_admin":
                    u.setRole("ADMIN");
                    break;
                case "role_student":
                    u.setRole("STUDENT");
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported action");
            }
            return Optional.of(repo.save(u));
        }
    }

    public boolean delete(long id) {
        synchronized (store) {
            User account = repo.findById(id).orElse(null);
            if (account == null || !repo.delete(id)) {
                return false;
            }
            List<String> edits = store.read("avatar-edits.txt");
            List<String> owned = edits.stream().filter(row -> row.startsWith(id + "|")).toList();
            edits.removeIf(row -> row.startsWith(id + "|"));
            if (!owned.isEmpty()) {
                store.write("avatar-edits.txt", edits);
            }
            try {
                for (String row : owned) {
                    String[] fields = row.split("\\|", -1);
                    if (fields.length > 1 && fields[1].matches("[a-f0-9-]+\\.(jpg|png)")) {
                        java.nio.file.Files.deleteIfExists(
                                store.getDataDirectory()
                                        .resolve("avatar-originals")
                                        .resolve(fields[1]));
                    }
                }
                String avatar = Objects.toString(account.getAvatar(), "");
                String prefix = "/api/users/avatar/";
                if (avatar.startsWith(prefix)) {
                    String name = avatar.substring(prefix.length());
                    if (name.matches("user-" + id + "-[a-zA-Z0-9-]+\\.(jpg|jpeg|png|webp)")) {
                        java.nio.file.Files.deleteIfExists(
                                store.getDataDirectory().resolve("avatars").resolve(name));
                    }
                }
            } catch (java.io.IOException ignored) {
                /* The removed account cannot access retained files; an administrator can clean up unavailable storage. */
            }
            return true;
        }
    }

    public Optional<User> login(String email, String password) {
        return repo.findByEmail(email)
                .filter(u -> PasswordHash.matches(password, u.getPassword()))
                .map(
                        u -> {
                            // Upgrade old plaintext test records after a successful login.
                            if (!u.getPassword().startsWith("pbkdf2$")) {
                                u.setPassword(PasswordHash.hash(password));
                                return repo.save(u);
                            }
                            return u;
                        });
    }
}

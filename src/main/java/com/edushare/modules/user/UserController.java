package com.edushare.modules.user;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService service;

    private final EmailIdentityService emails;

    public UserController(UserService service, EmailIdentityService emails) {
        this.emails = emails;
        this.service = service;
    }

    private boolean isAdmin(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return false;
        }
        return service.byId(Long.parseLong(id.toString()))
                .map(user -> "ADMIN".equals(user.getRole()) && !user.isSuspended())
                .orElse(false);
    }

    @GetMapping
    public ResponseEntity<List<User>> all(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(service.all());
    }

    // passwords and private account settings never leave the server.
    public static final class PublicProfile {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final long id;

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("username")
        private final String username;

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        private final String avatar;

        @com.fasterxml.jackson.annotation.JsonProperty("university")
        private final String university;

        @com.fasterxml.jackson.annotation.JsonProperty("degree")
        private final String degree;

        @com.fasterxml.jackson.annotation.JsonProperty("batch")
        private final String batch;

        @com.fasterxml.jackson.annotation.JsonProperty("bio")
        private final String bio;

        @com.fasterxml.jackson.annotation.JsonProperty("coverPattern")
        private final String coverPattern;

        @com.fasterxml.jackson.annotation.JsonProperty("githubUrl")
        private final String githubUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("linkedinUrl")
        private final String linkedinUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("verified")
        private final boolean verified;

        @com.fasterxml.jackson.annotation.JsonProperty("showEmail")
        private final boolean showEmail;

        @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
        private final boolean isPublic;

        @com.fasterxml.jackson.annotation.JsonProperty("interests")
        private final List<String> interests;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public PublicProfile(
                @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("username") String username,
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("avatar") String avatar,
                @com.fasterxml.jackson.annotation.JsonProperty("university") String university,
                @com.fasterxml.jackson.annotation.JsonProperty("degree") String degree,
                @com.fasterxml.jackson.annotation.JsonProperty("batch") String batch,
                @com.fasterxml.jackson.annotation.JsonProperty("bio") String bio,
                @com.fasterxml.jackson.annotation.JsonProperty("coverPattern") String coverPattern,
                @com.fasterxml.jackson.annotation.JsonProperty("githubUrl") String githubUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("linkedinUrl") String linkedinUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("verified") boolean verified,
                @com.fasterxml.jackson.annotation.JsonProperty("showEmail") boolean showEmail,
                @com.fasterxml.jackson.annotation.JsonProperty("isPublic") boolean isPublic,
                @com.fasterxml.jackson.annotation.JsonProperty("interests")
                        List<String> interests) {
            this.id = id;
            this.name = name;
            this.username = username;
            this.email = email;
            this.avatar = avatar;
            this.university = university;
            this.degree = degree;
            this.batch = batch;
            this.bio = bio;
            this.coverPattern = coverPattern;
            this.githubUrl = githubUrl;
            this.linkedinUrl = linkedinUrl;
            this.verified = verified;
            this.showEmail = showEmail;
            this.isPublic = isPublic;
            this.interests = interests;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public long getId() {
            return id;
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

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        public String getAvatar() {
            return avatar;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("university")
        public String getUniversity() {
            return university;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("degree")
        public String getDegree() {
            return degree;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("batch")
        public String getBatch() {
            return batch;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("bio")
        public String getBio() {
            return bio;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("coverPattern")
        public String getCoverPattern() {
            return coverPattern;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("githubUrl")
        public String getGithubUrl() {
            return githubUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("linkedinUrl")
        public String getLinkedinUrl() {
            return linkedinUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("verified")
        public boolean getVerified() {
            return verified;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("showEmail")
        public boolean getShowEmail() {
            return showEmail;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("isPublic")
        public boolean getIsPublic() {
            return isPublic;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("interests")
        public List<String> getInterests() {
            return interests;
        }

        public static boolean canView(User u, User viewer) {
            return u.publicProfileEnabled()
                    || u.getId() == viewer.getId()
                    || "ADMIN".equals(viewer.getRole());
        }

        public static PublicProfile from(User u, User viewer) {
            boolean visible = canView(u, viewer);
            boolean contact =
                    u.getId() == viewer.getId()
                            || "ADMIN".equals(viewer.getRole())
                            || (u.publicProfileEnabled() && u.emailVisibleToMembers());
            // Directory retains basic author identity for resource/profile links.
            return new PublicProfile(
                    u.getId(),
                    u.getName(),
                    u.getUsername(),
                    contact ? u.getEmail() : "",
                    u.getAvatar(),
                    visible ? u.getUniversity() : "",
                    visible ? u.getDegree() : "",
                    visible ? u.getBatch() : "",
                    visible ? u.getBio() : "",
                    visible ? u.getCoverPattern() : "",
                    visible ? u.getGithubUrl() : "",
                    visible ? u.getLinkedinUrl() : "",
                    u.isVerified(),
                    u.emailVisibleToMembers(),
                    u.publicProfileEnabled(),
                    visible && u.getInterests() != null ? u.getInterests() : List.of());
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            PublicProfile value = (PublicProfile) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(username, value.username)
                    && java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(avatar, value.avatar)
                    && java.util.Objects.equals(university, value.university)
                    && java.util.Objects.equals(degree, value.degree)
                    && java.util.Objects.equals(batch, value.batch)
                    && java.util.Objects.equals(bio, value.bio)
                    && java.util.Objects.equals(coverPattern, value.coverPattern)
                    && java.util.Objects.equals(githubUrl, value.githubUrl)
                    && java.util.Objects.equals(linkedinUrl, value.linkedinUrl)
                    && java.util.Objects.equals(verified, value.verified)
                    && java.util.Objects.equals(showEmail, value.showEmail)
                    && java.util.Objects.equals(isPublic, value.isPublic)
                    && java.util.Objects.equals(interests, value.interests);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(username);
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(avatar);
            result = 31 * result + java.util.Objects.hashCode(university);
            result = 31 * result + java.util.Objects.hashCode(degree);
            result = 31 * result + java.util.Objects.hashCode(batch);
            result = 31 * result + java.util.Objects.hashCode(bio);
            result = 31 * result + java.util.Objects.hashCode(coverPattern);
            result = 31 * result + java.util.Objects.hashCode(githubUrl);
            result = 31 * result + java.util.Objects.hashCode(linkedinUrl);
            result = 31 * result + java.util.Objects.hashCode(verified);
            result = 31 * result + java.util.Objects.hashCode(showEmail);
            result = 31 * result + java.util.Objects.hashCode(isPublic);
            result = 31 * result + java.util.Objects.hashCode(interests);
            return result;
        }

        @Override
        public String toString() {
            return "PublicProfile["
                    + "id="
                    + id
                    + ", name="
                    + name
                    + ", username="
                    + username
                    + ", email="
                    + email
                    + ", avatar="
                    + avatar
                    + ", university="
                    + university
                    + ", degree="
                    + degree
                    + ", batch="
                    + batch
                    + ", bio="
                    + bio
                    + ", coverPattern="
                    + coverPattern
                    + ", githubUrl="
                    + githubUrl
                    + ", linkedinUrl="
                    + linkedinUrl
                    + ", verified="
                    + verified
                    + ", showEmail="
                    + showEmail
                    + ", isPublic="
                    + isPublic
                    + ", interests="
                    + interests
                    + "]";
        }
    }

    // Account directory for authenticated EduShare members. Only public profile fields are
    // returned;
    private User viewer(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return null;
        }
        try {
            return service.byId(Long.parseLong(id.toString()))
                    .filter(u -> !u.isSuspended())
                    .orElse(null);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    @GetMapping("/directory")
    public ResponseEntity<List<PublicProfile>> directory(HttpSession session) {
        User viewer = viewer(session);
        if (viewer == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok()
                .cacheControl(org.springframework.http.CacheControl.noStore())
                .body(
                        service.all().stream()
                                .filter(u -> !u.isSuspended())
                                .map(u -> PublicProfile.from(u, viewer))
                                .toList());
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<PublicProfile> publicProfile(
            @PathVariable String username, HttpSession session) {
        User viewer = viewer(session);
        if (viewer == null) {
            return ResponseEntity.status(401).build();
        }
        return service.all().stream()
                .filter(u -> !u.isSuspended() && PublicProfile.canView(u, viewer))
                .filter(u -> u.getUsername() != null && u.getUsername().equalsIgnoreCase(username))
                .findFirst()
                .map(
                        u ->
                                ResponseEntity.ok()
                                        .cacheControl(
                                                org.springframework.http.CacheControl.noStore())
                                        .body(PublicProfile.from(u, viewer)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/me")
    public ResponseEntity<User> me(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return ResponseEntity.status(401).build();
        }
        return service.byId(Long.parseLong(id.toString()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Premium changes must go through the demo checkout API with a receipt.
    @PostMapping("/me/premium")
    public ResponseEntity<Map<String, String>> deprecatedPremiumActivation() {
        return ResponseEntity.status(409)
                .body(Map.of("error", "Use the demo checkout to activate Premium."));
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> one(@PathVariable long id, HttpSession session) {
        Object current = session.getAttribute("userId");
        if (current == null) {
            return ResponseEntity.status(401).build();
        }
        if (!isAdmin(session) && Long.parseLong(current.toString()) != id) {
            return ResponseEntity.status(403).build();
        }
        return service.byId(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Student user) {
        try {
            if (!emails.configured()) {
                return ResponseEntity.status(503)
                        .body(
                                Map.of(
                                        "error",
                                        "Email delivery is temporarily unavailable. Please contact"
                                            + " the administrator."));
            }
            if (user.getEmail() == null
                    || user.getEmail().toLowerCase(Locale.ROOT).endsWith("@example.com")) {
                return ResponseEntity.badRequest()
                        .body(
                                Map.of(
                                        "error",
                                        "Use your real email inbox, not a demo example.com"
                                            + " address."));
            }
            User saved = service.register(user);
            try {
                emails.sendVerification(saved);
            } catch (RuntimeException ex) {
                service.delete(saved.getId());
                return ResponseEntity.status(503)
                        .body(
                                Map.of(
                                        "error",
                                        "Could not deliver the verification email. Please check"
                                            + " your address and try again."));
            }
            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Registration saved. Check your inbox to verify your email before"
                                + " logging in."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static final class ChangePasswordRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("currentPassword")
        private final String currentPassword;

        @com.fasterxml.jackson.annotation.JsonProperty("newPassword")
        private final String newPassword;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public ChangePasswordRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("currentPassword")
                        String currentPassword,
                @com.fasterxml.jackson.annotation.JsonProperty("newPassword") String newPassword) {
            this.currentPassword = currentPassword;
            this.newPassword = newPassword;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("currentPassword")
        public String getCurrentPassword() {
            return currentPassword;
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
            ChangePasswordRequest value = (ChangePasswordRequest) other;
            return java.util.Objects.equals(currentPassword, value.currentPassword)
                    && java.util.Objects.equals(newPassword, value.newPassword);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(currentPassword);
            result = 31 * result + java.util.Objects.hashCode(newPassword);
            return result;
        }

        @Override
        public String toString() {
            return "ChangePasswordRequest["
                    + "currentPassword="
                    + currentPassword
                    + ", newPassword="
                    + newPassword
                    + "]";
        }
    }

    public static final class ChangeEmailRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("currentPassword")
        private final String currentPassword;

        @com.fasterxml.jackson.annotation.JsonProperty("newEmail")
        private final String newEmail;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public ChangeEmailRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("currentPassword")
                        String currentPassword,
                @com.fasterxml.jackson.annotation.JsonProperty("newEmail") String newEmail) {
            this.currentPassword = currentPassword;
            this.newEmail = newEmail;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("currentPassword")
        public String getCurrentPassword() {
            return currentPassword;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("newEmail")
        public String getNewEmail() {
            return newEmail;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            ChangeEmailRequest value = (ChangeEmailRequest) other;
            return java.util.Objects.equals(currentPassword, value.currentPassword)
                    && java.util.Objects.equals(newEmail, value.newEmail);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(currentPassword);
            result = 31 * result + java.util.Objects.hashCode(newEmail);
            return result;
        }

        @Override
        public String toString() {
            return "ChangeEmailRequest["
                    + "currentPassword="
                    + currentPassword
                    + ", newEmail="
                    + newEmail
                    + "]";
        }
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest input, HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Log in again."));
        }
        try {
            if (input == null) {
                throw new IllegalArgumentException("Enter current and new passwords.");
            }
            service.changePassword(
                    Long.parseLong(id.toString()),
                    input.getCurrentPassword(),
                    input.getNewPassword());
            session.invalidate();
            return ResponseEntity.ok(Map.of("message", "Password changed. Please sign in again."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/me/request-email-change")
    public ResponseEntity<?> requestEmailChange(
            @RequestBody ChangeEmailRequest input, HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Log in again."));
        }
        try {
            if (input == null
                    || !service.matchesCurrentPassword(
                            Long.parseLong(id.toString()), input.getCurrentPassword())) {
                throw new IllegalArgumentException("Current password is incorrect.");
            }
            emails.sendEmailChange(Long.parseLong(id.toString()), input.getNewEmail());
            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Confirmation link sent to your new email. Your current email stays"
                                + " active until verification."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(503)
                    .body(Map.of("error", "Could not send the email. Please try again later."));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable long id, @RequestBody Student user, HttpSession session) {
        Object current = session.getAttribute("userId");
        if (current == null) {
            return ResponseEntity.status(401).build();
        }
        if (!isAdmin(session) && Long.parseLong(current.toString()) != id) {
            return ResponseEntity.status(403).build();
        }
        try {
            return service.update(id, user)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, HttpSession session) {
        Object current = session.getAttribute("userId");
        if (current == null) {
            return ResponseEntity.status(401).build();
        }
        boolean own = Long.parseLong(current.toString()) == id;
        if (!own && !isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        boolean deleted = service.delete(id);
        if (deleted && own) {
            session.invalidate();
        }
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}

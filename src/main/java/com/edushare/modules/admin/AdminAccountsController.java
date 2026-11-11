package com.edushare.modules.admin;

import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

/** Admin-only account management, stored in users.txt. Never trusts client-side role claims. */
@RestController
@RequestMapping("/api/admin/accounts")
public class AdminAccountsController {

    private final UserService users;

    private final com.edushare.modules.resource.ResourceService resources;

    private final TextFileStore store;

    public AdminAccountsController(
            UserService users,
            com.edushare.modules.resource.ResourceService resources,
            TextFileStore store) {
        this.users = users;
        this.resources = resources;
        this.store = store;
    }

    private boolean admin(HttpSession session) {
        Object id = session.getAttribute("userId");
        return id != null
                && users.byId(Long.parseLong(id.toString()))
                        .filter(u -> "ADMIN".equals(u.getRole()) && !u.isSuspended())
                        .isPresent();
    }

    public static final class AccountView {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final long id;

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("username")
        private final String username;

        @com.fasterxml.jackson.annotation.JsonProperty("email")
        private final String email;

        @com.fasterxml.jackson.annotation.JsonProperty("university")
        private final String university;

        @com.fasterxml.jackson.annotation.JsonProperty("degree")
        private final String degree;

        @com.fasterxml.jackson.annotation.JsonProperty("role")
        private final String role;

        @com.fasterxml.jackson.annotation.JsonProperty("verified")
        private final boolean verified;

        @com.fasterxml.jackson.annotation.JsonProperty("suspended")
        private final boolean suspended;

        @com.fasterxml.jackson.annotation.JsonProperty("premium")
        private final boolean premium;

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        private final String avatar;

        @com.fasterxml.jackson.annotation.JsonProperty("cancellationScheduled")
        private final boolean cancellationScheduled;

        @com.fasterxml.jackson.annotation.JsonProperty("premiumUntil")
        private final String premiumUntil;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public AccountView(
                @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("username") String username,
                @com.fasterxml.jackson.annotation.JsonProperty("email") String email,
                @com.fasterxml.jackson.annotation.JsonProperty("university") String university,
                @com.fasterxml.jackson.annotation.JsonProperty("degree") String degree,
                @com.fasterxml.jackson.annotation.JsonProperty("role") String role,
                @com.fasterxml.jackson.annotation.JsonProperty("verified") boolean verified,
                @com.fasterxml.jackson.annotation.JsonProperty("suspended") boolean suspended,
                @com.fasterxml.jackson.annotation.JsonProperty("premium") boolean premium,
                @com.fasterxml.jackson.annotation.JsonProperty("avatar") String avatar,
                @com.fasterxml.jackson.annotation.JsonProperty("cancellationScheduled")
                        boolean cancellationScheduled,
                @com.fasterxml.jackson.annotation.JsonProperty("premiumUntil")
                        String premiumUntil) {
            this.id = id;
            this.name = name;
            this.username = username;
            this.email = email;
            this.university = university;
            this.degree = degree;
            this.role = role;
            this.verified = verified;
            this.suspended = suspended;
            this.premium = premium;
            this.avatar = avatar;
            this.cancellationScheduled = cancellationScheduled;
            this.premiumUntil = premiumUntil;
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

        @com.fasterxml.jackson.annotation.JsonProperty("university")
        public String getUniversity() {
            return university;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("degree")
        public String getDegree() {
            return degree;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("role")
        public String getRole() {
            return role;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("verified")
        public boolean getVerified() {
            return verified;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("suspended")
        public boolean getSuspended() {
            return suspended;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("premium")
        public boolean getPremium() {
            return premium;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        public String getAvatar() {
            return avatar;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("cancellationScheduled")
        public boolean getCancellationScheduled() {
            return cancellationScheduled;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("premiumUntil")
        public String getPremiumUntil() {
            return premiumUntil;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            AccountView value = (AccountView) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(username, value.username)
                    && java.util.Objects.equals(email, value.email)
                    && java.util.Objects.equals(university, value.university)
                    && java.util.Objects.equals(degree, value.degree)
                    && java.util.Objects.equals(role, value.role)
                    && java.util.Objects.equals(verified, value.verified)
                    && java.util.Objects.equals(suspended, value.suspended)
                    && java.util.Objects.equals(premium, value.premium)
                    && java.util.Objects.equals(avatar, value.avatar)
                    && java.util.Objects.equals(cancellationScheduled, value.cancellationScheduled)
                    && java.util.Objects.equals(premiumUntil, value.premiumUntil);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(username);
            result = 31 * result + java.util.Objects.hashCode(email);
            result = 31 * result + java.util.Objects.hashCode(university);
            result = 31 * result + java.util.Objects.hashCode(degree);
            result = 31 * result + java.util.Objects.hashCode(role);
            result = 31 * result + java.util.Objects.hashCode(verified);
            result = 31 * result + java.util.Objects.hashCode(suspended);
            result = 31 * result + java.util.Objects.hashCode(premium);
            result = 31 * result + java.util.Objects.hashCode(avatar);
            result = 31 * result + java.util.Objects.hashCode(cancellationScheduled);
            result = 31 * result + java.util.Objects.hashCode(premiumUntil);
            return result;
        }

        @Override
        public String toString() {
            return "AccountView["
                    + "id="
                    + id
                    + ", name="
                    + name
                    + ", username="
                    + username
                    + ", email="
                    + email
                    + ", university="
                    + university
                    + ", degree="
                    + degree
                    + ", role="
                    + role
                    + ", verified="
                    + verified
                    + ", suspended="
                    + suspended
                    + ", premium="
                    + premium
                    + ", avatar="
                    + avatar
                    + ", cancellationScheduled="
                    + cancellationScheduled
                    + ", premiumUntil="
                    + premiumUntil
                    + "]";
        }
    }

    private AccountView view(User user) {
        boolean scheduled = false;
        String until = "";
        for (String line : store.read("subscriptions.txt")) {
            String[] row = line.split("\\|", -1);
            if (row.length < 7 || !row[0].equals(Long.toString(user.getId()))) {
                continue;
            }
            until = row[4];
            scheduled = user.isPremium() && !row[5].isBlank();
            break;
        }
        return new AccountView(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getEmail(),
                user.getUniversity(),
                user.getDegree(),
                user.getRole(),
                user.isVerified(),
                user.isSuspended(),
                user.isPremium(),
                user.getAvatar(),
                scheduled,
                until);
    }

    @GetMapping
    public ResponseEntity<?> list(HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(users.all().stream().map(this::view).toList());
    }

    public static final class Action {

        @com.fasterxml.jackson.annotation.JsonProperty("action")
        private final String action;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Action(@com.fasterxml.jackson.annotation.JsonProperty("action") String action) {
            this.action = action;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("action")
        public String getAction() {
            return action;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Action value = (Action) other;
            return java.util.Objects.equals(action, value.action);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(action);
            return result;
        }

        @Override
        public String toString() {
            return "Action[" + "action=" + action + "]";
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> action(
            @PathVariable long id, @RequestBody Action body, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (body == null
                || body.getAction() == null
                || !Set.of(
                                "verify",
                                "unverify",
                                "suspend",
                                "activate",
                                "role_admin",
                                "role_student",
                                "plan_free")
                        .contains(body.getAction())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid action"));
        }
        long actor = Long.parseLong(session.getAttribute("userId").toString());
        if (actor == id && Set.of("suspend", "role_student").contains(body.getAction())) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Cannot suspend or demote your own admin account."));
        }
        java.util.Optional<com.edushare.modules.user.User> candidate = users.byId(id);
        if (candidate.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if ("ADMIN".equals(candidate.get().getRole())
                && "role_student".equals(body.getAction())
                && users.all().stream().filter(u -> "ADMIN".equals(u.getRole())).count() <= 1) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Cannot remove the last administrator."));
        }
        try {
            if ("plan_free".equals(body.getAction())) {
                // Administrative demo downgrade: immediately revoke access and close the
                // active billing record, so future refreshes cannot restore Premium.
                synchronized (this) {
                    List<String> entries = new ArrayList<>(store.read("subscriptions.txt"));
                    String now = LocalDateTime.now().toString();
                    List<String> replacement = new ArrayList<>();
                    for (String entry : entries) {
                        String[] row = entry.split("\\|", -1);
                        if (row.length >= 7 && row[0].equals(Long.toString(id))) {
                            replacement.add(
                                    row[0]
                                            + "|"
                                            + row[1]
                                            + "|"
                                            + row[2]
                                            + "|"
                                            + row[3]
                                            + "|"
                                            + now
                                            + "|"
                                            + now
                                            + "|Admin ended demo membership");
                        } else {
                            replacement.add(entry);
                        }
                    }
                    store.write("subscriptions.txt", replacement);
                    users.setPremium(id, false);
                }
                return ResponseEntity.ok(view(users.byId(id).orElseThrow()));
            }
            return ResponseEntity.ok(view(users.administer(id, body.getAction()).orElseThrow()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static final class StudentPasswordResetRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("adminPassword")
        private final String adminPassword;

        @com.fasterxml.jackson.annotation.JsonProperty("newPassword")
        private final String newPassword;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public StudentPasswordResetRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("adminPassword")
                        String adminPassword,
                @com.fasterxml.jackson.annotation.JsonProperty("newPassword") String newPassword) {
            this.adminPassword = adminPassword;
            this.newPassword = newPassword;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("adminPassword")
        public String getAdminPassword() {
            return adminPassword;
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
            StudentPasswordResetRequest value = (StudentPasswordResetRequest) other;
            return java.util.Objects.equals(adminPassword, value.adminPassword)
                    && java.util.Objects.equals(newPassword, value.newPassword);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(adminPassword);
            result = 31 * result + java.util.Objects.hashCode(newPassword);
            return result;
        }

        @Override
        public String toString() {
            return "StudentPasswordResetRequest["
                    + "adminPassword="
                    + adminPassword
                    + ", newPassword="
                    + newPassword
                    + "]";
        }
    }

    /** A privileged reset requires a live admin session AND re-authentication. */
    @PostMapping("/{id}/reset-password")
    public ResponseEntity<?> resetStudentPassword(
            @PathVariable long id,
            @RequestBody StudentPasswordResetRequest input,
            HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Administrator access required."));
        }
        long actorId = Long.parseLong(session.getAttribute("userId").toString());
        if (actorId == id) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Cannot reset your own password here."));
        }
        if (input == null
                || input.getAdminPassword() == null
                || input.getAdminPassword().isBlank()
                || input.getNewPassword() == null) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Enter your administrator password and a new student"
                                        + " password."));
        }
        User actor = users.byId(actorId).orElse(null);
        if (actor == null
                || !"ADMIN".equalsIgnoreCase(actor.getRole())
                || users.login(actor.getEmail(), input.getAdminPassword()).isEmpty()) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Administrator password is incorrect."));
        }
        try {
            users.resetStudentPasswordByAdmin(id, input.getNewPassword());
            PasswordRecoveryController.finish(store, id, "completed");
            // Do not return the password or its hash in the API response.
            return ResponseEntity.ok(
                    Map.of("updated", true, "message", "Student password reset successfully."));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (Long.parseLong(session.getAttribute("userId").toString()) == id) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Cannot delete your own admin account."));
        }
        java.util.Optional<com.edushare.modules.user.User> target = users.byId(id);
        if (target.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if ("ADMIN".equals(target.get().getRole())
                && users.all().stream().filter(u -> "ADMIN".equals(u.getRole())).count() <= 1) {
            return ResponseEntity.status(409).body(Map.of("error", "Cannot delete last admin."));
        }
        if (resources.all(null, null, null).stream()
                .anyMatch(r -> target.get().getEmail().equalsIgnoreCase(r.getUploaderEmail()))) {
            return ResponseEntity.status(409)
                    .body(
                            Map.of(
                                    "error",
                                    "User owns uploaded resources. Remove or transfer these"
                                        + " resources before deleting the account."));
        }
        return users.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}

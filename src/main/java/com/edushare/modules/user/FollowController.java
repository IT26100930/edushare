package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/** Real student follow relationships, stored as followerId|followingId in follows.txt. */
@RestController
@RequestMapping("/api/follows")
public class FollowController {

    private static final String FILE = "follows.txt";

    private final TextFileStore store;

    private final UserService users;

    public FollowController(TextFileStore store, UserService users) {
        this.store = store;
        this.users = users;
    }

    public static final class FollowStatus {

        @com.fasterxml.jackson.annotation.JsonProperty("authorId")
        private final long authorId;

        @com.fasterxml.jackson.annotation.JsonProperty("followers")
        private final long followers;

        @com.fasterxml.jackson.annotation.JsonProperty("following")
        private final boolean following;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public FollowStatus(
                @com.fasterxml.jackson.annotation.JsonProperty("authorId") long authorId,
                @com.fasterxml.jackson.annotation.JsonProperty("followers") long followers,
                @com.fasterxml.jackson.annotation.JsonProperty("following") boolean following) {
            this.authorId = authorId;
            this.followers = followers;
            this.following = following;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("authorId")
        public long getAuthorId() {
            return authorId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("followers")
        public long getFollowers() {
            return followers;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("following")
        public boolean getFollowing() {
            return following;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            FollowStatus value = (FollowStatus) other;
            return java.util.Objects.equals(authorId, value.authorId)
                    && java.util.Objects.equals(followers, value.followers)
                    && java.util.Objects.equals(following, value.following);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(authorId);
            result = 31 * result + java.util.Objects.hashCode(followers);
            result = 31 * result + java.util.Objects.hashCode(following);
            return result;
        }

        @Override
        public String toString() {
            return "FollowStatus["
                    + "authorId="
                    + authorId
                    + ", followers="
                    + followers
                    + ", following="
                    + following
                    + "]";
        }
    }

    private Optional<User> viewer(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) {
            return Optional.empty();
        }
        try {
            return users.byId(Long.parseLong(id.toString())).filter(u -> !u.isSuspended());
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private FollowStatus status(long authorId, Optional<User> viewer) {
        List<String> rows = store.read(FILE);
        long count =
                rows.stream()
                        .filter(
                                row -> {
                                    String[] parts = row.split("\\|", -1);
                                    return parts.length == 2
                                            && parts[1].equals(Long.toString(authorId));
                                })
                        .count();
        boolean following =
                viewer.isPresent() && rows.contains(viewer.get().getId() + "|" + authorId);
        return new FollowStatus(authorId, count, following);
    }

    @GetMapping("/{authorId}")
    public ResponseEntity<?> status(@PathVariable long authorId, HttpSession session) {
        if (users.byId(authorId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(status(authorId, viewer(session)));
    }

    @PostMapping("/{authorId}")
    public ResponseEntity<?> follow(@PathVariable long authorId, HttpSession session) {
        Optional<User> current = viewer(session);
        if (current.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Sign in to follow a student."));
        }
        Optional<User> author = users.byId(authorId).filter(u -> !u.isSuspended());
        if (author.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (current.get().getId() == authorId) {
            return ResponseEntity.badRequest().body(Map.of("error", "You cannot follow yourself."));
        }
        synchronized (store) {
            List<String> rows = store.read(FILE);
            String pair = current.get().getId() + "|" + authorId;
            if (!rows.contains(pair)) {
                rows.add(pair);
                store.write(FILE, rows);
            }
            return ResponseEntity.ok(status(authorId, current));
        }
    }

    @DeleteMapping("/{authorId}")
    public ResponseEntity<?> unfollow(@PathVariable long authorId, HttpSession session) {
        Optional<User> current = viewer(session);
        if (current.isEmpty()) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Sign in to unfollow a student."));
        }
        synchronized (store) {
            List<String> rows = store.read(FILE);
            rows.removeIf(row -> row.equals(current.get().getId() + "|" + authorId));
            store.write(FILE, rows);
            return ResponseEntity.ok(status(authorId, current));
        }
    }
}

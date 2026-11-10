package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/profile-connections")
public class ProfileConnectionsController {

    private final TextFileStore store;

    private final UserService users;

    public ProfileConnectionsController(TextFileStore store, UserService users) {
        this.store = store;
        this.users = users;
    }

    // Only public profile fields; never return email addresses or passwords.
    public static final class Person {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final long id;

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("username")
        private final String username;

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        private final String avatar;

        @com.fasterxml.jackson.annotation.JsonProperty("verified")
        private final boolean verified;

        @com.fasterxml.jackson.annotation.JsonProperty("following")
        private final boolean following;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Person(
                @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("username") String username,
                @com.fasterxml.jackson.annotation.JsonProperty("avatar") String avatar,
                @com.fasterxml.jackson.annotation.JsonProperty("verified") boolean verified,
                @com.fasterxml.jackson.annotation.JsonProperty("following") boolean following) {
            this.id = id;
            this.name = name;
            this.username = username;
            this.avatar = avatar;
            this.verified = verified;
            this.following = following;
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

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        public String getAvatar() {
            return avatar;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("verified")
        public boolean getVerified() {
            return verified;
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
            Person value = (Person) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(username, value.username)
                    && java.util.Objects.equals(avatar, value.avatar)
                    && java.util.Objects.equals(verified, value.verified)
                    && java.util.Objects.equals(following, value.following);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(username);
            result = 31 * result + java.util.Objects.hashCode(avatar);
            result = 31 * result + java.util.Objects.hashCode(verified);
            result = 31 * result + java.util.Objects.hashCode(following);
            return result;
        }

        @Override
        public String toString() {
            return "Person["
                    + "id="
                    + id
                    + ", name="
                    + name
                    + ", username="
                    + username
                    + ", avatar="
                    + avatar
                    + ", verified="
                    + verified
                    + ", following="
                    + following
                    + "]";
        }
    }

    public static final class Connections {

        @com.fasterxml.jackson.annotation.JsonProperty("followers")
        private final List<Person> followers;

        @com.fasterxml.jackson.annotation.JsonProperty("following")
        private final List<Person> following;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Connections(
                @com.fasterxml.jackson.annotation.JsonProperty("followers") List<Person> followers,
                @com.fasterxml.jackson.annotation.JsonProperty("following")
                        List<Person> following) {
            this.followers = followers;
            this.following = following;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("followers")
        public List<Person> getFollowers() {
            return followers;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("following")
        public List<Person> getFollowing() {
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
            Connections value = (Connections) other;
            return java.util.Objects.equals(followers, value.followers)
                    && java.util.Objects.equals(following, value.following);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(followers);
            result = 31 * result + java.util.Objects.hashCode(following);
            return result;
        }

        @Override
        public String toString() {
            return "Connections[" + "followers=" + followers + ", following=" + following + "]";
        }
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<?> connections(@PathVariable long profileId, HttpSession session) {
        long viewerId;
        try {
            viewerId = Long.parseLong(String.valueOf(session.getAttribute("userId")));
        } catch (NumberFormatException ex) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Please sign in to view connections."));
        }
        if (users.byId(viewerId).filter(u -> !u.isSuspended()).isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Please sign in again."));
        }
        if (users.byId(profileId).filter(u -> !u.isSuspended()).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Set<Long> followers = new LinkedHashSet<>();
        Set<Long> following = new LinkedHashSet<>();
        Set<Long> viewerFollowing = new HashSet<>();
        List<String> rows;
        synchronized (store) {
            rows = new ArrayList<>(store.read("follows.txt"));
        }
        for (String row : rows) {
            String[] fields = row.split("\\|", -1);
            if (fields.length != 2) {
                continue;
            }
            try {
                long from = Long.parseLong(fields[0]);
                long to = Long.parseLong(fields[1]);
                if (from <= 0 || to <= 0 || from == to) {
                    continue;
                }
                if (to == profileId) {
                    followers.add(from);
                }
                if (from == profileId) {
                    following.add(to);
                }
                if (from == viewerId) {
                    viewerFollowing.add(to);
                }
            } catch (NumberFormatException ignored) {
                /* Skip an invalid row. */
            }
        }
        return ResponseEntity.ok(
                new Connections(
                        publicPeople(followers, viewerFollowing),
                        publicPeople(following, viewerFollowing)));
    }

    private List<Person> publicPeople(Set<Long> ids, Set<Long> viewerFollowing) {
        List<Person> result = new ArrayList<>();
        for (long id : ids) {
            users.byId(id)
                    .filter(u -> !u.isSuspended())
                    .ifPresent(
                            u ->
                                    result.add(
                                            new Person(
                                                    u.getId(),
                                                    u.getName(),
                                                    u.getUsername(),
                                                    u.getAvatar(),
                                                    u.isVerified(),
                                                    viewerFollowing.contains(id))));
        }
        result.sort(
                Comparator.comparing(
                        p -> p.getName() == null ? "" : p.getName(),
                        String.CASE_INSENSITIVE_ORDER));
        return result;
    }
}

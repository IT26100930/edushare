package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * A durable fan-out alert for subscribers at the moment a resource becomes public. User decisions
 * (unfollow, suspension) are checked again when the feed is displayed.
 */
@Service
public class FollowResourceAlertService {

    private final TextFileStore store;

    private final UserService users;

    private static final String FILE = "follow-resource-alerts.txt";

    public FollowResourceAlertService(TextFileStore store, UserService users) {
        this.store = store;
        this.users = users;
    }

    private String enc(String text) {
        return Base64.getEncoder()
                .encodeToString(Objects.toString(text, "").getBytes(StandardCharsets.UTF_8));
    }

    private String dec(String text) {
        try {
            return new String(Base64.getDecoder().decode(text), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException invalid) {
            return "";
        }
    }

    public static final class FollowerAlert {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final String id;

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        private final String title;

        @com.fasterxml.jackson.annotation.JsonProperty("creatorName")
        private final String creatorName;

        @com.fasterxml.jackson.annotation.JsonProperty("kind")
        private final String kind;

        @com.fasterxml.jackson.annotation.JsonProperty("url")
        private final String url;

        @com.fasterxml.jackson.annotation.JsonProperty("timestamp")
        private final String timestamp;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public FollowerAlert(
                @com.fasterxml.jackson.annotation.JsonProperty("id") String id,
                @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
                @com.fasterxml.jackson.annotation.JsonProperty("creatorName") String creatorName,
                @com.fasterxml.jackson.annotation.JsonProperty("kind") String kind,
                @com.fasterxml.jackson.annotation.JsonProperty("url") String url,
                @com.fasterxml.jackson.annotation.JsonProperty("timestamp") String timestamp) {
            this.id = id;
            this.title = title;
            this.creatorName = creatorName;
            this.kind = kind;
            this.url = url;
            this.timestamp = timestamp;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public String getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        public String getTitle() {
            return title;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("creatorName")
        public String getCreatorName() {
            return creatorName;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("kind")
        public String getKind() {
            return kind;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("url")
        public String getUrl() {
            return url;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("timestamp")
        public String getTimestamp() {
            return timestamp;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            FollowerAlert value = (FollowerAlert) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(title, value.title)
                    && java.util.Objects.equals(creatorName, value.creatorName)
                    && java.util.Objects.equals(kind, value.kind)
                    && java.util.Objects.equals(url, value.url)
                    && java.util.Objects.equals(timestamp, value.timestamp);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(title);
            result = 31 * result + java.util.Objects.hashCode(creatorName);
            result = 31 * result + java.util.Objects.hashCode(kind);
            result = 31 * result + java.util.Objects.hashCode(url);
            result = 31 * result + java.util.Objects.hashCode(timestamp);
            return result;
        }

        @Override
        public String toString() {
            return "FollowerAlert["
                    + "id="
                    + id
                    + ", title="
                    + title
                    + ", creatorName="
                    + creatorName
                    + ", kind="
                    + kind
                    + ", url="
                    + url
                    + ", timestamp="
                    + timestamp
                    + "]";
        }
    }

    /** Safe to invoke more than once. The resource key prevents duplicate alerts. */
    public synchronized void published(
            String resourceKey, String title, String kind, String uploaderEmail) {
        if (resourceKey == null || !resourceKey.matches("backend-(resource|link)-[0-9]+")) {
            return;
        }
        Optional<User> author =
                users.all().stream()
                        .filter(
                                user ->
                                        user.getEmail() != null
                                                && user.getEmail()
                                                        .equalsIgnoreCase(
                                                                Objects.toString(uploaderEmail, ""))
                                                && !user.isSuspended())
                        .findFirst();
        if (author.isEmpty()) {
            return;
        }
        long creator = author.get().getId();
        synchronized (store) {
            List<String> rows = store.read(FILE);
            // A single resource notification event is created only once even if an admin
            // re-approves it.
            if (rows.stream().anyMatch(row -> row.startsWith(resourceKey + "|"))) {
                return;
            }
            Set<Long> followers = new LinkedHashSet<>();
            for (String follow : store.read("follows.txt")) {
                String[] pair = follow.split("\\|", -1);
                if (pair.length != 2 || !pair[1].equals(Long.toString(creator))) {
                    continue;
                }
                try {
                    long follower = Long.parseLong(pair[0]);
                    if (follower != creator
                            && users.byId(follower).filter(u -> !u.isSuspended()).isPresent()) {
                        followers.add(follower);
                    }
                } catch (NumberFormatException ignored) {
                }
            }
            // Even a zero-follower event is recorded: users who follow later cannot receive old
            // alerts.
            rows.add(
                    String.join(
                            "|",
                            resourceKey,
                            Long.toString(creator),
                            enc(title),
                            enc(kind),
                            Instant.now().toString(),
                            followers.stream()
                                    .map(String::valueOf)
                                    .reduce((a, b) -> a + "," + b)
                                    .orElse("")));
            store.write(FILE, rows);
        }
    }

    public List<FollowerAlert> forUser(long recipient) {
        if (recipient <= 0 || users.byId(recipient).filter(u -> !u.isSuspended()).isEmpty()) {
            return List.of();
        }
        List<FollowerAlert> alerts = new ArrayList<>();
        Set<String> following = new HashSet<>();
        for (String row : store.read("follows.txt")) {
            String[] pair = row.split("\\|", -1);
            if (pair.length == 2 && pair[0].equals(Long.toString(recipient))) {
                following.add(pair[1]);
            }
        }
        for (String row : store.read(FILE)) {
            String[] p = row.split("\\|", -1);
            if (p.length != 6
                    || !following.contains(p[1])
                    || !Arrays.asList(p[5].split(",", -1)).contains(Long.toString(recipient))) {
                continue;
            }
            try {
                long authorId = Long.parseLong(p[1]);
                Optional<User> author = users.byId(authorId).filter(u -> !u.isSuspended());
                if (author.isEmpty()) {
                    continue;
                }
                alerts.add(
                        new FollowerAlert(
                                p[0],
                                dec(p[2]),
                                author.get().getName(),
                                dec(p[3]),
                                "/resource/" + p[0],
                                p[4]));
            } catch (NumberFormatException ignored) {
            }
        }
        return alerts;
    }
}

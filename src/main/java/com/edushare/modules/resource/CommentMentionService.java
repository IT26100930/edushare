package com.edushare.modules.resource;

import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class CommentMentionService {

    private final TextFileStore store;

    private final UserService users;

    private final DiscussionAccess access;

    public CommentMentionService(TextFileStore store, UserService users, DiscussionAccess access) {
        this.store = store;
        this.users = users;
        this.access = access;
    }

    public void record(long commentId, long resourceId, long sender, String text) {
        Set<String> handles = new HashSet<>();
        java.util.regex.Matcher match =
                Pattern.compile("(?<![\\w@])@([A-Za-z0-9_]+)").matcher(text);
        while (match.find()) {
            handles.add(match.group(1).toLowerCase(Locale.ROOT));
        }
        synchronized (store) {
            List<String> rows = store.read("comment-mentions.txt");
            for (var user : users.all()) {
                if (user.getId() == sender
                        || user.isSuspended()
                        || user.getUsername() == null
                        || !handles.contains(user.getUsername().toLowerCase(Locale.ROOT))
                        || !access.allowed(resourceId, user.getId())) {
                    continue;
                }
                rows.add(
                        commentId
                                + "|"
                                + user.getId()
                                + "|"
                                + resourceId
                                + "|"
                                + sender
                                + "|"
                                + Instant.now());
            }
            store.write("comment-mentions.txt", rows);
        }
    }

    public static final class Mention {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final String id;

        @com.fasterxml.jackson.annotation.JsonProperty("sender")
        private final String sender;

        @com.fasterxml.jackson.annotation.JsonProperty("url")
        private final String url;

        @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
        private final String createdAt;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Mention(
                @com.fasterxml.jackson.annotation.JsonProperty("id") String id,
                @com.fasterxml.jackson.annotation.JsonProperty("sender") String sender,
                @com.fasterxml.jackson.annotation.JsonProperty("url") String url,
                @com.fasterxml.jackson.annotation.JsonProperty("createdAt") String createdAt) {
            this.id = id;
            this.sender = sender;
            this.url = url;
            this.createdAt = createdAt;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public String getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("sender")
        public String getSender() {
            return sender;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("url")
        public String getUrl() {
            return url;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("createdAt")
        public String getCreatedAt() {
            return createdAt;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Mention value = (Mention) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(sender, value.sender)
                    && java.util.Objects.equals(url, value.url)
                    && java.util.Objects.equals(createdAt, value.createdAt);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(sender);
            result = 31 * result + java.util.Objects.hashCode(url);
            result = 31 * result + java.util.Objects.hashCode(createdAt);
            return result;
        }

        @Override
        public String toString() {
            return "Mention["
                    + "id="
                    + id
                    + ", sender="
                    + sender
                    + ", url="
                    + url
                    + ", createdAt="
                    + createdAt
                    + "]";
        }
    }

    public List<Mention> forUser(long recipient) {
        List<Mention> result = new ArrayList<>();
        Set<String> existing = new HashSet<>();
        for (String row : store.read("resource-comments.txt")) {
            existing.add(row.split("\\|", 2)[0]);
        }
        for (String row : store.read("comment-mentions.txt")) {
            String[] p = row.split("\\|", -1);
            try {
                if (p.length != 5
                        || !p[1].equals(Long.toString(recipient))
                        || !existing.contains(p[0])) {
                    continue;
                }
                long resourceId = Long.parseLong(p[2]);
                if (!access.allowed(resourceId, recipient)) {
                    continue;
                }
                String sender =
                        users.byId(Long.parseLong(p[3]))
                                .map(u -> "@" + u.getUsername())
                                .orElse("A member");
                String key =
                        resourceId < 0
                                ? "backend-link-" + (-resourceId)
                                : "backend-resource-" + resourceId;
                result.add(
                        new Mention(
                                "mention-" + p[0],
                                sender,
                                "/resource/" + key + "?discussion=1#comment-" + p[0],
                                p[4]));
            } catch (NumberFormatException ignored) {
            }
        }
        return result;
    }
}

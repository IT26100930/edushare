package com.edushare.modules.resource;

import com.edushare.modules.user.User;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

/** Real resource discussions persisted as text records. */
@RestController
@RequestMapping("/api/resource-comments")
public class ResourceCommentController {

    private static final String COMMENTS = "resource-comments.txt";

    private static final String LIKES = "resource-comment-likes.txt";

    private final TextFileStore store;

    private final UserService users;

    private final DiscussionAccess access;

    private final CommentMentionService mentions;

    public ResourceCommentController(
            TextFileStore store,
            UserService users,
            DiscussionAccess access,
            CommentMentionService mentions) {
        this.store = store;
        this.users = users;
        this.access = access;
        this.mentions = mentions;
    }

    private Long currentUserId(HttpSession session) {
        Object raw = session.getAttribute("userId");
        if (raw == null) {
            return null;
        }
        long id;
        try {
            id = Long.parseLong(raw.toString());
        } catch (NumberFormatException e) {
            return null;
        }
        return users.byId(id).filter(u -> !u.isSuspended()).map(User::getId).orElse(null);
    }

    public static final class CommentRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("text")
        private final String text;

        @com.fasterxml.jackson.annotation.JsonProperty("parentId")
        private final Long parentId;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public CommentRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("text") String text,
                @com.fasterxml.jackson.annotation.JsonProperty("parentId") Long parentId) {
            this.text = text;
            this.parentId = parentId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("text")
        public String getText() {
            return text;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("parentId")
        public Long getParentId() {
            return parentId;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            CommentRequest value = (CommentRequest) other;
            return java.util.Objects.equals(text, value.text)
                    && java.util.Objects.equals(parentId, value.parentId);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(text);
            result = 31 * result + java.util.Objects.hashCode(parentId);
            return result;
        }

        @Override
        public String toString() {
            return "CommentRequest[" + "text=" + text + ", parentId=" + parentId + "]";
        }
    }

    public static final class LikeResult {

        @com.fasterxml.jackson.annotation.JsonProperty("liked")
        private final boolean liked;

        @com.fasterxml.jackson.annotation.JsonProperty("count")
        private final long count;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public LikeResult(
                @com.fasterxml.jackson.annotation.JsonProperty("liked") boolean liked,
                @com.fasterxml.jackson.annotation.JsonProperty("count") long count) {
            this.liked = liked;
            this.count = count;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("liked")
        public boolean getLiked() {
            return liked;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("count")
        public long getCount() {
            return count;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            LikeResult value = (LikeResult) other;
            return java.util.Objects.equals(liked, value.liked)
                    && java.util.Objects.equals(count, value.count);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(liked);
            result = 31 * result + java.util.Objects.hashCode(count);
            return result;
        }

        @Override
        public String toString() {
            return "LikeResult[" + "liked=" + liked + ", count=" + count + "]";
        }
    }

    private static final class Row {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final long id;

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        private final long resourceId;

        @com.fasterxml.jackson.annotation.JsonProperty("parentId")
        private final long parentId;

        @com.fasterxml.jackson.annotation.JsonProperty("authorId")
        private final long authorId;

        @com.fasterxml.jackson.annotation.JsonProperty("text")
        private final String text;

        @com.fasterxml.jackson.annotation.JsonProperty("date")
        private final String date;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Row(
                @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
                @com.fasterxml.jackson.annotation.JsonProperty("resourceId") long resourceId,
                @com.fasterxml.jackson.annotation.JsonProperty("parentId") long parentId,
                @com.fasterxml.jackson.annotation.JsonProperty("authorId") long authorId,
                @com.fasterxml.jackson.annotation.JsonProperty("text") String text,
                @com.fasterxml.jackson.annotation.JsonProperty("date") String date) {
            this.id = id;
            this.resourceId = resourceId;
            this.parentId = parentId;
            this.authorId = authorId;
            this.text = text;
            this.date = date;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public long getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        public long getResourceId() {
            return resourceId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("parentId")
        public long getParentId() {
            return parentId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("authorId")
        public long getAuthorId() {
            return authorId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("text")
        public String getText() {
            return text;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("date")
        public String getDate() {
            return date;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Row value = (Row) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(resourceId, value.resourceId)
                    && java.util.Objects.equals(parentId, value.parentId)
                    && java.util.Objects.equals(authorId, value.authorId)
                    && java.util.Objects.equals(text, value.text)
                    && java.util.Objects.equals(date, value.date);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(resourceId);
            result = 31 * result + java.util.Objects.hashCode(parentId);
            result = 31 * result + java.util.Objects.hashCode(authorId);
            result = 31 * result + java.util.Objects.hashCode(text);
            result = 31 * result + java.util.Objects.hashCode(date);
            return result;
        }

        @Override
        public String toString() {
            return "Row["
                    + "id="
                    + id
                    + ", resourceId="
                    + resourceId
                    + ", parentId="
                    + parentId
                    + ", authorId="
                    + authorId
                    + ", text="
                    + text
                    + ", date="
                    + date
                    + "]";
        }
    }

    private List<Row> readAll() {
        List<Row> rows = new ArrayList<>();
        for (String line : store.read(COMMENTS)) {
            String[] p = line.split("\\|", -1);
            if (p.length < 6) {
                continue;
            }
            try {
                rows.add(
                        new Row(
                                Long.parseLong(p[0]),
                                Long.parseLong(p[1]),
                                Long.parseLong(p[2]),
                                Long.parseLong(p[3]),
                                p[4],
                                p[5]));
            } catch (NumberFormatException ignored) {
            }
        }
        return rows;
    }

    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<?> list(@PathVariable long resourceId, HttpSession session) {
        Long current = currentUserId(session);
        if (current == null) {
            return ResponseEntity.status(401).build();
        }
        if (!access.allowed(resourceId, current)) {
            return ResponseEntity.notFound().build();
        }
        List<Row> all = readAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Row row : all) {
            if (row.resourceId == resourceId && row.parentId == 0) {
                result.add(view(row, all, current));
            }
        }
        Collections.reverse(result);
        return ResponseEntity.ok(result);
    }

    private Map<String, Object> view(Row row, List<Row> all, long viewer) {
        User author = users.byId(row.authorId).orElse(null);
        List<Map<String, Object>> replies = new ArrayList<>();
        for (Row child : all) {
            if (child.parentId == row.id && child.resourceId == row.resourceId) {
                replies.add(view(child, List.of(), viewer));
            }
        }
        Set<Long> likes = likesFor(row.id);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", "comment-" + row.id);
        data.put("authorId", "backend-user-" + row.authorId);
        data.put("authorName", author == null ? "Former member" : safe(author.getName()));
        data.put("authorUsername", author == null ? "" : safe(author.getUsername()));
        data.put("authorAvatar", author == null ? "" : safe(author.getAvatar()));
        data.put("university", author == null ? "" : safe(author.getUniversity()));
        data.put("isVerified", author != null && author.isVerified());
        data.put("content", row.text);
        data.put("createdAt", row.date);
        data.put("likes", likes.size());
        data.put("likedByMe", likes.contains(viewer));
        data.put("replies", replies);
        return data;
    }

    @PostMapping("/resource/{resourceId}")
    public ResponseEntity<?> create(
            @PathVariable long resourceId,
            @RequestBody CommentRequest request,
            HttpSession session) {
        Long userId = currentUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        if (!access.allowed(resourceId, userId)) {
            return ResponseEntity.notFound().build();
        }
        if (request == null
                || request.getText() == null
                || request.getText().isBlank()
                || request.getText().length() > 1500) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Write a comment under 1500 characters."));
        }
        long parent = request.getParentId() == null ? 0 : request.getParentId();
        if (parent != 0
                && readAll().stream()
                        .noneMatch(
                                r ->
                                        r.id == parent
                                                && r.resourceId == resourceId
                                                && r.parentId == 0)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Parent comment not found."));
        }
        synchronized (store) {
            List<String> lines = store.read(COMMENTS);
            long id = store.nextId(lines);
            lines.add(
                    id
                            + "|"
                            + resourceId
                            + "|"
                            + parent
                            + "|"
                            + userId
                            + "|"
                            + TextFileStore.clean(request.getText())
                            + "|"
                            + Instant.now());
            store.write(COMMENTS, lines);
            mentions.record(id, resourceId, userId, request.getText());
            return ResponseEntity.ok(Map.of("id", "comment-" + id));
        }
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<?> edit(
            @PathVariable long commentId,
            @RequestBody CommentRequest request,
            HttpSession session) {
        Long userId = currentUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        if (request == null
                || request.getText() == null
                || request.getText().isBlank()
                || request.getText().length() > 1500) {
            return ResponseEntity.badRequest().build();
        }
        Row row = readAll().stream().filter(r -> r.id == commentId).findFirst().orElse(null);
        if (row == null || !access.allowed(row.resourceId, userId)) {
            return ResponseEntity.notFound().build();
        }
        if (row.authorId != userId) {
            return ResponseEntity.status(403).build();
        }
        synchronized (store) {
            List<String> lines = store.read(COMMENTS);
            lines.replaceAll(
                    line ->
                            line.startsWith(commentId + "|")
                                    ? row.id
                                            + "|"
                                            + row.resourceId
                                            + "|"
                                            + row.parentId
                                            + "|"
                                            + row.authorId
                                            + "|"
                                            + TextFileStore.clean(request.getText())
                                            + "|"
                                            + row.date
                                    : line);
            store.write(COMMENTS, lines);
        }
        return ResponseEntity.ok(Map.of("updated", true));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> delete(@PathVariable long commentId, HttpSession session) {
        Long userId = currentUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        Row row = readAll().stream().filter(r -> r.id == commentId).findFirst().orElse(null);
        if (row == null || !access.allowed(row.resourceId, userId)) {
            return ResponseEntity.notFound().build();
        }
        boolean admin = users.byId(userId).map(u -> "ADMIN".equals(u.getRole())).orElse(false);
        if (!admin && row.authorId != userId) {
            return ResponseEntity.status(403).build();
        }
        synchronized (store) {
            List<String> lines = store.read(COMMENTS);
            Set<Long> removed = new HashSet<>();
            removed.add(commentId);
            for (Row child : readAll()) {
                if (child.parentId == commentId) {
                    removed.add(child.id);
                }
            }
            lines.removeIf(
                    line -> {
                        String[] p = line.split("\\|", 2);
                        try {
                            return removed.contains(Long.parseLong(p[0]));
                        } catch (NumberFormatException ignored) {
                            return false;
                        }
                    });
            store.write(COMMENTS, lines);
            List<String> likes = store.read(LIKES);
            likes.removeIf(
                    line -> {
                        String[] p = line.split("\\|", 2);
                        try {
                            return removed.contains(Long.parseLong(p[0]));
                        } catch (NumberFormatException ignored) {
                            return false;
                        }
                    });
            store.write(LIKES, likes);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<?> like(@PathVariable long commentId, HttpSession session) {
        Long userId = currentUserId(session);
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }
        Row row = readAll().stream().filter(r -> r.id == commentId).findFirst().orElse(null);
        if (row == null || !access.allowed(row.resourceId, userId)) {
            return ResponseEntity.notFound().build();
        }
        synchronized (store) {
            List<String> lines = store.read(LIKES);
            String entry = commentId + "|" + userId;
            boolean liked;
            if (lines.contains(entry)) {
                lines.removeIf(line -> line.equals(entry));
                liked = false;
            } else {
                lines.add(entry);
                liked = true;
            }
            store.write(LIKES, lines);
            return ResponseEntity.ok(new LikeResult(liked, likesFor(commentId).size()));
        }
    }

    private Set<Long> likesFor(long commentId) {
        Set<Long> users = new HashSet<>();
        for (String line : store.read(LIKES)) {
            String[] p = line.split("\\|", -1);
            if (p.length >= 2) {
                try {
                    if (Long.parseLong(p[0]) == commentId) users.add(Long.parseLong(p[1]));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return users;
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }
}

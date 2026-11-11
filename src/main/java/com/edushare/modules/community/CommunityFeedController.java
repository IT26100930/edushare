package com.edushare.modules.community;

import com.edushare.modules.user.User;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** A file-backed community feed. No sample posts or fabricated counters. */
@RestController
@RequestMapping("/api/community/posts")
public class CommunityFeedController {

    private static final String POSTS = "community-posts.txt";

    private static final String COMMENTS = "community-comments.txt";

    private static final String LIKES = "community-likes.txt";

    private static final String BOOKMARKS = "community-saved-posts.txt";

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final TextFileStore store;

    private final UserService users;

    public CommunityFeedController(TextFileStore store, UserService users) {
        this.store = store;
        this.users = users;
    }

    private Long currentId(HttpSession session) {
        Object value = session.getAttribute("userId");
        if (value == null) {
            return null;
        }
        long id = Long.parseLong(value.toString());
        return users.byId(id).filter(u -> !u.isSuspended()).map(User::getId).orElse(null);
    }

    public static final class CreatePost {

        @com.fasterxml.jackson.annotation.JsonProperty("type")
        private final String type;

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        private final String title;

        @com.fasterxml.jackson.annotation.JsonProperty("content")
        private final String content;

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        private final String moduleCode;

        @com.fasterxml.jackson.annotation.JsonProperty("videoUrl")
        private final String videoUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("tags")
        private final String tags;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public CreatePost(
                @com.fasterxml.jackson.annotation.JsonProperty("type") String type,
                @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
                @com.fasterxml.jackson.annotation.JsonProperty("content") String content,
                @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode,
                @com.fasterxml.jackson.annotation.JsonProperty("videoUrl") String videoUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("tags") String tags) {
            this.type = type;
            this.title = title;
            this.content = content;
            this.moduleCode = moduleCode;
            this.videoUrl = videoUrl;
            this.tags = tags;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("type")
        public String getType() {
            return type;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        public String getTitle() {
            return title;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("content")
        public String getContent() {
            return content;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        public String getModuleCode() {
            return moduleCode;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("videoUrl")
        public String getVideoUrl() {
            return videoUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("tags")
        public String getTags() {
            return tags;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            CreatePost value = (CreatePost) other;
            return java.util.Objects.equals(type, value.type)
                    && java.util.Objects.equals(title, value.title)
                    && java.util.Objects.equals(content, value.content)
                    && java.util.Objects.equals(moduleCode, value.moduleCode)
                    && java.util.Objects.equals(videoUrl, value.videoUrl)
                    && java.util.Objects.equals(tags, value.tags);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(type);
            result = 31 * result + java.util.Objects.hashCode(title);
            result = 31 * result + java.util.Objects.hashCode(content);
            result = 31 * result + java.util.Objects.hashCode(moduleCode);
            result = 31 * result + java.util.Objects.hashCode(videoUrl);
            result = 31 * result + java.util.Objects.hashCode(tags);
            return result;
        }

        @Override
        public String toString() {
            return "CreatePost["
                    + "type="
                    + type
                    + ", title="
                    + title
                    + ", content="
                    + content
                    + ", moduleCode="
                    + moduleCode
                    + ", videoUrl="
                    + videoUrl
                    + ", tags="
                    + tags
                    + "]";
        }
    }

    public static final class AddComment {

        @com.fasterxml.jackson.annotation.JsonProperty("text")
        private final String text;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public AddComment(@com.fasterxml.jackson.annotation.JsonProperty("text") String text) {
            this.text = text;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("text")
        public String getText() {
            return text;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            AddComment value = (AddComment) other;
            return java.util.Objects.equals(text, value.text);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(text);
            return result;
        }

        @Override
        public String toString() {
            return "AddComment[" + "text=" + text + "]";
        }
    }

    public static final class ToggleResult {

        @com.fasterxml.jackson.annotation.JsonProperty("enabled")
        private final boolean enabled;

        @com.fasterxml.jackson.annotation.JsonProperty("count")
        private final long count;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public ToggleResult(
                @com.fasterxml.jackson.annotation.JsonProperty("enabled") boolean enabled,
                @com.fasterxml.jackson.annotation.JsonProperty("count") long count) {
            this.enabled = enabled;
            this.count = count;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("enabled")
        public boolean getEnabled() {
            return enabled;
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
            ToggleResult value = (ToggleResult) other;
            return java.util.Objects.equals(enabled, value.enabled)
                    && java.util.Objects.equals(count, value.count);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(enabled);
            result = 31 * result + java.util.Objects.hashCode(count);
            return result;
        }

        @Override
        public String toString() {
            return "ToggleResult[" + "enabled=" + enabled + ", count=" + count + "]";
        }
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> list(HttpSession session) {
        Long id = currentId(session);
        if (id == null) {
            return ResponseEntity.status(401).build();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (String line : store.read(POSTS)) {
            String[] p = line.split("\\|", -1);
            if (p.length < 9) {
                continue;
            }
            long authorId = parseId(p[1]);
            User author = users.byId(authorId).orElse(null);
            if (author == null) {
                continue;
            }
            long postId = parseId(p[0]);
            List<Map<String, Object>> comments = commentsFor(postId);
            Set<Long> likes = members(LIKES, postId);
            Set<Long> saves = members(BOOKMARKS, postId);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", "post-" + postId);
            item.put(
                    "canManage",
                    id == authorId
                            || users.byId(id).map(u -> "ADMIN".equals(u.getRole())).orElse(false));
            item.put("type", p[2]);
            item.put("title", p[4]);
            item.put("content", p[5]);
            item.put("moduleCode", p[3]);
            item.put("timestamp", p[8]);
            item.put(
                    "author",
                    Map.of(
                            "name",
                            safe(author.getName()),
                            "username",
                            safe(author.getUsername()),
                            "avatar",
                            safe(author.getAvatar()),
                            "university",
                            safe(author.getUniversity()),
                            "batch",
                            safe(author.getBatch()),
                            "isVerified",
                            author.isVerified()));
            item.put("upvotes", likes.size());
            item.put("isUpvoted", likes.contains(id));
            item.put("isSaved", saves.contains(id));
            item.put("comments", comments);
            item.put("commentsCount", comments.size());
            item.put(
                    "tags",
                    p[6].isBlank()
                            ? List.of()
                            : Arrays.stream(p[6].split(",")).filter(v -> !v.isBlank()).toList());
            if (!p[7].isBlank()
                    && (p[7].startsWith("https://www.youtube.com/")
                            || p[7].startsWith("https://youtu.be/"))) {
                item.put(
                        "videoData",
                        Map.of(
                                "url",
                                p[7],
                                "videoId",
                                youtubeId(p[7]),
                                "duration",
                                "",
                                "thumbnail",
                                ""));
            }
            result.add(item);
        }
        Collections.reverse(result);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreatePost request, HttpSession session) {
        Long id = currentId(session);
        if (id == null) {
            return ResponseEntity.status(401).build();
        }
        String invalid = validate(request);
        if (invalid != null) {
            return ResponseEntity.badRequest().body(Map.of("error", invalid));
        }
        String video = safe(request.getVideoUrl()).trim();
        synchronized (store) {
            List<String> lines = store.read(POSTS);
            long postId =
                    Math.max(
                            store.nextId(lines),
                            store.nextId(store.read("community-post-sequence.txt")));
            store.write("community-post-sequence.txt", List.of(String.valueOf(postId)));
            lines.add(
                    postId
                            + "|"
                            + id
                            + "|"
                            + request.getType()
                            + "|"
                            + TextFileStore.clean(request.getModuleCode())
                            + "|"
                            + TextFileStore.clean(request.getTitle())
                            + "|"
                            + TextFileStore.clean(request.getContent())
                            + "|"
                            + TextFileStore.clean(request.getTags())
                            + "|"
                            + TextFileStore.clean(video)
                            + "|"
                            + LocalDateTime.now().format(DATE_FORMAT));
            store.write(POSTS, lines);
            return ResponseEntity.ok(Map.of("id", "post-" + postId));
        }
    }

    private String validate(CreatePost r) {
        if (r == null
                || isBlank(r.getTitle())
                || isBlank(r.getContent())
                || isBlank(r.getModuleCode())) {
            return "Title, message and module are required.";
        }
        if (r.getTitle().length() > 160
                || r.getContent().length() > 5000
                || r.getModuleCode().length() > 40
                || safe(r.getTags()).length() > 500) {
            return "Post text is too long.";
        }
        if (!Set.of("Question", "Tip", "Resource share", "Video share")
                .contains(safe(r.getType()))) {
            return "Choose a valid post type.";
        }
        String video = safe(r.getVideoUrl()).trim();
        if (!video.isEmpty()
                && !(video.startsWith("https://www.youtube.com/")
                        || video.startsWith("https://youtu.be/"))) {
            return "Use a YouTube link.";
        }
        return null;
    }

    @PutMapping("/{postId}")
    public ResponseEntity<?> update(
            @PathVariable long postId, @RequestBody CreatePost request, HttpSession s) {
        Long uid = currentId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        String invalid = validate(request);
        if (invalid != null) {
            return ResponseEntity.badRequest().body(Map.of("error", invalid));
        }
        synchronized (store) {
            List<String> rows = store.read(POSTS);
            for (int i = 0; i < rows.size(); i++) {
                String[] old = rows.get(i).split("\\|", -1);
                if (old.length < 9 || parseId(old[0]) != postId) {
                    continue;
                }
                if (parseId(old[1]) != uid
                        && !users.byId(uid).map(u -> "ADMIN".equals(u.getRole())).orElse(false)) {
                    return ResponseEntity.status(403).build();
                }
                rows.set(
                        i,
                        old[0]
                                + "|"
                                + old[1]
                                + "|"
                                + request.getType()
                                + "|"
                                + TextFileStore.clean(request.getModuleCode())
                                + "|"
                                + TextFileStore.clean(request.getTitle())
                                + "|"
                                + TextFileStore.clean(request.getContent())
                                + "|"
                                + TextFileStore.clean(request.getTags())
                                + "|"
                                + TextFileStore.clean(request.getVideoUrl())
                                + "|"
                                + old[8]);
                store.write(POSTS, rows);
                return ResponseEntity.ok(Map.of("id", "post-" + postId));
            }
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> delete(@PathVariable long postId, HttpSession s) {
        Long uid = currentId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        synchronized (store) {
            List<String> rows = store.read(POSTS);
            String[] found =
                    rows.stream()
                            .map(row -> row.split("\\|", -1))
                            .filter(row -> row.length >= 9 && parseId(row[0]) == postId)
                            .findFirst()
                            .orElse(null);
            if (found == null) {
                return ResponseEntity.notFound().build();
            }
            if (parseId(found[1]) != uid
                    && !users.byId(uid).map(u -> "ADMIN".equals(u.getRole())).orElse(false)) {
                return ResponseEntity.status(403).build();
            }
            store.write(
                    "community-post-sequence.txt",
                    List.of(
                            String.valueOf(
                                    Math.max(
                                            postId,
                                            Math.max(
                                                    store.nextId(store.read(POSTS)) - 1,
                                                    store.nextId(
                                                                    store.read(
                                                                            "community-post-sequence.txt"))
                                                            - 1)))));
            rows.removeIf(row -> row.startsWith(postId + "|"));
            store.write(POSTS, rows);
            for (String file : List.of(LIKES, BOOKMARKS, COMMENTS)) {
                List<String> related = store.read(file);
                related.removeIf(
                        row -> {
                            String[] cols = row.split("\\|", -1);
                            return cols.length > 1
                                    && parseId(cols[file.equals(COMMENTS) ? 1 : 0]) == postId;
                        });
                store.write(file, related);
            }
            return ResponseEntity.noContent().build();
        }
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> like(@PathVariable long postId, HttpSession session) {
        return toggle(LIKES, postId, session);
    }

    @PostMapping("/{postId}/bookmark")
    public ResponseEntity<?> bookmark(@PathVariable long postId, HttpSession session) {
        return toggle(BOOKMARKS, postId, session);
    }

    private ResponseEntity<?> toggle(String file, long postId, HttpSession session) {
        Long id = currentId(session);
        if (id == null) {
            return ResponseEntity.status(401).build();
        }
        if (!exists(postId)) {
            return ResponseEntity.notFound().build();
        }
        synchronized (store) {
            List<String> lines = store.read(file);
            String entry = postId + "|" + id;
            boolean enabled;
            if (lines.contains(entry)) {
                lines.removeIf(line -> line.equals(entry));
                enabled = false;
            } else {
                lines.add(entry);
                enabled = true;
            }
            store.write(file, lines);
            return ResponseEntity.ok(new ToggleResult(enabled, members(file, postId).size()));
        }
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable long postId, @RequestBody AddComment request, HttpSession session) {
        Long id = currentId(session);
        if (id == null) {
            return ResponseEntity.status(401).build();
        }
        if (!exists(postId)) {
            return ResponseEntity.notFound().build();
        }
        if (request == null || isBlank(request.getText()) || request.getText().length() > 1500) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Write a comment under 1500 characters."));
        }
        synchronized (store) {
            List<String> lines = store.read(COMMENTS);
            long commentId = store.nextId(lines);
            lines.add(
                    commentId
                            + "|"
                            + postId
                            + "|"
                            + id
                            + "|"
                            + TextFileStore.clean(request.getText())
                            + "|"
                            + LocalDateTime.now().format(DATE_FORMAT));
            store.write(COMMENTS, lines);
        }
        return ResponseEntity.ok(Map.of("saved", true));
    }

    private boolean exists(long postId) {
        return store.read(POSTS).stream().anyMatch(line -> line.startsWith(postId + "|"));
    }

    private Set<Long> members(String file, long postId) {
        Set<Long> result = new HashSet<>();
        for (String line : store.read(file)) {
            String[] p = line.split("\\|", -1);
            if (p.length >= 2 && parseId(p[0]) == postId) {
                result.add(parseId(p[1]));
            }
        }
        return result;
    }

    private List<Map<String, Object>> commentsFor(long postId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String line : store.read(COMMENTS)) {
            String[] p = line.split("\\|", -1);
            if (p.length < 5 || parseId(p[1]) != postId) {
                continue;
            }
            User user = users.byId(parseId(p[2])).orElse(null);
            if (user == null) {
                continue;
            }
            result.add(
                    Map.of(
                            "id",
                            "comment-" + p[0],
                            "authorName",
                            safe(user.getName()),
                            "authorUsername",
                            safe(user.getUsername()),
                            "authorAvatar",
                            safe(user.getAvatar()),
                            "authorUniversity",
                            safe(user.getUniversity()),
                            "text",
                            p[3],
                            "timestamp",
                            p[4],
                            "likes",
                            0));
        }
        return result;
    }

    private static String youtubeId(String url) {
        try {
            String value =
                    url.contains("v=")
                            ? url.substring(url.indexOf("v=") + 2)
                            : url.substring(url.lastIndexOf('/') + 1);
            return value.split("[&?#]")[0];
        } catch (RuntimeException ex) {
            return "";
        }
    }

    private static long parseId(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private static String safe(String value) {
        return value == null ? "" : value;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

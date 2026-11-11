package com.edushare.modules.community;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Repository
public class StudyGroupFileRepository {

    private static final String GROUPS = "study-groups.txt",
            MEMBERS = "study-group-members.txt",
            POSTS = "study-group-posts.txt";

    private final TextFileStore store;

    public StudyGroupFileRepository(TextFileStore store) {
        this.store = store;
        // No example records are created on startup.
    }

    public List<StudyGroup> findAll() {
        List<StudyGroup> results = new ArrayList<>();
        for (String item : store.read(GROUPS)) {
            if (!(!item.isBlank())) {
                continue;
            }
            results.add(this.groupFrom(item));
        }
        return Collections.unmodifiableList(results);
    }

    /** Persist a new circle using the existing file format; creator joins automatically. */
    public synchronized StudyGroup create(
            String name,
            String moduleCode,
            String schedule,
            String description,
            String badgeColor,
            String meetingUrl,
            long creatorId) {
        List<String> lines = new ArrayList<>(store.read(GROUPS));
        long id = store.nextId(lines);
        StudyGroup group = new StudyGroup(id, name, moduleCode, schedule, description, badgeColor);
        lines.add(
                id
                        + "|"
                        + TextFileStore.clean(name)
                        + "|"
                        + TextFileStore.clean(moduleCode)
                        + "|"
                        + TextFileStore.clean(schedule)
                        + "|"
                        + TextFileStore.clean(description)
                        + "|"
                        + TextFileStore.clean(badgeColor)
                        + "|"
                        + TextFileStore.clean(meetingUrl)
                        + "|"
                        + creatorId);
        store.write(GROUPS, lines);
        join(id, creatorId);
        return group;
    }

    /** Older rows contain six fields; new rows contain URL and creator ID. */
    public String meetingUrl(long groupId) {
        for (String line : store.read(GROUPS)) {
            String[] fields = line.split("\\|", -1);
            if (fields.length >= 7 && fields[0].equals(Long.toString(groupId))) {
                return fields[6];
            }
        }
        return "";
    }

    public long creatorId(long groupId) {
        for (String line : store.read(GROUPS)) {
            String[] fields = line.split("\\|", -1);
            if (fields.length >= 8 && fields[0].equals(Long.toString(groupId))) {
                try {
                    return Long.parseLong(fields[7]);
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return -1L;
    }

    public synchronized boolean updateMeeting(long groupId, String schedule, String meetingUrl) {
        List<String> lines = new ArrayList<>(store.read(GROUPS));
        for (int i = 0; i < lines.size(); i++) {
            String[] parts = lines.get(i).split("\\|", -1);
            if (parts.length < 6 || !parts[0].equals(Long.toString(groupId))) {
                continue;
            }
            String creator = parts.length >= 8 ? parts[7] : "";
            lines.set(
                    i,
                    String.join(
                            "|",
                            parts[0],
                            parts[1],
                            parts[2],
                            TextFileStore.clean(schedule),
                            parts[4],
                            parts[5],
                            TextFileStore.clean(meetingUrl),
                            creator));
            store.write(GROUPS, lines);
            return true;
        }
        return false;
    }

    public synchronized boolean updateDetails(
            long groupId, String name, String moduleCode, String description) {
        List<String> lines = new ArrayList<>(store.read(GROUPS));
        for (int i = 0; i < lines.size(); i++) {
            String[] parts = lines.get(i).split("\\|", -1);
            if (parts.length < 6 || !parts[0].equals(Long.toString(groupId))) {
                continue;
            }
            parts[1] = TextFileStore.clean(name);
            parts[2] = TextFileStore.clean(moduleCode);
            parts[4] = TextFileStore.clean(description);
            lines.set(i, String.join("|", parts));
            store.write(GROUPS, lines);
            return true;
        }
        return false;
    }

    /** Remove a circle and its memberships and discussion posts, preserving other groups. */
    public synchronized boolean deleteCircle(long groupId) {
        String target = Long.toString(groupId);
        List<String> currentGroups = new ArrayList<>(store.read(GROUPS));
        List<String> currentMembers = new ArrayList<>(store.read(MEMBERS));
        List<String> currentPosts = new ArrayList<>(store.read(POSTS));
        List<String> updatedGroups = new ArrayList<>(currentGroups);
        boolean removed = false;
        {
            java.util.Iterator<String> iterator = updatedGroups.iterator();
            while (iterator.hasNext()) {
                String line = iterator.next();
                if (firstFieldIs(line, target)) {
                    iterator.remove();
                    removed = true;
                }
            }
        }
        if (!removed) {
            return false;
        }
        List<String> updatedMembers = new ArrayList<>(currentMembers);
        {
            java.util.Iterator<String> iterator = updatedMembers.iterator();
            while (iterator.hasNext()) {
                String line = iterator.next();
                if (firstFieldIs(line, target)) {
                    iterator.remove();
                }
            }
        }
        List<String> updatedPosts = new ArrayList<>(currentPosts);
        {
            java.util.Iterator<String> iterator = updatedPosts.iterator();
            while (iterator.hasNext()) {
                String line = iterator.next();
                if (secondFieldIs(line, target)) {
                    iterator.remove();
                }
            }
        }
        // Write dependent data first so deleted groups leave no active orphan records.
        // The underlying TextFileStore performs atomic writes per file.
        store.write(MEMBERS, updatedMembers);
        store.write(POSTS, updatedPosts);
        store.write(GROUPS, updatedGroups);
        return true;
    }

    /** Delete one message from a specified circle; do not affect other circles. */
    public synchronized boolean deletePost(long groupId, long postId) {
        List<String> records = new ArrayList<>(store.read(POSTS));
        boolean removed =
                records.removeIf(
                        line -> {
                            String[] parts = line.split("\\|", -1);
                            return parts.length >= 2
                                    && parts[0].equals(Long.toString(postId))
                                    && parts[1].equals(Long.toString(groupId));
                        });
        if (removed) {
            store.write(POSTS, records);
        }
        return removed;
    }

    private static boolean firstFieldIs(String line, String target) {
        if (line == null) {
            return false;
        }
        int separator = line.indexOf('|');
        return separator >= 0 && line.substring(0, separator).equals(target);
    }

    private static boolean secondFieldIs(String line, String target) {
        if (line == null) {
            return false;
        }
        int first = line.indexOf('|');
        if (first < 0) {
            return false;
        }
        int second = line.indexOf('|', first + 1);
        return second > first && line.substring(first + 1, second).equals(target);
    }

    public Optional<StudyGroup> findById(long id) {
        for (StudyGroup item : findAll()) {
            if (!(item.getId() == id)) {
                continue;
            }
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public Set<Long> members(long groupId) {
        Set<Long> out = new LinkedHashSet<>();
        for (String line : store.read(MEMBERS)) {
            String[] p = line.split("\\|", -1);
            if (p.length > 1 && Long.parseLong(p[0]) == groupId) {
                out.add(Long.parseLong(p[1]));
            }
        }
        return out;
    }

    public boolean isMember(long groupId, long userId) {
        return members(groupId).contains(userId);
    }

    public void join(long groupId, long userId) {
        if (isMember(groupId, userId)) {
            return;
        }
        List<String> a = new ArrayList<>(store.read(MEMBERS));
        a.add(groupId + "|" + userId);
        store.write(MEMBERS, a);
    }

    public void leave(long groupId, long userId) {
        List<String> a = new ArrayList<>(store.read(MEMBERS));
        {
            java.util.Iterator<String> iterator = a.iterator();
            while (iterator.hasNext()) {
                String x = iterator.next();
                if (x.equals(groupId + "|" + userId)) {
                    iterator.remove();
                }
            }
        }
        store.write(MEMBERS, a);
    }

    public List<GroupPost> posts(long groupId) {
        return store.read(POSTS).stream()
                .filter(s -> !s.isBlank())
                .map(this::postFrom)
                .filter(p -> p.getGroupId() == groupId)
                .sorted(Comparator.comparingLong(GroupPost::getId).reversed())
                .toList();
    }

    public GroupPost addPost(
            long groupId, long userId, String authorName, String message, String resourceUrl) {
        List<String> a = new ArrayList<>(store.read(POSTS));
        long id = store.nextId(a);
        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        GroupPost p = new GroupPost(id, groupId, userId, authorName, message, resourceUrl, now);
        a.add(toPost(p));
        store.write(POSTS, a);
        return p;
    }

    private StudyGroup groupFrom(String line) {
        String[] p = line.split("\\|", -1);
        return new StudyGroup(
                Long.parseLong(p[0]), p[1], p[2], p[3], p[4], p.length > 5 ? p[5] : "orange");
    }

    private GroupPost postFrom(String line) {
        String[] p = line.split("\\|", -1);
        return new GroupPost(
                Long.parseLong(p[0]),
                Long.parseLong(p[1]),
                Long.parseLong(p[2]),
                p[3],
                p[4],
                p[5],
                p[6]);
    }

    private String toPost(GroupPost p) {
        return p.getId()
                + "|"
                + p.getGroupId()
                + "|"
                + p.getUserId()
                + "|"
                + TextFileStore.clean(p.getAuthorName())
                + "|"
                + TextFileStore.clean(p.getMessage())
                + "|"
                + TextFileStore.clean(p.getResourceUrl())
                + "|"
                + TextFileStore.clean(p.getCreatedAt());
    }
}

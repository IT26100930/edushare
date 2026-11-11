package com.edushare.modules.download;

import com.edushare.modules.resource.DiscussionAccess;
import com.edushare.shared.TextFileStore;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@Service
public class PersonalLibraryService {

    private final TextFileStore store;

    private final DiscussionAccess access;

    private final LinkFileRepository links;

    public PersonalLibraryService(
            TextFileStore store, DiscussionAccess access, LinkFileRepository links) {
        this.store = store;
        this.access = access;
        this.links = links;
    }

    private void available(long user, long resource) {
        if (!access.allowed(resource, user)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "This resource is unavailable.");
        }
    }

    private List<Long> saved(long user) {
        List<Long> ids = new ArrayList<>();
        for (String row : store.read("bookmarks.txt")) {
            String[] p = row.split("\\|", -1);
            try {
                if (p.length >= 2 && p[0].equals(Long.toString(user))) {
                    long id = Long.parseLong(p[1]);
                    if (access.allowed(id, user) && !ids.contains(id)) {
                        ids.add(id);
                    }
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return ids;
    }

    public void bookmark(long user, long resource, boolean save) {
        synchronized (store) {
            if (save) {
                available(user, resource);
            }
            java.util.List<java.lang.String> rows = store.read("bookmarks.txt");
            String key = user + "|" + resource;
            if (save && rows.contains(key)) {
                return;
            }
            rows.removeIf(row -> row.equals(key));
            if (save) {
                rows.add(key);
            }
            store.write("bookmarks.txt", rows);
        }
    }

    private String[] owned(long user, String id) {
        for (String row : store.read("user-collections.txt")) {
            String[] p = row.split("\\|", -1);
            if (p.length >= 4 && p[0].equals(id) && p[1].equals(Long.toString(user))) {
                return p;
            }
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Collection not found.");
    }

    private String encode(String value) {
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String decode(String value) {
        try {
            return new String(Base64.getDecoder().decode(value), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            return "Collection";
        }
    }

    public String createCollection(long user, String name) {
        String clean = Objects.toString(name, "").trim();
        if (clean.isBlank() || clean.length() > 80) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Use a collection name of 1–80 characters.");
        }
        synchronized (store) {
            java.util.List<java.lang.String> rows = store.read("user-collections.txt");
            for (String row : rows) {
                String[] p = row.split("\\|", -1);
                if (p.length >= 4
                        && p[1].equals(Long.toString(user))
                        && decode(p[2]).equalsIgnoreCase(clean)) {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT, "You already have a collection with that name.");
                }
            }
            String id = UUID.randomUUID().toString();
            rows.add(id + "|" + user + "|" + encode(clean) + "|" + Instant.now());
            store.write("user-collections.txt", rows);
            return id;
        }
    }

    public void collectionItem(long user, String collection, long resource, boolean save) {
        synchronized (store) {
            owned(user, collection);
            if (save) {
                available(user, resource);
            }
            java.util.List<java.lang.String> rows = store.read("collection-resource-items.txt");
            String prefix = collection + "|" + resource + "|";
            rows.removeIf(row -> row.startsWith(prefix));
            if (save) {
                rows.add(prefix + Instant.now());
            }
            store.write("collection-resource-items.txt", rows);
        }
    }

    public void deleteCollection(long user, String collection) {
        synchronized (store) {
            owned(user, collection);
            java.util.List<java.lang.String> rows = store.read("user-collections.txt");
            rows.removeIf(row -> row.startsWith(collection + "|"));
            store.write("user-collections.txt", rows);
            java.util.List<java.lang.String> items = store.read("collection-resource-items.txt");
            items.removeIf(row -> row.startsWith(collection + "|"));
            store.write("collection-resource-items.txt", items);
        }
    }

    public void progress(long user, long resource, String status, int seconds) {
        progress(user, resource, status, seconds, false);
    }

    public void progress(long user, long resource, String status, int seconds, boolean automatic) {
        available(user, resource);
        if (resource >= 0
                || links.findByIdIncludingHidden(-resource)
                        .filter(l -> "VIDEO".equals(l.getLinkType()))
                        .isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Watch history is available for video resources.");
        }
        if (status == null
                || !Set.of("IN_PROGRESS", "COMPLETED").contains(status)
                || seconds < 0
                || seconds > 360000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid video progress.");
        }
        synchronized (store) {
            java.util.List<java.lang.String> rows = store.read("video-progress.txt");
            String prefix = user + "|" + resource + "|";
            if (automatic && rows.stream().anyMatch(row -> row.startsWith(prefix + "COMPLETED|"))) {
                return;
            }
            rows.removeIf(row -> row.startsWith(prefix));
            rows.add(prefix + status + "|" + seconds + "|" + Instant.now());
            store.write("video-progress.txt", rows);
        }
    }

    public void clearProgress(long user, long resource) {
        synchronized (store) {
            java.util.List<java.lang.String> rows = store.read("video-progress.txt");
            rows.removeIf(row -> row.startsWith(user + "|" + resource + "|"));
            store.write("video-progress.txt", rows);
        }
    }

    public Map<String, Object> state(long user) {
        List<Map<String, Object>> collections = new ArrayList<>(), progress = new ArrayList<>();
        for (String row : store.read("user-collections.txt")) {
            String[] p = row.split("\\|", -1);
            if (p.length < 4 || !p[1].equals(Long.toString(user))) {
                continue;
            }
            List<Long> items = new ArrayList<>();
            for (String item : store.read("collection-resource-items.txt")) {
                String[] v = item.split("\\|", -1);
                try {
                    if (v.length >= 2 && v[0].equals(p[0])) {
                        long id = Long.parseLong(v[1]);
                        if (access.allowed(id, user) && !items.contains(id)) {
                            items.add(id);
                        }
                    }
                } catch (NumberFormatException ignored) {
                }
            }
            collections.add(
                    Map.of(
                            "id",
                            p[0],
                            "name",
                            decode(p[2]),
                            "resourceIds",
                            items,
                            "createdAt",
                            p[3]));
        }
        for (String row : store.read("video-progress.txt")) {
            String[] p = row.split("\\|", -1);
            try {
                if (p.length >= 5 && p[0].equals(Long.toString(user))) {
                    long id = Long.parseLong(p[1]);
                    if (access.allowed(id, user)) {
                        progress.add(
                                Map.of(
                                        "resourceId",
                                        id,
                                        "status",
                                        p[2],
                                        "seconds",
                                        Integer.parseInt(p[3]),
                                        "updatedAt",
                                        p[4]));
                    }
                }
            } catch (NumberFormatException ignored) {
            }
        }
        progress.sort(
                (a, b) -> b.get("updatedAt").toString().compareTo(a.get("updatedAt").toString()));
        return Map.of("bookmarks", saved(user), "collections", collections, "progress", progress);
    }
}

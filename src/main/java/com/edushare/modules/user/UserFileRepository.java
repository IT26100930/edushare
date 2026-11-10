package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class UserFileRepository {

    private static final String FILE = "users.txt";

    private final TextFileStore store;

    public UserFileRepository(TextFileStore store) {
        this.store = store;
        // Existing records are preserved. New installations start without sample data.
    }

    public List<User> findAll() {
        List<User> out = new ArrayList<>();
        for (String l : store.read(FILE)) {
            if (!l.isBlank()) {
                out.add(fromLine(l));
            }
        }
        return out;
    }

    public Optional<User> findById(long id) {
        for (User item : findAll()) {
            if (!(item.getId() == id)) {
                continue;
            }
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        for (User item : findAll()) {
            if (!(item.getEmail().equalsIgnoreCase(email))) {
                continue;
            }
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public User save(User user) {
        synchronized (store) {
            List<User> all = findAll();
            if (user.getId() == 0) {
                long next =
                        Math.max(
                                store.nextId(store.read(FILE)),
                                store.nextId(store.read("user-id-sequence.txt")));
                user.setId(next);
                store.write("user-id-sequence.txt", List.of(String.valueOf(next)));
            }
            {
                java.util.Iterator<User> iterator = all.iterator();
                while (iterator.hasNext()) {
                    User u = iterator.next();
                    if (u.getId() == user.getId()) {
                        iterator.remove();
                    }
                }
            }
            all.add(user);
            write(all);
            return user;
        }
    }

    public boolean delete(long id) {
        synchronized (store) {
            List<User> all = findAll();
            boolean removed = false;
            {
                java.util.Iterator<User> iterator = all.iterator();
                while (iterator.hasNext()) {
                    User u = iterator.next();
                    if (u.getId() == id) {
                        iterator.remove();
                        removed = true;
                    }
                }
            }
            if (removed) {
                long maximum =
                        Math.max(
                                id,
                                Math.max(
                                        store.nextId(store.read(FILE)) - 1,
                                        store.nextId(store.read("user-id-sequence.txt")) - 1));
                store.write("user-id-sequence.txt", List.of(String.valueOf(maximum)));
                write(all);
            }
            return removed;
        }
    }

    private void write(List<User> users) {
        users.sort(Comparator.comparingLong(User::getId));
        {
            List<String> lines = new ArrayList<>();
            for (User item : users) {
                lines.add(this.toLine(item));
            }
            store.write(FILE, lines);
        }
    }

    private String toLine(User u) {
        return u.getId()
                + "|"
                + TextFileStore.clean(u.getName())
                + "|"
                + TextFileStore.clean(u.getUsername())
                + "|"
                + TextFileStore.clean(u.getEmail())
                + "|"
                + TextFileStore.clean(u.getPassword())
                + "|"
                + u.getRole()
                + "|"
                + u.isPremium()
                + "|"
                + TextFileStore.clean(u.getAvatar())
                + "|"
                + TextFileStore.clean(u.getBio())
                + "|"
                + TextFileStore.clean(u.getUniversity())
                + "|"
                + TextFileStore.clean(u.getDegree())
                + "|"
                + TextFileStore.clean(u.getBatch())
                + "|"
                + TextFileStore.clean(u.getCoverPattern())
                + "|"
                + TextFileStore.clean(u.getGithubUrl())
                + "|"
                + TextFileStore.clean(u.getLinkedinUrl())
                + "|"
                + u.isVerified()
                + "|"
                + u.isSuspended()
                + "|"
                + ("si".equals(u.getLanguage()) ? "si" : "en")
                + "|"
                + u.emailVisibleToMembers()
                + "|"
                + u.publicProfileEnabled()
                + "|"
                + encodeInterests(u.getInterests())
                + "|"
                + notification(u, "emailDigest", false)
                + "|"
                + notification(u, "newReviews", true)
                + "|"
                + notification(u, "payouts", false);
    }

    private boolean notification(User user, String key, boolean fallback) {
        return user.getNotifications() == null
                ? fallback
                : user.getNotifications().getOrDefault(key, fallback);
    }

    private String encodeInterests(List<String> interests) {
        if (interests == null) {
            return "";
        }
        return interests.stream()
                .map(
                        value ->
                                Base64.getUrlEncoder()
                                        .withoutPadding()
                                        .encodeToString(
                                                value.getBytes(
                                                        java.nio.charset.StandardCharsets.UTF_8)))
                .collect(java.util.stream.Collectors.joining(","));
    }

    private List<String> decodeInterests(String value) {
        if (value.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            return Arrays.stream(value.split(","))
                    .map(
                            item ->
                                    new String(
                                            Base64.getUrlDecoder().decode(item),
                                            java.nio.charset.StandardCharsets.UTF_8))
                    .toList();
        } catch (IllegalArgumentException ex) {
            return new ArrayList<>();
        }
    }

    private User fromLine(String l) {
        String[] p = l.split("\\|", -1);
        long id = Long.parseLong(p[0]);
        User u =
                "ADMIN".equalsIgnoreCase(p[5])
                        ? new Admin(id, p[1], p[2], p[3], p[4])
                        : new Student(id, p[1], p[2], p[3], p[4], Boolean.parseBoolean(p[6]));
        if (p.length > 7) {
            u.setAvatar(p[7]);
        }
        if (p.length > 8) {
            u.setBio(p[8]);
        }
        if (p.length > 9) {
            u.setUniversity(p[9]);
        }
        if (p.length > 10) {
            u.setDegree(p[10]);
        }
        if (p.length > 11) {
            u.setBatch(p[11]);
        }
        if (p.length > 12) {
            u.setCoverPattern(p[12]);
        }
        if (p.length > 13) {
            u.setGithubUrl(p[13]);
        }
        if (p.length > 14) {
            u.setLinkedinUrl(p[14]);
        }
        if (p.length > 15) {
            u.setVerified(Boolean.parseBoolean(p[15]));
        } else {
            u.setVerified(false);
        }
        if (p.length > 16) {
            u.setSuspended(Boolean.parseBoolean(p[16]));
        }
        u.setLanguage(p.length > 17 && "si".equals(p[17]) ? "si" : "en");
        u.setShowEmail(p.length > 18 && Boolean.parseBoolean(p[18]));
        u.setIsPublic(p.length <= 19 || !"false".equalsIgnoreCase(p[19]));
        u.setInterests(p.length > 20 ? decodeInterests(p[20]) : new ArrayList<>());
        u.setNotifications(
                Map.of(
                        "emailDigest",
                        p.length > 21 && Boolean.parseBoolean(p[21]),
                        "newReviews",
                        p.length <= 22 || Boolean.parseBoolean(p[22]),
                        "payouts",
                        p.length > 23 && Boolean.parseBoolean(p[23])));
        return u;
    }
}

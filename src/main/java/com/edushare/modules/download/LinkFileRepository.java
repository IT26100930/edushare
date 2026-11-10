package com.edushare.modules.download;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class LinkFileRepository {

    private static final String FILE = "links.txt";

    private final TextFileStore store;

    public LinkFileRepository(TextFileStore s) {
        store = s;
        // No example records are created on startup.
    }

    public List<Link> findAll() {
        Set<Long> hidden = hiddenIds();
        return findAllIncludingHidden().stream()
                .filter(
                        link ->
                                !hidden.contains(link.getId())
                                        && "APPROVED".equals(link.getStatus()))
                .toList();
    }

    /** Soft-hidden links remain in links.txt and can be inspected/restored by admins. */
    private Set<Long> hiddenIds() {
        Set<Long> ids = new HashSet<>();
        for (String line : store.read("moderated-links.txt")) {
            try {
                ids.add(Long.parseLong(line.trim()));
            } catch (NumberFormatException ignored) {
            }
        }
        return ids;
    }

    public List<Link> findAllIncludingHidden() {
        List<Link> results = new ArrayList<>();
        for (String item : store.read(FILE)) {
            if (!(!item.isBlank())) {
                continue;
            }
            results.add(this.from(item));
        }
        return Collections.unmodifiableList(results);
    }

    public Optional<Link> findByIdIncludingHidden(long id) {
        for (Link item : findAllIncludingHidden()) {
            if (!(item.getId() == id)) {
                continue;
            }
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public synchronized boolean hide(long id) {
        if (findByIdIncludingHidden(id).isEmpty()) {
            return false;
        }
        Set<Long> ids = hiddenIds();
        ids.add(id);
        store.write("moderated-links.txt", ids.stream().sorted().map(String::valueOf).toList());
        return true;
    }

    public synchronized boolean restore(long id) {
        if (findByIdIncludingHidden(id).isEmpty()) {
            return false;
        }
        Set<Long> ids = hiddenIds();
        ids.remove(id);
        store.write("moderated-links.txt", ids.stream().sorted().map(String::valueOf).toList());
        return true;
    }

    public boolean isHidden(long id) {
        return hiddenIds().contains(id);
    }

    public Optional<Link> findById(long id) {
        for (Link item : findAll()) {
            if (!(item.getId() == id)) {
                continue;
            }
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public synchronized Link save(Link l) {
        List<Link> a = new ArrayList<>(findAllIncludingHidden());
        if (l.getId() == 0) {
            l.setId(
                    Math.max(
                            store.nextId(store.read(FILE)),
                            Math.max(
                                    store.nextId(store.read("link-content-review-history.txt")),
                                    store.nextId(store.read("owned-video-files.txt")))));
        }
        {
            java.util.Iterator<Link> iterator = a.iterator();
            while (iterator.hasNext()) {
                Link x = iterator.next();
                if (x.getId() == l.getId()) {
                    iterator.remove();
                }
            }
        }
        a.add(l);
        write(a);
        return l;
    }

    public synchronized boolean delete(long id) {
        List<Link> a = new ArrayList<>(findAllIncludingHidden());
        boolean ok = false;
        {
            java.util.Iterator<Link> iterator = a.iterator();
            while (iterator.hasNext()) {
                Link x = iterator.next();
                if (x.getId() == id) {
                    iterator.remove();
                    ok = true;
                }
            }
        }
        if (ok) {
            write(a);
        }
        return ok;
    }

    public synchronized Optional<Link> assignModule(long id, String code) {
        Link link = findByIdIncludingHidden(id).orElse(null);
        if (link == null || code == null) {
            return Optional.empty();
        }
        for (String row : store.read("modules.txt")) {
            String[] p = row.split("\\|", -1);
            if (p.length >= 4
                    && p[1].equalsIgnoreCase(code)
                    && (p.length < 5 || !"false".equalsIgnoreCase(p[4]))) {
                link.setModuleCode(p[1]);
                link.setCategory(p[3]);
                return Optional.of(save(link));
            }
        }
        return Optional.empty();
    }

    public synchronized void audit(Link link, String actor) {
        List<String> rows = store.read("link-content-review-history.txt");
        rows.add(
                link.getId()
                        + "|"
                        + TextFileStore.clean(actor)
                        + "|"
                        + link.getStatus()
                        + "|"
                        + Base64.getEncoder()
                                .encodeToString(
                                        link.getModerationReason()
                                                .getBytes(java.nio.charset.StandardCharsets.UTF_8))
                        + "|"
                        + java.time.Instant.now());
        store.write("link-content-review-history.txt", rows);
    }

    private void write(List<Link> links) {
        List<String> rows = new ArrayList<>();
        for (Link link : links) {
            String chapters =
                    Base64.getEncoder()
                            .encodeToString(
                                    link.getChapters()
                                            .getBytes(java.nio.charset.StandardCharsets.UTF_8));
            rows.add(
                    link.getId()
                            + "|"
                            + link.getLinkType()
                            + "|"
                            + TextFileStore.clean(link.getTitle())
                            + "|"
                            + TextFileStore.clean(link.getUrl())
                            + "|"
                            + TextFileStore.clean(
                                    link.getUploaderEmail() == null ? "" : link.getUploaderEmail())
                            + "|"
                            + chapters
                            + "|"
                            + link.getStatus()
                            + "|"
                            + Base64.getEncoder()
                                    .encodeToString(
                                            link.getModerationReason()
                                                    .getBytes(
                                                            java.nio.charset.StandardCharsets
                                                                    .UTF_8))
                            + "|"
                            + TextFileStore.clean(link.getCategory())
                            + "|"
                            + TextFileStore.clean(link.getModuleCode())
                            + "|"
                            + link.getOwnership()
                            + "|"
                            + link.getPriceType()
                            + "|"
                            + link.getPrice()
                            + "|"
                            + link.isHasPreview());
        }
        store.write(FILE, rows);
    }

    private Link from(String line) {
        String[] fields = line.split("\\|", -1);
        Link link =
                "ARTICLE".equals(fields[1])
                        ? new ArticleLink(Long.parseLong(fields[0]), fields[2], fields[3])
                        : new VideoLink(Long.parseLong(fields[0]), fields[2], fields[3]);
        if (fields.length > 4) {
            link.setUploaderEmail(fields[4]);
        }
        if (fields.length > 5 && !fields[5].isBlank()) {
            try {
                link.setChapters(
                        new String(
                                Base64.getDecoder().decode(fields[5]),
                                java.nio.charset.StandardCharsets.UTF_8));
            } catch (IllegalArgumentException invalid) {
                link.setChapters("[]");
            }
        }
        // Preserve the publication state of legacy records; do not treat missing new columns as a
        // rejection.
        if (fields.length > 7
                && Set.of("APPROVED", "REJECTED", "NEEDS_REVIEW").contains(fields[6])) {
            link.setStatus(fields[6]);
            try {
                link.setModerationReason(
                        new String(
                                Base64.getDecoder().decode(fields[7]),
                                java.nio.charset.StandardCharsets.UTF_8));
            } catch (IllegalArgumentException ignored) {
                link.setStatus("NEEDS_REVIEW");
            }
        }
        boolean hasDecision =
                store.read("link-content-review-history.txt").stream()
                        .anyMatch(row -> row.startsWith(link.getId() + "|"));
        if (fields.length <= 6 && hasDecision) {
            for (String row : store.read("link-content-review-history.txt")) {
                String[] p = row.split("\\|", -1);
                if (p.length >= 4
                        && p[0].equals(Long.toString(link.getId()))
                        && Set.of("APPROVED", "REJECTED", "NEEDS_REVIEW").contains(p[2])) {
                    link.setStatus(p[2]);
                    try {
                        link.setModerationReason(
                                new String(
                                        Base64.getDecoder().decode(p[3]),
                                        java.nio.charset.StandardCharsets.UTF_8));
                    } catch (IllegalArgumentException ignored) {
                        link.setStatus("NEEDS_REVIEW");
                    }
                }
            }
        }
        boolean legacy =
                (fields.length <= 6 && !hasDecision)
                        || (fields.length == 8
                                && "NEEDS_REVIEW".equals(fields[6])
                                && fields[7].equals(
                                        Base64.getEncoder()
                                                .encodeToString(
                                                        "Awaiting content review."
                                                                .getBytes(
                                                                        java.nio.charset
                                                                                .StandardCharsets
                                                                                .UTF_8)))
                                && "NEEDS_REVIEW".equals(link.getStatus())
                                && "Awaiting content review.".equals(link.getModerationReason())
                                && !hasDecision);
        if (legacy) {
            link.setStatus("APPROVED");
            link.setModerationReason(
                    "Previously published link retained during format migration. No automatic"
                        + " content check is recorded; report unsuitable content or review it in"
                        + " Admin.");
        }
        if (fields.length > 8 && !fields[8].isBlank()) {
            link.setCategory(fields[8]);
        } else {
            inferCategory(link);
        }
        if (fields.length > 9 && !fields[9].isBlank()) {
            link.setModuleCode(fields[9]);
        }
        if (fields.length >= 14
                && Set.of("OWNED", "AUTHORIZED").contains(fields[10])
                && "VIDEO".equals(link.getLinkType())) {
            link.setOwnership(fields[10]);
            link.setPriceType(fields[11]);
            try {
                link.setPrice(Integer.parseInt(fields[12]));
            } catch (NumberFormatException ignored) {
                link.setStatus("NEEDS_REVIEW");
            }
            link.setHasPreview(Boolean.parseBoolean(fields[13]));
            // Uploaded video paths never appear in catalog JSON.
            link.setUrl("");
        }
        if (link.isOwnedVideo()) {
            for (String row : store.read("owned-video-rights.txt")) {
                String[] p = row.split("\\|", -1);
                if (p.length >= 4 && p[0].equals(Long.toString(link.getId())))
                    try {
                        link.setOriginalCreator(
                                new String(
                                        Base64.getDecoder().decode(p[3]),
                                        java.nio.charset.StandardCharsets.UTF_8));
                    } catch (IllegalArgumentException ignored) {
                    }
            }
        }
        link.setHidden(isHidden(link.getId()));
        return link;
    }

    private void inferCategory(Link link) {
        String text = (link.getTitle() + " " + link.getUrl()).toLowerCase(Locale.ROOT);
        if (text.matches(".*(owasp|cyber|security).*")) {
            link.setCategory("Cybersecurity");
        } else if (text.matches(".*(networkx|graph theory|graph algorithms|mathematics).*")) {
            link.setCategory("Mathematics");
        } else if (text.matches(".*(database|sql).*")) {
            link.setCategory("Databases");
        } else if (text.matches(".*(spring|restful|software engineering).*")) {
            link.setCategory("Software Engineering");
        } else if (text.matches(".*(machine learning|artificial intelligence).*")) {
            link.setCategory("AI & Machine Learning");
        } else if (text.matches(".*(computer network|tcp|routing).*")) {
            link.setCategory("Networking");
        } else if (text.matches(".*(html|css|javascript|web development).*")) {
            link.setCategory("Web Development");
        } else if (text.matches(".*(java|python|programming).*")) {
            link.setCategory("Programming");
        }
        for (String row : store.read("modules.txt")) {
            String[] p = row.split("\\|", -1);
            if (p.length >= 4
                    && p[3].equalsIgnoreCase(link.getCategory())
                    && (p.length < 5 || !"false".equalsIgnoreCase(p[4]))) {
                link.setModuleCode(p[1]);
                break;
            }
        }
    }
}

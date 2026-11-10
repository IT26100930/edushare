package com.edushare.modules.request;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class RequestFileRepository {

    private static final String FILE = "requests.txt";

    private final TextFileStore store;

    public RequestFileRepository(TextFileStore store) {
        this.store = store;
        // No example records are created on startup.
    }

    public List<ResourceRequest> findAll() {
        List<ResourceRequest> results = new ArrayList<>();
        for (String item : store.read(FILE)) {
            if (!(!item.isBlank())) {
                continue;
            }
            results.add(this.fromLine(item));
        }
        return Collections.unmodifiableList(results);
    }

    public Optional<ResourceRequest> findById(long id) {
        for (ResourceRequest item : findAll()) {
            if (!(item.getId() == id)) {
                continue;
            }
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public ResourceRequest save(ResourceRequest r) {
        synchronized (store) {
            List<ResourceRequest> a = new ArrayList<>(findAll());
            if (r.getId() == 0) {
                long next =
                        Math.max(
                                store.nextId(store.read(FILE)),
                                store.nextId(store.read("request-id-sequence.txt")));
                r.setId(next);
                store.write("request-id-sequence.txt", List.of(String.valueOf(next)));
            }
            {
                java.util.Iterator<ResourceRequest> iterator = a.iterator();
                while (iterator.hasNext()) {
                    ResourceRequest x = iterator.next();
                    if (x.getId() == r.getId()) {
                        iterator.remove();
                    }
                }
            }
            a.add(r);
            {
                List<String> lines = new ArrayList<>();
                for (ResourceRequest item : a) {
                    lines.add(this.line(item));
                }
                store.write(FILE, lines);
            }
            return r;
        }
    }

    public boolean delete(long id) {
        synchronized (store) {
            List<ResourceRequest> a = new ArrayList<>(findAll());
            boolean ok = false;
            {
                java.util.Iterator<ResourceRequest> iterator = a.iterator();
                while (iterator.hasNext()) {
                    ResourceRequest r = iterator.next();
                    if (r.getId() == id) {
                        iterator.remove();
                        ok = true;
                    }
                }
            }
            if (ok) {
                store.write(
                        "request-id-sequence.txt",
                        List.of(
                                String.valueOf(
                                        Math.max(
                                                id,
                                                Math.max(
                                                        store.nextId(store.read(FILE)) - 1,
                                                        store.nextId(
                                                                        store.read(
                                                                                "request-id-sequence.txt"))
                                                                - 1)))));
                {
                    List<String> lines = new ArrayList<>();
                    for (ResourceRequest item : a) {
                        lines.add(this.line(item));
                    }
                    store.write(FILE, lines);
                }
                List<String> offers = store.read("request-offers.txt");
                offers.removeIf(
                        row -> {
                            String[] fields = row.split("\\|", -1);
                            return fields.length > 1 && fields[1].equals(String.valueOf(id));
                        });
                store.write("request-offers.txt", offers);
            }
            return ok;
        }
    }

    private String line(ResourceRequest r) {
        return r.getId()
                + "|"
                + TextFileStore.clean(r.getTitle())
                + "|"
                + TextFileStore.clean(r.getMessage())
                + "|"
                + r.getStatus()
                + "|"
                + r.getRequestedById()
                + "|"
                + TextFileStore.clean(r.getModuleCode())
                + "|"
                + TextFileStore.clean(r.getResourceType())
                + "|"
                + TextFileStore.clean(r.getAcademicYear())
                + "|"
                + TextFileStore.clean(r.getNeededBy())
                + "|"
                + TextFileStore.clean(r.getCreatedAt());
    }

    private ResourceRequest fromLine(String l) {
        String[] p = l.split("\\|", -1);
        ResourceRequest request =
                new ResourceRequest(Long.parseLong(p[0]), p[1], p[2], p[3], Long.parseLong(p[4]));
        if (p.length > 5) {
            request.setModuleCode(p[5]);
        }
        if (p.length > 6) {
            request.setResourceType(p[6]);
        }
        if (p.length > 7) {
            request.setAcademicYear(p[7]);
        }
        if (p.length > 8) {
            request.setNeededBy(p[8]);
        }
        if (p.length > 9) {
            request.setCreatedAt(p[9]);
        }
        return request;
    }
}

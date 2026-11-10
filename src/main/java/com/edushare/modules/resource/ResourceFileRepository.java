package com.edushare.modules.resource;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class ResourceFileRepository {

    private static final String FILE = "resources.txt";

    private final TextFileStore store;

    public ResourceFileRepository(TextFileStore store) {
        this.store = store;
        // Existing records are preserved. New installations start without sample data.
    }

    public List<Resource> findAll() {
        List<Resource> out = new ArrayList<>();
        for (String l : store.read(FILE)) {
            if (!l.isBlank()) {
                out.add(fromLine(l));
            }
        }
        return out;
    }

    public Optional<Resource> findById(long id) {
        for (Resource item : findAll()) {
            if (!(item.getId() == id)) {
                continue;
            }
            return Optional.of(item);
        }
        return Optional.empty();
    }

    public Resource save(Resource r) {
        synchronized (store) {
            List<Resource> all = findAll();
            if (r.getId() == 0) {
                r.setId(store.nextId(store.read(FILE)));
            }
            {
                java.util.Iterator<Resource> iterator = all.iterator();
                while (iterator.hasNext()) {
                    Resource x = iterator.next();
                    if (x.getId() == r.getId()) {
                        iterator.remove();
                    }
                }
            }
            all.add(r);
            write(all);
            return r;
        }
    }

    public boolean delete(long id) {
        synchronized (store) {
            List<Resource> all = findAll();
            boolean ok = false;
            {
                java.util.Iterator<Resource> iterator = all.iterator();
                while (iterator.hasNext()) {
                    Resource r = iterator.next();
                    if (r.getId() == id) {
                        iterator.remove();
                        ok = true;
                    }
                }
            }
            if (ok) {
                write(all);
            }
            return ok;
        }
    }

    private void write(List<Resource> list) {
        list.sort(Comparator.comparingLong(Resource::getId));
        {
            List<String> lines = new ArrayList<>();
            for (Resource item : list) {
                lines.add(this.toLine(item));
            }
            store.write(FILE, lines);
        }
    }

    private String toLine(Resource r) {
        return r.getId()
                + "|"
                + r.getResourceType()
                + "|"
                + TextFileStore.clean(r.getTitle())
                + "|"
                + TextFileStore.clean(r.getModuleCode())
                + "|"
                + TextFileStore.clean(r.getCategory())
                + "|"
                + TextFileStore.clean(r.getUploaderEmail())
                + "|"
                + TextFileStore.clean(r.getFileName())
                + "|"
                + TextFileStore.clean(r.getFilePath())
                + "|"
                + TextFileStore.clean(r.getStatus())
                + "|"
                + TextFileStore.clean(r.getPriceType())
                + "|"
                + r.getPrice()
                + "|"
                + r.getPages()
                + "|"
                + TextFileStore.clean(r.getDescription())
                + "|"
                + TextFileStore.clean(r.getAcademicYear())
                + "|"
                + TextFileStore.clean(r.getSemester())
                + "|"
                + TextFileStore.clean(r.getTags())
                + "|"
                + TextFileStore.clean(r.getFileSize());
    }

    private Resource fromLine(String l) {
        String[] p = l.split("\\|", -1);
        long id = Long.parseLong(p[0]);
        Resource r;
        switch (p[1]) {
            case "EBOOK":
                r = new EBook(id, p[2], p[3], p[4], p[5], p[6], p[7]);
                break;
            case "PAST_PAPER":
                r = new PastPaper(id, p[2], p[3], p[4], p[5], p[6], p[7]);
                break;
            default:
                r = new LectureNote(id, p[2], p[3], p[4], p[5], p[6], p[7]);
                break;
        }
        r.setStatus(p.length > 8 ? p[8] : "APPROVED");
        r.setPriceType(p.length > 9 ? p[9] : "Free");
        try {
            r.setPrice(p.length > 10 ? Integer.parseInt(p[10]) : 0);
            r.setPages(p.length > 11 ? Integer.parseInt(p[11]) : 0);
        } catch (NumberFormatException ignore) {
        }
        if (p.length > 12) {
            r.setDescription(p[12]);
        }
        if (p.length > 13) {
            r.setAcademicYear(p[13]);
        }
        if (p.length > 14) {
            r.setSemester(p[14]);
        }
        if (p.length > 15) {
            r.setTags(p[15]);
        }
        if (p.length > 16) {
            r.setFileSize(p[16]);
        }
        return r;
    }
}

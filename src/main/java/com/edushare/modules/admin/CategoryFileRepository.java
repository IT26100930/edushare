package com.edushare.modules.admin;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class CategoryFileRepository {

    private static final String FILE = "categories.txt";

    private final TextFileStore store;

    public CategoryFileRepository(TextFileStore s) {
        store = s;
        // Existing records are preserved. New installations start without sample data.
    }

    public List<Category> findAll() {
        List<Category> results = new ArrayList<>();
        for (String item : store.read(FILE)) {
            if (!(!item.isBlank())) {
                continue;
            }
            results.add(this.from(item));
        }
        return Collections.unmodifiableList(results);
    }

    public Category save(Category c) {
        List<Category> a = new ArrayList<>(findAll());
        if (c.getId() == 0) {
            c.setId(store.nextId(store.read(FILE)));
        }
        {
            java.util.Iterator<Category> iterator = a.iterator();
            while (iterator.hasNext()) {
                Category x = iterator.next();
                if (x.getId() == c.getId()) {
                    iterator.remove();
                }
            }
        }
        a.add(c);
        store.write(
                FILE,
                a.stream()
                        .map(
                                x ->
                                        x.getId()
                                                + "|"
                                                + TextFileStore.clean(x.getName())
                                                + "|"
                                                + TextFileStore.clean(x.getParentName())
                                                + "|"
                                                + TextFileStore.clean(x.getImage()))
                        .toList());
        return c;
    }

    public boolean delete(long id) {
        List<Category> a = new ArrayList<>(findAll());
        boolean ok = false;
        {
            java.util.Iterator<Category> iterator = a.iterator();
            while (iterator.hasNext()) {
                Category x = iterator.next();
                if (x.getId() == id) {
                    iterator.remove();
                    ok = true;
                }
            }
        }
        if (ok) {
            store.write(
                    FILE,
                    a.stream()
                            .map(
                                    x ->
                                            x.getId()
                                                    + "|"
                                                    + TextFileStore.clean(x.getName())
                                                    + "|"
                                                    + TextFileStore.clean(x.getParentName())
                                                    + "|"
                                                    + TextFileStore.clean(x.getImage()))
                            .toList());
        }
        return ok;
    }

    private Category from(String l) {
        String[] p = l.split("\\|", -1);
        Category c = new Category(Long.parseLong(p[0]), p[1], p[2]);
        if (p.length > 3) {
            c.setImage(p[3]);
        }
        return c;
    }
}

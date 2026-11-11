package com.edushare.modules.admin;

import com.edushare.shared.TextFileStore;

import org.springframework.stereotype.Repository;

import java.util.*;

@Repository
public class AcademicModuleFileRepository {

    private static final String FILE = "modules.txt";

    private final TextFileStore store;

    public AcademicModuleFileRepository(TextFileStore store) {
        this.store = store;
        // Existing records are preserved. New installations start without sample data.
    }

    public List<AcademicModule> findAll() {
        List<AcademicModule> results = new ArrayList<>();
        for (String item : store.read(FILE)) {
            if (!(!item.isBlank())) {
                continue;
            }
            results.add(this.fromLine(item));
        }
        return Collections.unmodifiableList(results);
    }

    public AcademicModule save(AcademicModule module) {
        List<AcademicModule> all = new ArrayList<>(findAll());
        if (module.getId() == 0) {
            module.setId(store.nextId(store.read(FILE)));
        }
        {
            java.util.Iterator<AcademicModule> iterator = all.iterator();
            while (iterator.hasNext()) {
                AcademicModule x = iterator.next();
                if (x.getId() == module.getId()) {
                    iterator.remove();
                }
            }
        }
        all.add(module);
        all.sort(Comparator.comparing(AcademicModule::getCode));
        write(all);
        return module;
    }

    public boolean delete(long id) {
        List<AcademicModule> all = new ArrayList<>(findAll());
        boolean removed = false;
        {
            java.util.Iterator<AcademicModule> iterator = all.iterator();
            while (iterator.hasNext()) {
                AcademicModule x = iterator.next();
                if (x.getId() == id) {
                    iterator.remove();
                    removed = true;
                }
            }
        }
        if (removed) {
            write(all);
        }
        return removed;
    }

    private void write(List<AcademicModule> all) {
        store.write(
                FILE,
                all.stream()
                        .map(
                                m ->
                                        m.getId()
                                                + "|"
                                                + TextFileStore.clean(m.getCode())
                                                + "|"
                                                + TextFileStore.clean(m.getName())
                                                + "|"
                                                + TextFileStore.clean(m.getFacultySubject())
                                                + "|"
                                                + m.isActive())
                        .toList());
    }

    private AcademicModule fromLine(String line) {
        String[] p = line.split("\\|", -1);
        return new AcademicModule(
                Long.parseLong(p[0]), p[1], p[2], p[3], p.length < 5 || TextFileStore.yes(p[4]));
    }
}

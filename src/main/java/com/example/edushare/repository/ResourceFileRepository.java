package com.example.edushare.repository;

import com.example.edushare.model.Resource;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class ResourceFileRepository {

    private static final String FILE = "resources.txt";

    public synchronized List<Resource> findAll() {
        List<Resource> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(Resource.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public Resource findById(String id) {
        return findAll().stream().filter(r -> r.getId().equals(id)).findFirst().orElse(null);
    }

    public synchronized void save(Resource resource) {
        List<Resource> all = findAll();
        boolean replaced = false;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getId().equals(resource.getId())) {
                all.set(i, resource);
                replaced = true;
            }
        }
        if (!replaced) {
            all.add(resource);
        }
        writeAll(all);
    }

    public synchronized void delete(String id) {
        List<Resource> all = findAll();
        all.removeIf(r -> r.getId().equals(id));
        writeAll(all);
    }

    private void writeAll(List<Resource> all) {
        FileUtil.writeLines(FILE, all.stream().map(Resource::toLine).toList());
    }
}

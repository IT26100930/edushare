package com.example.edushare.repository;

import com.example.edushare.model.LearningLink;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class LinkFileRepository {

    private static final String FILE = "links.txt";

    public synchronized List<LearningLink> findAll() {
        List<LearningLink> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(LearningLink.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public LearningLink findById(String id) {
        return findAll().stream().filter(l -> l.getId().equals(id)).findFirst().orElse(null);
    }

    public synchronized void add(LearningLink link) {
        List<LearningLink> all = findAll();
        all.add(link);
        FileUtil.writeLines(FILE, all.stream().map(LearningLink::toLine).toList());
    }

    public synchronized void delete(String id) {
        List<LearningLink> all = findAll();
        all.removeIf(l -> l.getId().equals(id));
        FileUtil.writeLines(FILE, all.stream().map(LearningLink::toLine).toList());
    }
}

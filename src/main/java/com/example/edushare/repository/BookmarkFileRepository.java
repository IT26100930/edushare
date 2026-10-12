package com.example.edushare.repository;

import com.example.edushare.model.Bookmark;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class BookmarkFileRepository {

    private static final String FILE = "bookmarks.txt";

    public synchronized List<Bookmark> findAll() {
        List<Bookmark> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(Bookmark.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public synchronized void add(Bookmark bookmark) {
        List<Bookmark> all = findAll();
        all.add(bookmark);
        writeAll(all);
    }

    public synchronized void remove(String userId, String resourceId) {
        List<Bookmark> all = findAll();
        all.removeIf(b -> b.getUserId().equals(userId) && b.getResourceId().equals(resourceId));
        writeAll(all);
    }

    public synchronized void deleteByResource(String resourceId) {
        List<Bookmark> all = findAll();
        all.removeIf(b -> b.getResourceId().equals(resourceId));
        writeAll(all);
    }

    private void writeAll(List<Bookmark> all) {
        FileUtil.writeLines(FILE, all.stream().map(Bookmark::toLine).toList());
    }
}

package com.example.edushare.repository;

import com.example.edushare.model.Download;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class DownloadFileRepository {

    private static final String FILE = "downloads.txt";

    public synchronized List<Download> findAll() {
        List<Download> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(Download.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public synchronized void add(Download download) {
        List<Download> all = findAll();
        all.add(download);
        FileUtil.writeLines(FILE, all.stream().map(Download::toLine).toList());
    }

    public synchronized void deleteByResource(String resourceId) {
        List<Download> all = findAll();
        all.removeIf(d -> d.getResourceId().equals(resourceId));
        FileUtil.writeLines(FILE, all.stream().map(Download::toLine).toList());
    }
}

package com.example.edushare.service;

import com.example.edushare.model.Download;
import com.example.edushare.model.Resource;
import com.example.edushare.repository.DownloadFileRepository;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class DownloadService {

    private final DownloadFileRepository repo;

    public DownloadService(DownloadFileRepository repo) {
        this.repo = repo;
    }

    public void record(String userId, Resource resource) {
        repo.add(new Download(FileUtil.newId("d"), userId, resource.getId(), resource.getTitle(),
                LocalDate.now().toString()));
    }

    public List<Download> findByUser(String userId) {
        return repo.findAll().stream()
                .filter(d -> d.getUserId().equals(userId))
                .sorted(Comparator.comparing(Download::getDate).reversed())
                .toList();
    }

    public List<Download> findAll() {
        return repo.findAll();
    }

    public boolean hasDownloaded(String userId, String resourceId) {
        return repo.findAll().stream()
                .anyMatch(d -> d.getUserId().equals(userId) && d.getResourceId().equals(resourceId));
    }

    public long countByUser(String userId) {
        return repo.findAll().stream().filter(d -> d.getUserId().equals(userId)).count();
    }

    public void removeAllFor(String resourceId) {
        repo.deleteByResource(resourceId);
    }
}

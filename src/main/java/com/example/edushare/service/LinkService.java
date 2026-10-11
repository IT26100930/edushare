package com.example.edushare.service;

import com.example.edushare.model.LearningLink;
import com.example.edushare.model.User;
import com.example.edushare.repository.LinkFileRepository;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class LinkService {

    private final LinkFileRepository repo;

    public LinkService(LinkFileRepository repo) {
        this.repo = repo;
    }

    public List<LearningLink> findAll() {
        return repo.findAll().stream().sorted(Comparator.comparing(LearningLink::getDate).reversed()).toList();
    }

    public List<LearningLink> findByKind(String kind) {
        return findAll().stream().filter(l -> l.getKind().equals(kind)).toList();
    }

    public LearningLink add(User user, String kind, String title, String url, String description, String extra) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        if (url == null || !(url.startsWith("http://") || url.startsWith("https://"))) {
            throw new IllegalArgumentException("The link must start with http:// or https://");
        }
        LearningLink l = LearningLink.of(kind);
        l.setId(FileUtil.newId("l"));
        l.setTitle(title.trim());
        l.setUrl(url.trim());
        l.setDescription(description == null ? "" : description.trim());
        l.setAddedBy(user.getId());
        l.setAddedByName(user.getName());
        l.setDate(LocalDate.now().toString());
        l.setExtra(extra == null ? "" : extra.trim());
        repo.add(l);
        return l;
    }

    public void delete(User user, String id) {
        LearningLink l = repo.findById(id);
        if (l != null && (user.isAdmin() || l.getAddedBy().equals(user.getId()))) {
            repo.delete(id);
        }
    }
}

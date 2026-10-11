package com.example.edushare.service;

import com.example.edushare.dto.ResourceCardView;
import com.example.edushare.model.Category;
import com.example.edushare.model.Resource;
import com.example.edushare.model.User;
import com.example.edushare.repository.ResourceFileRepository;
import com.example.edushare.util.ColorUtil;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
public class ResourceService {

    private final ResourceFileRepository repo;
    private final CategoryService categoryService;
    private final BookmarkService bookmarkService;
    private final ReviewService reviewService;
    private final DownloadService downloadService;
    private final MembershipService membershipService;

    public ResourceService(ResourceFileRepository repo, CategoryService categoryService,
                           BookmarkService bookmarkService, ReviewService reviewService,
                           DownloadService downloadService, MembershipService membershipService) {
        this.repo = repo;
        this.categoryService = categoryService;
        this.bookmarkService = bookmarkService;
        this.reviewService = reviewService;
        this.downloadService = downloadService;
        this.membershipService = membershipService;
    }

    public List<Resource> findAll() {
        return repo.findAll().stream()
                .sorted(Comparator.comparing(Resource::getCreatedAt).reversed().thenComparing(Resource::getId))
                .toList();
    }

    public Resource findById(String id) {
        return id == null ? null : repo.findById(id);
    }

    public List<Resource> findByUploader(String userId) {
        return findAll().stream().filter(r -> r.getUploaderId().equals(userId)).toList();
    }

    public List<Resource> findPremium() {
        return findAll().stream().filter(Resource::isPremium).toList();
    }

    /** Text search + optional filters. Every parameter may be null or blank. */
    public List<Resource> search(String q, String categoryId, String type, String access) {
        String needle = q == null ? "" : q.trim().toLowerCase();
        List<Resource> out = new ArrayList<>();
        for (Resource r : findAll()) {
            boolean text = needle.isEmpty()
                    || r.getTitle().toLowerCase().contains(needle)
                    || r.getDescription().toLowerCase().contains(needle)
                    || r.getExtraA().toLowerCase().contains(needle)
                    || r.getExtraB().toLowerCase().contains(needle)
                    || r.getUploaderName().toLowerCase().contains(needle);
            boolean cat = categoryId == null || categoryId.isBlank() || categoryId.equals(r.getCategoryId());
            boolean typ = type == null || type.isBlank() || type.equals(r.getType());
            boolean acc = access == null || access.isBlank() || "all".equals(access)
                    || ("premium".equals(access) && r.isPremium())
                    || ("free".equals(access) && !r.isPremium());
            if (text && cat && typ && acc) {
                out.add(r);
            }
        }
        return out;
    }

    public Resource create(String type, String title, String description, String categoryId, String content,
                           String extraA, String extraB, boolean premium, User uploader) {
        Resource r = Resource.of(type);
        r.setId(FileUtil.newId("r"));
        r.setUploaderId(uploader.getId());
        r.setUploaderName(uploader.getName());
        r.setCreatedAt(LocalDate.now().toString());
        r.setDownloads(0);
        apply(r, title, description, categoryId, content, extraA, extraB, premium && uploader.isPremium());
        repo.save(r);
        return r;
    }

    public void update(Resource r, String title, String description, String categoryId, String content,
                       String extraA, String extraB, boolean premium, User editor) {
        apply(r, title, description, categoryId, content, extraA, extraB, premium && editor.isPremium());
        repo.save(r);
    }

    private void apply(Resource r, String title, String description, String categoryId, String content,
                       String extraA, String extraB, boolean premium) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }
        if (categoryService.findById(categoryId) == null) {
            throw new IllegalArgumentException("Please choose a category.");
        }
        r.setTitle(title.trim());
        r.setDescription(description == null ? "" : description.trim());
        r.setCategoryId(categoryId);
        r.setContent(content == null ? "" : content.trim());
        r.setExtraA(extraA == null ? "" : extraA.trim());
        r.setExtraB(extraB == null ? "" : extraB.trim());
        r.setPremium(premium);
    }

    public void recordDownload(Resource r) {
        r.incrementDownloads();
        repo.save(r);
    }

    public void delete(String id) {
        repo.delete(id);
        bookmarkService.removeAllFor(id);
        reviewService.removeAllFor(id);
        downloadService.removeAllFor(id);
    }

    /** Converts resources into card view objects for the given (possibly null) user. */
    public List<ResourceCardView> toCards(List<Resource> resources, User user) {
        Set<String> saved = user == null ? Set.of() : bookmarkService.idsFor(user.getId());
        List<ResourceCardView> cards = new ArrayList<>();
        for (Resource r : resources) {
            Category c = categoryService.findById(r.getCategoryId());
            String name = c == null ? "Uncategorised" : c.getName();
            String color = c == null ? ColorUtil.fromText(name) : ColorUtil.safe(c.getColor(), name);
            cards.add(new ResourceCardView(r, name, color,
                    !membershipService.canAccess(user, r), saved.contains(r.getId()),
                    reviewService.average(r.getId()), reviewService.count(r.getId())));
        }
        return cards;
    }
}

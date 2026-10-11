package com.example.edushare.controller;

import com.example.edushare.model.Resource;
import com.example.edushare.model.User;
import com.example.edushare.service.*;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class ResourceController {

    private final ResourceService resourceService;
    private final CategoryService categoryService;
    private final UserService userService;
    private final MembershipService membershipService;
    private final ReviewService reviewService;
    private final BookmarkService bookmarkService;
    private final DownloadService downloadService;

    public ResourceController(ResourceService resourceService, CategoryService categoryService,
                              UserService userService, MembershipService membershipService,
                              ReviewService reviewService, BookmarkService bookmarkService,
                              DownloadService downloadService) {
        this.resourceService = resourceService;
        this.categoryService = categoryService;
        this.userService = userService;
        this.membershipService = membershipService;
        this.reviewService = reviewService;
        this.bookmarkService = bookmarkService;
        this.downloadService = downloadService;
    }

    @GetMapping("/resources")
    public String list(@RequestParam(name = "q", required = false) String q,
                       @RequestParam(name = "category", required = false) String category,
                       @RequestParam(name = "type", required = false) String type,
                       @RequestParam(name = "access", required = false) String access,
                       Model model, HttpSession session) {
        User user = userService.current(session);
        model.addAttribute("cards", resourceService.toCards(resourceService.search(q, category, type, access), user));
        model.addAttribute("categories", categoryService.findAll());
        model.addAttribute("q", q == null ? "" : q);
        model.addAttribute("selCategory", category == null ? "" : category);
        model.addAttribute("selType", type == null ? "" : type);
        model.addAttribute("selAccess", access == null ? "" : access);
        return "resources";
    }

    @GetMapping("/resources/{id}")
    public String detail(@PathVariable("id") String id, Model model, HttpSession session, RedirectAttributes ra) {
        Resource r = resourceService.findById(id);
        if (r == null) {
            ra.addFlashAttribute("error", "Resource not found.");
            return "redirect:/resources";
        }
        User user = userService.current(session);
        boolean canAccess = membershipService.canAccess(user, r);
        String content = r.getContent() == null ? "" : r.getContent();
        model.addAttribute("resource", r);
        model.addAttribute("category", categoryService.findById(r.getCategoryId()));
        model.addAttribute("canAccess", canAccess);
        model.addAttribute("lockedPreview", content.length() > 140 ? content.substring(0, 140) + "..." : content);
        model.addAttribute("reviews", reviewService.findByResource(id));
        model.addAttribute("avgRating", String.format("%.1f", reviewService.average(id)));
        model.addAttribute("bookmarked", user != null && bookmarkService.idsFor(user.getId()).contains(id));
        model.addAttribute("downloaded", user != null && downloadService.hasDownloaded(user.getId(), id));
        model.addAttribute("canEdit", user != null && (user.isAdmin() || user.getId().equals(r.getUploaderId())));
        return "resource-detail";
    }

    @GetMapping("/resources/add")
    public String addPage(Model model, HttpSession session) {
        if (userService.current(session) == null) {
            return "redirect:/login";
        }
        model.addAttribute("categories", categoryService.findAll());
        return "add-resource";
    }

    @PostMapping("/resources/add")
    public String add(@RequestParam("type") String type, @RequestParam("title") String title,
                      @RequestParam(name = "description", defaultValue = "") String description,
                      @RequestParam("categoryId") String categoryId,
                      @RequestParam(name = "content", defaultValue = "") String content,
                      @RequestParam(name = "extraA", defaultValue = "") String extraA,
                      @RequestParam(name = "extraB", defaultValue = "") String extraB,
                      @RequestParam(name = "premium", defaultValue = "false") boolean premium,
                      HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        try {
            Resource r = resourceService.create(type, title, description, categoryId, content,
                    extraA, extraB, premium, user);
            ra.addFlashAttribute("msg", "Resource shared. Thank you!");
            return "redirect:/resources/" + r.getId();
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
            return "redirect:/resources/add";
        }
    }

    @GetMapping("/resources/{id}/edit")
    public String editPage(@PathVariable("id") String id, Model model, HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        Resource r = resourceService.findById(id);
        if (user == null) {
            return "redirect:/login";
        }
        if (r == null || !(user.isAdmin() || user.getId().equals(r.getUploaderId()))) {
            ra.addFlashAttribute("error", "You cannot edit that resource.");
            return "redirect:/resources";
        }
        model.addAttribute("resource", r);
        model.addAttribute("categories", categoryService.findAll());
        return "edit-resource";
    }

    @PostMapping("/resources/{id}/edit")
    public String edit(@PathVariable("id") String id, @RequestParam("title") String title,
                       @RequestParam(name = "description", defaultValue = "") String description,
                       @RequestParam("categoryId") String categoryId,
                       @RequestParam(name = "content", defaultValue = "") String content,
                       @RequestParam(name = "extraA", defaultValue = "") String extraA,
                       @RequestParam(name = "extraB", defaultValue = "") String extraB,
                       @RequestParam(name = "premium", defaultValue = "false") boolean premium,
                       HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        Resource r = resourceService.findById(id);
        if (user == null) {
            return "redirect:/login";
        }
        if (r == null || !(user.isAdmin() || user.getId().equals(r.getUploaderId()))) {
            ra.addFlashAttribute("error", "You cannot edit that resource.");
            return "redirect:/resources";
        }
        try {
            resourceService.update(r, title, description, categoryId, content, extraA, extraB, premium, user);
            ra.addFlashAttribute("msg", "Resource updated.");
            return "redirect:/resources/" + id;
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
            return "redirect:/resources/" + id + "/edit";
        }
    }

    @PostMapping("/resources/{id}/delete")
    public String delete(@PathVariable("id") String id, HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        Resource r = resourceService.findById(id);
        if (user == null) {
            return "redirect:/login";
        }
        if (r != null && (user.isAdmin() || user.getId().equals(r.getUploaderId()))) {
            resourceService.delete(id);
            ra.addFlashAttribute("msg", "Resource deleted.");
        }
        return user.isAdmin() ? "redirect:/admin" : "redirect:/my-resources";
    }

    @GetMapping("/my-resources")
    public String mine(Model model, HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        model.addAttribute("resources", resourceService.findByUploader(user.getId()));
        return "my-resources";
    }
}

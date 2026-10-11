package com.example.edushare.controller;

import com.example.edushare.model.Resource;
import com.example.edushare.model.User;
import com.example.edushare.service.*;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@Controller
public class DownloadController {

    private final DownloadService downloadService;
    private final ResourceService resourceService;
    private final CategoryService categoryService;
    private final MembershipService membershipService;
    private final UserService userService;

    public DownloadController(DownloadService downloadService, ResourceService resourceService,
                              CategoryService categoryService, MembershipService membershipService,
                              UserService userService) {
        this.downloadService = downloadService;
        this.resourceService = resourceService;
        this.categoryService = categoryService;
        this.membershipService = membershipService;
        this.userService = userService;
    }

    /** Checks access, then forwards to the file endpoint (so errors can redirect with a message). */
    @GetMapping("/download/{id}")
    public String download(@PathVariable("id") String id, HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null) {
            ra.addFlashAttribute("error", "Please log in to download resources.");
            return "redirect:/login";
        }
        Resource r = resourceService.findById(id);
        if (r == null) {
            ra.addFlashAttribute("error", "Resource not found.");
            return "redirect:/resources";
        }
        if (!membershipService.canAccess(user, r)) {
            ra.addFlashAttribute("error", "This is a Premium resource. Upgrade to download it.");
            return "redirect:/premium";
        }
        return "forward:/download/" + id + "/file";
    }

    /** Sends a watermarked text copy of the resource and records the download. */
    @GetMapping("/download/{id}/file")
    public ResponseEntity<byte[]> file(@PathVariable("id") String id, HttpSession session) {
        User user = userService.current(session);
        Resource r = resourceService.findById(id);
        if (user == null || r == null || !membershipService.canAccess(user, r)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        resourceService.recordDownload(r);
        downloadService.record(user.getId(), r);

        String mark = membershipService.watermark(user);
        var category = categoryService.findById(r.getCategoryId());
        StringBuilder sb = new StringBuilder();
        sb.append(mark).append('\n').append("=".repeat(mark.length())).append("\n\n");
        sb.append(r.getTitle()).append('\n');
        sb.append(r.getTypeLabel()).append(" | ").append(category == null ? "" : category.getName()).append('\n');
        sb.append(r.getExtraALabel()).append(": ").append(r.getExtraA()).append("  ")
                .append(r.getExtraBLabel()).append(": ").append(r.getExtraB()).append('\n');
        sb.append("Shared by ").append(r.getUploaderName()).append(" on EduShare\n\n");
        sb.append(r.getDescription()).append("\n\n").append("-".repeat(40)).append("\n\n");
        sb.append(r.getContent()).append("\n\n").append("-".repeat(40)).append('\n');
        sb.append(mark).append(" • Downloaded ").append(LocalDate.now()).append('\n');

        String fileName = r.getTitle().replaceAll("[^A-Za-z0-9._-]+", "_") + ".txt";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(new MediaType("text", "plain", StandardCharsets.UTF_8))
                .body(sb.toString().getBytes(StandardCharsets.UTF_8));
    }

    @GetMapping("/my-downloads")
    public String myDownloads(Model model, HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        model.addAttribute("downloads", downloadService.findByUser(user.getId()));
        return "my-downloads";
    }
}

package com.edushare.modules.download;

import com.edushare.modules.resource.ResourceSellingRules;
import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@RestController
@RequestMapping("/api/owned-videos")
public class OwnedVideoController {

    private final LinkFileRepository links;

    private final UserService users;

    private final TextFileStore store;

    private final ResourceSellingRules rules;

    public OwnedVideoController(
            LinkFileRepository links,
            UserService users,
            TextFileStore store,
            ResourceSellingRules rules) {
        this.links = links;
        this.users = users;
        this.store = store;
        this.rules = rules;
    }

    private User account(HttpSession s) {
        try {
            return users.byId(Long.parseLong(String.valueOf(s.getAttribute("userId"))))
                    .filter(u -> !u.isSuspended())
                    .orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean owner(User u, Link l) {
        return "ADMIN".equals(u.getRole()) || u.getEmail().equalsIgnoreCase(l.getUploaderEmail());
    }

    private boolean visible(User u, Link l) {
        return owner(u, l) || ("APPROVED".equals(l.getStatus()) && !links.isHidden(l.getId()));
    }

    private boolean allowed(User u, Link l) {
        return visible(u, l)
                && (owner(u, l)
                        || "Free".equals(l.getPriceType())
                        || ("Premium".equals(l.getPriceType()) && u.isPremium())
                        || ("Paid".equals(l.getPriceType())
                                && store.read("demo_video_unlocks.txt")
                                        .contains(u.getId() + "|" + l.getId())));
    }

    private Link video(long id) {
        return links.findByIdIncludingHidden(id)
                .filter(Link::isOwnedVideo)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    private String extension(MultipartFile file, long limit) throws IOException {
        if (file == null || file.isEmpty() || file.getSize() > limit) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Choose a video within the upload limit.");
        }
        byte[] head;
        try (InputStream in = file.getInputStream()) {
            head = in.readNBytes(16);
        }
        String name = Objects.toString(file.getOriginalFilename(), "").toLowerCase(Locale.ROOT);
        if (name.endsWith(".mp4")
                && head.length >= 12
                && head[4] == 'f'
                && head[5] == 't'
                && head[6] == 'y'
                && head[7] == 'p') {
            return ".mp4";
        }
        if (name.endsWith(".webm")
                && head.length >= 4
                && (head[0] & 255) == 0x1a
                && (head[1] & 255) == 0x45
                && (head[2] & 255) == 0xdf
                && (head[3] & 255) == 0xa3) {
            return ".webm";
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Upload an MP4 or WebM video file.");
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> upload(
            @RequestParam String title,
            @RequestParam String moduleCode,
            @RequestParam String category,
            @RequestParam String ownership,
            @RequestParam String originalCreator,
            @RequestParam boolean rightsConfirmed,
            @RequestParam(defaultValue = "") String permissionNote,
            @RequestParam String priceType,
            @RequestParam int price,
            @RequestPart MultipartFile file,
            @RequestPart(required = false) MultipartFile preview,
            HttpSession s)
            throws IOException {
        User u = account(s);
        if (u == null) {
            return ResponseEntity.status(401).build();
        }
        if (!rightsConfirmed
                || !Set.of("OWNED", "AUTHORIZED").contains(ownership)
                || title.isBlank()
                || title.length() > 200
                || originalCreator.trim().length() < 2
                || originalCreator.length() > 120
                || permissionNote.length() > 1000
                || ("AUTHORIZED".equals(ownership) && permissionNote.trim().length() < 10)) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Provide creator credit and confirm your right to share and"
                                        + " sell this video. For authorised videos, describe the"
                                        + " permission."));
        }
        boolean moduleExists =
                store.read("modules.txt").stream()
                        .anyMatch(
                                row -> {
                                    String[] f = row.split("\\|", -1);
                                    return f.length >= 4
                                            && f[1].equalsIgnoreCase(moduleCode)
                                            && f[3].equals(category)
                                            && (f.length < 5 || !"false".equalsIgnoreCase(f[4]));
                                });
        if (!moduleExists) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Choose an active subject and module."));
        }
        rules.validate(priceType, price);
        boolean hasPreview = preview != null && !preview.isEmpty();
        if (!"Free".equals(priceType) && !hasPreview) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Paid and Premium videos need a separate preview clip."));
        }
        String ext = extension(file, 250L * 1024 * 1024),
                previewExt = hasPreview ? extension(preview, 20L * 1024 * 1024) : "";
        Path dir = store.getDataDirectory().resolve("private-videos");
        Files.createDirectories(dir);
        Path full = dir.resolve(UUID.randomUUID() + ext),
                sample = hasPreview ? dir.resolve(UUID.randomUUID() + previewExt) : null;
        Link l = new VideoLink();
        l.setOriginalCreator(originalCreator.trim());
        l.setTitle(title.trim());
        l.setUrl("");
        l.setUploaderEmail(u.getEmail());
        l.setModuleCode(moduleCode);
        l.setCategory(category);
        l.setOwnership(ownership);
        l.setPriceType(priceType);
        l.setPrice(price);
        l.setHasPreview(hasPreview);
        l.setStatus("NEEDS_REVIEW");
        l.setModerationReason("Awaiting video and sharing-permission review.");
        try {
            file.transferTo(full);
            if (hasPreview) {
                preview.transferTo(sample);
            }
            synchronized (links) {
                links.save(l);
                List<String> files = store.read("owned-video-files.txt");
                files.add(
                        l.getId()
                                + "|"
                                + full.getFileName()
                                + "|"
                                + (sample == null ? "" : sample.getFileName()));
                store.write("owned-video-files.txt", files);
                List<String> rights = store.read("owned-video-rights.txt");
                rights.add(
                        l.getId()
                                + "|"
                                + u.getId()
                                + "|"
                                + ownership
                                + "|"
                                + encode(originalCreator.trim())
                                + "|"
                                + encode(permissionNote.trim())
                                + "|"
                                + java.time.Instant.now());
                store.write("owned-video-rights.txt", rights);
                links.audit(l, "UPLOAD:" + u.getId());
            }
        } catch (Exception e) {
            links.delete(l.getId());
            Files.deleteIfExists(full);
            if (sample != null) {
                Files.deleteIfExists(sample);
            }
            throw e;
        }
        return ResponseEntity.ok(l);
    }

    private String encode(String value) {
        return Base64.getEncoder()
                .encodeToString(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    @GetMapping("/{id}/access")
    public ResponseEntity<?> access(@PathVariable long id, HttpSession s) {
        User u = account(s);
        if (u == null) {
            return ResponseEntity.status(401).build();
        }
        Link l = video(id);
        if (!visible(u, l)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("allowed", allowed(u, l), "hasPreview", l.isHasPreview()));
    }

    @GetMapping("/{id}/rights")
    public ResponseEntity<?> rights(@PathVariable long id, HttpSession s) {
        User u = account(s);
        if (u == null || !"ADMIN".equals(u.getRole())) {
            return ResponseEntity.status(403).build();
        }
        video(id);
        for (String row : store.read("owned-video-rights.txt")) {
            String[] f = row.split("\\|", -1);
            if (f.length >= 6 && f[0].equals(Long.toString(id))) {
                return ResponseEntity.ok(
                        Map.of(
                                "ownership",
                                f[2],
                                "creator",
                                new String(
                                        Base64.getDecoder().decode(f[3]),
                                        java.nio.charset.StandardCharsets.UTF_8),
                                "permissionNote",
                                new String(
                                        Base64.getDecoder().decode(f[4]),
                                        java.nio.charset.StandardCharsets.UTF_8),
                                "declaredAt",
                                f[5]));
            }
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/{part:stream|preview}")
    public ResponseEntity<FileSystemResource> stream(
            @PathVariable long id, @PathVariable String part, HttpSession s) {
        User u = account(s);
        if (u == null) {
            return ResponseEntity.status(401).build();
        }
        Link l = video(id);
        if (!visible(u, l)) {
            return ResponseEntity.notFound().build();
        }
        boolean full = "stream".equals(part);
        if (full && !allowed(u, l)) {
            return ResponseEntity.status(403).build();
        }
        if (!full && !l.isHasPreview()) {
            return ResponseEntity.notFound().build();
        }
        for (String row : store.read("owned-video-files.txt")) {
            String[] f = row.split("\\|", -1);
            if (f.length >= 3 && f[0].equals(Long.toString(id))) {
                Path root =
                        store.getDataDirectory()
                                .resolve("private-videos")
                                .toAbsolutePath()
                                .normalize();
                Path path = root.resolve(f[full ? 1 : 2]).normalize();
                if (!path.startsWith(root) || !Files.isRegularFile(path)) {
                    return ResponseEntity.notFound().build();
                }
                return ResponseEntity.ok()
                        .contentType(
                                MediaType.parseMediaType(
                                        path.toString().endsWith(".webm")
                                                ? "video/webm"
                                                : "video/mp4"))
                        .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                        .header("X-Content-Type-Options", "nosniff")
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                        .body(new FileSystemResource(path));
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/{id}/demo-unlock")
    public ResponseEntity<?> unlock(@PathVariable long id, HttpSession s) {
        User u = account(s);
        if (u == null) {
            return ResponseEntity.status(401).build();
        }
        Link l = video(id);
        if (!visible(u, l)
                || !"APPROVED".equals(l.getStatus())
                || links.isHidden(id)
                || !"Paid".equals(l.getPriceType())) {
            return ResponseEntity.status(403).build();
        }
        synchronized (store) {
            List<String> rows = store.read("demo_video_unlocks.txt");
            String key = u.getId() + "|" + id;
            if (!rows.contains(key)) {
                rows.add(key);
                store.write("demo_video_unlocks.txt", rows);
            }
        }
        return ResponseEntity.ok(Map.of("status", "DEMO_UNLOCKED"));
    }
}

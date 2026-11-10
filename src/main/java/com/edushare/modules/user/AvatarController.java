package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.core.io.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.*;
import java.nio.file.*;
import java.util.*;

import javax.imageio.ImageIO;
import javax.imageio.stream.ImageInputStream;

@RestController
@RequestMapping("/api/users")
public class AvatarController {

    private final Path avatarDir, originalDir;

    private final TextFileStore store;

    private final UserService users;

    public AvatarController(UserService users, TextFileStore store) {
        this.users = users;
        this.store = store;
        avatarDir = store.getDataDirectory().resolve("avatars").toAbsolutePath().normalize();
        originalDir =
                store.getDataDirectory().resolve("avatar-originals").toAbsolutePath().normalize();
    }

    private User account(HttpSession s) {
        try {
            return users.byId(Long.parseLong(String.valueOf(s.getAttribute("userId"))))
                    .filter(u -> !u.isSuspended())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }

    private static final class Edit {

        @com.fasterxml.jackson.annotation.JsonProperty("source")
        private final String source;

        @com.fasterxml.jackson.annotation.JsonProperty("zoom")
        private final double zoom;

        @com.fasterxml.jackson.annotation.JsonProperty("x")
        private final double x;

        @com.fasterxml.jackson.annotation.JsonProperty("y")
        private final double y;

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        private final String avatar;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Edit(
                @com.fasterxml.jackson.annotation.JsonProperty("source") String source,
                @com.fasterxml.jackson.annotation.JsonProperty("zoom") double zoom,
                @com.fasterxml.jackson.annotation.JsonProperty("x") double x,
                @com.fasterxml.jackson.annotation.JsonProperty("y") double y,
                @com.fasterxml.jackson.annotation.JsonProperty("avatar") String avatar) {
            this.source = source;
            this.zoom = zoom;
            this.x = x;
            this.y = y;
            this.avatar = avatar;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("source")
        public String getSource() {
            return source;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("zoom")
        public double getZoom() {
            return zoom;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("x")
        public double getX() {
            return x;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("y")
        public double getY() {
            return y;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("avatar")
        public String getAvatar() {
            return avatar;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Edit value = (Edit) other;
            return java.util.Objects.equals(source, value.source)
                    && java.util.Objects.equals(zoom, value.zoom)
                    && java.util.Objects.equals(x, value.x)
                    && java.util.Objects.equals(y, value.y)
                    && java.util.Objects.equals(avatar, value.avatar);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(source);
            result = 31 * result + java.util.Objects.hashCode(zoom);
            result = 31 * result + java.util.Objects.hashCode(x);
            result = 31 * result + java.util.Objects.hashCode(y);
            result = 31 * result + java.util.Objects.hashCode(avatar);
            return result;
        }

        @Override
        public String toString() {
            return "Edit["
                    + "source="
                    + source
                    + ", zoom="
                    + zoom
                    + ", x="
                    + x
                    + ", y="
                    + y
                    + ", avatar="
                    + avatar
                    + "]";
        }
    }

    private Edit edit(User u) {
        for (String row : store.read("avatar-edits.txt")) {
            String[] p = row.split("\\|", -1);
            if (p.length == 6
                    && p[0].equals(String.valueOf(u.getId()))
                    && p[5].equals(u.getAvatar())) {
                try {
                    return new Edit(
                            p[1],
                            Double.parseDouble(p[2]),
                            Double.parseDouble(p[3]),
                            Double.parseDouble(p[4]),
                            p[5]);
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return null;
    }

    private Path source(Edit e) {
        if (e == null || !e.getSource().matches("[a-f0-9-]+\\.(jpg|png)")) {
            return null;
        }
        Path f = originalDir.resolve(e.getSource()).normalize();
        return f.startsWith(originalDir) && Files.isRegularFile(f) ? f : null;
    }

    private void saveEdit(long uid, Edit e) {
        List<String> rows = store.read("avatar-edits.txt");
        rows.removeIf(r -> r.startsWith(uid + "|"));
        if (e != null) {
            rows.add(
                    uid
                            + "|"
                            + e.getSource()
                            + "|"
                            + e.getZoom()
                            + "|"
                            + e.getX()
                            + "|"
                            + e.getY()
                            + "|"
                            + e.getAvatar());
        }
        store.write("avatar-edits.txt", rows);
    }

    private String format(MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getSize() > 5L * 1024 * 1024) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Choose an image up to 5 MB.");
        }
        try (ImageInputStream in = ImageIO.createImageInputStream(file.getInputStream())) {
            java.util.Iterator<javax.imageio.ImageReader> readers = ImageIO.getImageReaders(in);
            if (!readers.hasNext()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Image could not be decoded. Choose a JPG or PNG.");
            }
            javax.imageio.ImageReader reader = readers.next();
            try {
                reader.setInput(in);
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!Set.of("jpeg", "jpg", "png").contains(format)
                        || reader.getWidth(0) < 1
                        || reader.getHeight(0) < 1
                        || (long) reader.getWidth(0) * reader.getHeight(0) > 25000000) {
                    throw new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "Use a JPG/PNG image up to 25 megapixels.");
                }
                if (reader.read(0) == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image.");
                }
                return format.equals("png") ? ".png" : ".jpg";
            } finally {
                reader.dispose();
            }
        }
    }

    @GetMapping("/me/avatar-editor")
    public Object editor(HttpSession s) {
        User u = account(s);
        synchronized (store) {
            Edit e = edit(u);
            boolean retained = source(e) != null;
            return Map.of(
                    "sourceUrl",
                    retained ? "/api/users/me/avatar-source" : Objects.toString(u.getAvatar(), ""),
                    "hasOriginal",
                    retained,
                    "zoom",
                    retained ? e.getZoom() : 100,
                    "x",
                    retained ? e.getX() : 0,
                    "y",
                    retained ? e.getY() : 0);
        }
    }

    @GetMapping("/me/avatar-source")
    public ResponseEntity<Resource> original(HttpSession s) {
        User u = account(s);
        synchronized (store) {
            Path f = source(edit(u));
            if (f == null) {
                return ResponseEntity.notFound().build();
            }
            return image(f, true);
        }
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "original", required = false) MultipartFile original,
            @RequestParam(defaultValue = "100") double zoom,
            @RequestParam(defaultValue = "0") double x,
            @RequestParam(defaultValue = "0") double y,
            HttpSession s)
            throws IOException {
        User u = account(s);
        if (!Double.isFinite(zoom)
                || zoom < 100
                || zoom > 300
                || !Double.isFinite(x)
                || Math.abs(x) > 100
                || !Double.isFinite(y)
                || Math.abs(y) > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid photo position.");
        }
        String croppedExt = format(file);
        String originalExt = original == null ? null : format(original);
        synchronized (store) {
            String oldAvatar = u.getAvatar();
            Edit previous = edit(u);
            Path priorSource = source(previous);
            Files.createDirectories(avatarDir);
            Files.createDirectories(originalDir);
            String name = "user-" + u.getId() + "-" + UUID.randomUUID() + croppedExt;
            Path cropped = avatarDir.resolve(name);
            Path newSource =
                    original == null ? null : originalDir.resolve(UUID.randomUUID() + originalExt);
            String url = "/api/users/avatar/" + name;
            try {
                file.transferTo(cropped);
                if (newSource != null) {
                    original.transferTo(newSource);
                }
                String sourceName =
                        newSource != null
                                ? newSource.getFileName().toString()
                                : priorSource != null ? priorSource.getFileName().toString() : "";
                Edit next = sourceName.isEmpty() ? null : new Edit(sourceName, zoom, x, y, url);
                saveEdit(u.getId(), next);
                if (users.updateAvatar(u.getId(), url).isEmpty()) {
                    saveEdit(u.getId(), previous);
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND);
                }
            } catch (IOException | RuntimeException e) {
                saveEdit(u.getId(), previous);
                Files.deleteIfExists(cropped);
                if (newSource != null) {
                    Files.deleteIfExists(newSource);
                }
                throw e;
            }
            // Retain unrelated files and legacy originals. Only the owned replaced source is
            // removed.
            try {
                if (newSource != null && priorSource != null) {
                    Files.deleteIfExists(priorSource);
                }
                removePublicOwned(oldAvatar, u.getId(), url);
            } catch (IOException ignored) {
                /* Saved image remains usable even if old-file cleanup is unavailable. */
            }
            return ResponseEntity.ok(Map.of("avatarUrl", url));
        }
    }

    private void removePublicOwned(String old, long uid, String keep) throws IOException {
        if (old == null || old.equals(keep) || !old.startsWith("/api/users/avatar/")) {
            return;
        }
        String name = old.substring("/api/users/avatar/".length());
        if (name.matches("user-" + uid + "-[a-zA-Z0-9-]+\\.(jpg|jpeg|png|webp)")) {
            Files.deleteIfExists(avatarDir.resolve(name));
        }
    }

    @DeleteMapping("/me/avatar")
    public Object removeAvatar(HttpSession s) throws IOException {
        User u = account(s);
        synchronized (store) {
            String old = u.getAvatar();
            Path original = source(edit(u));
            users.updateAvatar(u.getId(), "");
            saveEdit(u.getId(), null);
            removePublicOwned(old, u.getId(), "");
            if (original != null) {
                Files.deleteIfExists(original);
            }
            return Map.of("avatarUrl", "", "message", "Profile photo removed");
        }
    }

    private ResponseEntity<Resource> image(Path f, boolean privateSource) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(
                        MediaType.parseMediaType(
                                f.toString().endsWith(".png")
                                        ? "image/png"
                                        : f.toString().endsWith(".webp")
                                                ? "image/webp"
                                                : "image/jpeg"))
                .body(new FileSystemResource(f));
    }

    @GetMapping("/avatar/{filename:.+}")
    public ResponseEntity<Resource> avatar(@PathVariable String filename) {
        if (filename.contains("..")
                || !filename.matches("[a-zA-Z0-9][a-zA-Z0-9._-]{0,180}\\.(jpg|jpeg|png|webp)")) {
            return ResponseEntity.notFound().build();
        }
        Path f = avatarDir.resolve(filename).normalize();
        return f.startsWith(avatarDir) && Files.isRegularFile(f)
                ? image(f, false)
                : ResponseEntity.notFound().build();
    }
}

package com.edushare.modules.admin;

import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;
import jakarta.servlet.http.HttpSession;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import javax.imageio.ImageIO;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/categories")
public class CategoryManagementController {

    private final CategoryFileRepository categories;
    private final AcademicModuleFileRepository modules;
    private final UserService users;
    private final TextFileStore store;

    private static final Set<String> ALLOWED_COVERS = Set.of(
        "/images/bento-coder.png",
        "/images/hero-students.png",
        "/assets/aistudio/image_26095a37.png",
        "/images/category-presets/programming.svg",
        "/images/category-presets/pdf-notes.svg",
        "/images/category-presets/video-lessons.svg",
        "/images/category-presets/past-papers.svg",
        "/images/category-presets/cybersecurity.svg",
        "/images/category-presets/databases.svg",
        "/images/category-presets/networking.svg",
        "/images/category-presets/ai-ml.svg",
        "/images/category-presets/mathematics.svg",
        "/images/category-presets/study-circles.svg"
    );

    public CategoryManagementController(
        CategoryFileRepository categories,
        AcademicModuleFileRepository modules,
        UserService users,
        TextFileStore store
    ) {
        this.categories = categories;
        this.modules = modules;
        this.users = users;
        this.store = store;
    }

    private boolean isAdmin(HttpSession session) {
        Object id = session.getAttribute("userId");
        if (id == null) return false;

        try {
            return users.byId(Long.parseLong(id.toString()))
                .filter(u -> "ADMIN".equals(u.getRole()) && !u.isSuspended())
                .isPresent();
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean isAllowedCover(String image, Long id) {
        if (image == null || image.isBlank()) return true;
        if (ALLOWED_COVERS.contains(image)) return true;

        return id != null &&
            image.equals("/api/admin/categories/" + id + "/image");
    }

    @GetMapping
    public ResponseEntity<?> findAll(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(categories.findAll());
    }

    @PostMapping
    public ResponseEntity<?> create(
        @RequestBody Category category,
        HttpSession session
    ) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        if (category.getName() == null || category.getName().isBlank()
            || !isAllowedCover(category.getImage(), null)) {
            return ResponseEntity.badRequest().build();
        }

        String name = category.getName().trim();

        boolean duplicate = categories.findAll().stream()
            .anyMatch(c -> c.getName().equalsIgnoreCase(name));

        if (duplicate) {
            return ResponseEntity.status(409).build();
        }

        category.setId(0);
        category.setName(name);

        return ResponseEntity.ok(categories.save(category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
        @PathVariable long id,
        @RequestBody Category incoming,
        HttpSession session
    ) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        Optional<Category> found = categories.findAll().stream()
            .filter(c -> c.getId() == id)
            .findFirst();

        if (found.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (!isAllowedCover(incoming.getImage(), id)) {
            return ResponseEntity.badRequest().build();
        }

        Category saved = found.get();
        String previousName = saved.getName();

        if (incoming.getName() != null) {
            if (incoming.getName().isBlank()) {
                return ResponseEntity.badRequest().build();
            }

            String newName = incoming.getName().trim();

            boolean duplicate = categories.findAll().stream()
                .anyMatch(c -> c.getId() != id
                    && c.getName().equalsIgnoreCase(newName));

            if (duplicate) {
                return ResponseEntity.status(409).build();
            }

            saved.setName(newName);
        }

        if (incoming.getParentName() != null) {
            saved.setParentName(incoming.getParentName().trim());
        }

        if (incoming.getImage() != null) {
            saved.setImage(incoming.getImage());
        }

        Category result = categories.save(saved);

        // Keep academic modules synchronized after category rename.
        if (!previousName.equals(result.getName())) {
            for (AcademicModule module : modules.findAll()) {
                if (previousName.equalsIgnoreCase(module.getFacultySubject())) {
                    module.setFacultySubject(result.getName());
                    modules.save(module);
                }
            }
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping(
        value = "/{id}/image",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<?> uploadImage(
        @PathVariable long id,
        @RequestPart("file") MultipartFile upload,
        HttpSession session
    ) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        Optional<Category> found = categories.findAll().stream()
            .filter(c -> c.getId() == id)
            .findFirst();

        if (found.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (upload.isEmpty() || upload.getSize() > 5L * 1024 * 1024) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Choose a PNG/JPEG file under 5 MB."));
        }

        String contentType = upload.getContentType();
        if (!"image/png".equals(contentType)
            && !"image/jpeg".equals(contentType)) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Only PNG/JPEG images are supported."));
        }

        try {
            BufferedImage decoded = ImageIO.read(upload.getInputStream());

            if (decoded == null
                || decoded.getWidth() < 1
                || decoded.getHeight() < 1
                || decoded.getWidth() > 5000
                || decoded.getHeight() > 5000) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid image dimensions."));
            }

            Path directory = store.getDataDirectory()
                .resolve("category-images");

            Files.createDirectories(directory);

            Path output = directory.resolve(id + ".png");

            if (!ImageIO.write(decoded, "png", output.toFile())) {
                throw new IOException("Cannot encode image");
            }

            Category category = found.get();
            category.setImage("/api/admin/categories/" + id + "/image");
            categories.save(category);

            return ResponseEntity.ok(Map.of("image", category.getImage()));

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Image save failed."));
        }
    }

    @GetMapping(value = "/{id}/image", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<FileSystemResource> getImage(@PathVariable long id) {
        Path file = store.getDataDirectory()
            .resolve("category-images")
            .resolve(id + ".png");

        if (!Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "no-store")
            .contentType(MediaType.IMAGE_PNG)
            .body(new FileSystemResource(file));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
        @PathVariable long id,
        HttpSession session
    ) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).build();
        }

        Category target = categories.findAll().stream()
            .filter(c -> c.getId() == id)
            .findFirst()
            .orElse(null);

        if (target == null) {
            return ResponseEntity.notFound().build();
        }

        boolean hasModules = modules.findAll().stream()
            .anyMatch(m -> target.getName()
                .equalsIgnoreCase(m.getFacultySubject()));

        if (hasModules) {
            return ResponseEntity.status(409)
                .body(Map.of(
                    "error",
                    "Delete or move the modules in this category first."
                ));
        }

        return categories.delete(id)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }
}

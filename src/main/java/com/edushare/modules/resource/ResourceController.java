package com.edushare.modules.resource;

import com.edushare.modules.admin.SellingPolicyStore;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;
import jakarta.servlet.http.HttpSession;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.destination.*;
import org.apache.pdfbox.pdmodel.interactive.documentnavigation.outline.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

  private final ResourceService service;

  private final Path uploadDir;

  private final TextFileStore store;

  private final UserService users;

  public ResourceController(
      ResourceService service,
      @Value("${edushare.upload-dir:data/uploads}") String uploadDir,
      TextFileStore store,
      UserService users) {
    this.store = store;
    this.users = users;
    this.service = service;
    this.uploadDir = store.getUploadsDirectory().toAbsolutePath().normalize();
    try {
      Files.createDirectories(this.uploadDir);
    } catch (IOException e) {
      throw new RuntimeException("Cannot create upload directory", e);
    }
  }

  // Older resources.txt lines use relative data/uploads/file.pdf paths.
  // Resolve them within the active data directory instead of IntelliJ cwd.
  private Path resolveSavedUpload(String storedPath) {
    return ManagedUploads.resolve(store, storedPath);
  }

  public static final class ResourceRequestDto {
    @com.fasterxml.jackson.annotation.JsonProperty("contentType")
    private String contentType;

    public String getContentType() {
      return contentType;
    }

    public void setContentType(String value) {
      contentType = value;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("type")
    private final String type;

    @com.fasterxml.jackson.annotation.JsonProperty("title")
    private final String title;

    @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
    private final String moduleCode;

    @com.fasterxml.jackson.annotation.JsonProperty("category")
    private final String category;

    @com.fasterxml.jackson.annotation.JsonProperty("fileName")
    private final String fileName;

    @com.fasterxml.jackson.annotation.JsonProperty("filePath")
    private final String filePath;

    @com.fasterxml.jackson.annotation.JsonProperty("priceType")
    private final String priceType;

    @com.fasterxml.jackson.annotation.JsonProperty("price")
    private final Integer price;

    @com.fasterxml.jackson.annotation.JsonProperty("pages")
    private final Integer pages;

    @com.fasterxml.jackson.annotation.JsonProperty("description")
    private final String description;

    @com.fasterxml.jackson.annotation.JsonProperty("academicYear")
    private final String academicYear;

    @com.fasterxml.jackson.annotation.JsonProperty("semester")
    private final String semester;

    @com.fasterxml.jackson.annotation.JsonProperty("tags")
    private final String tags;

    @com.fasterxml.jackson.annotation.JsonProperty("fileSize")
    private final String fileSize;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public ResourceRequestDto(
        @com.fasterxml.jackson.annotation.JsonProperty("type") String type,
        @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode,
        @com.fasterxml.jackson.annotation.JsonProperty("category") String category,
        @com.fasterxml.jackson.annotation.JsonProperty("fileName") String fileName,
        @com.fasterxml.jackson.annotation.JsonProperty("filePath") String filePath,
        @com.fasterxml.jackson.annotation.JsonProperty("priceType") String priceType,
        @com.fasterxml.jackson.databind.annotation.JsonDeserialize(
                using = com.edushare.shared.WholeRupeeDeserializer.class)
            @com.fasterxml.jackson.annotation.JsonProperty("price")
            Integer price,
        @com.fasterxml.jackson.annotation.JsonProperty("pages") Integer pages,
        @com.fasterxml.jackson.annotation.JsonProperty("description") String description,
        @com.fasterxml.jackson.annotation.JsonProperty("academicYear") String academicYear,
        @com.fasterxml.jackson.annotation.JsonProperty("semester") String semester,
        @com.fasterxml.jackson.annotation.JsonProperty("tags") String tags,
        @com.fasterxml.jackson.annotation.JsonProperty("fileSize") String fileSize) {
      this.type = type;
      this.title = title;
      this.moduleCode = moduleCode;
      this.category = category;
      this.fileName = fileName;
      this.filePath = filePath;
      this.priceType = priceType;
      this.price = price;
      this.pages = pages;
      this.description = description;
      this.academicYear = academicYear;
      this.semester = semester;
      this.tags = tags;
      this.fileSize = fileSize;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("type")
    public String getType() {
      return type;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("title")
    public String getTitle() {
      return title;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
    public String getModuleCode() {
      return moduleCode;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("category")
    public String getCategory() {
      return category;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("fileName")
    public String getFileName() {
      return fileName;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("filePath")
    public String getFilePath() {
      return filePath;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("priceType")
    public String getPriceType() {
      return priceType;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("price")
    public Integer getPrice() {
      return price;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("pages")
    public Integer getPages() {
      return pages;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("description")
    public String getDescription() {
      return description;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("academicYear")
    public String getAcademicYear() {
      return academicYear;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("semester")
    public String getSemester() {
      return semester;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("tags")
    public String getTags() {
      return tags;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("fileSize")
    public String getFileSize() {
      return fileSize;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      ResourceRequestDto value = (ResourceRequestDto) other;
      return java.util.Objects.equals(type, value.type)
          && java.util.Objects.equals(title, value.title)
          && java.util.Objects.equals(moduleCode, value.moduleCode)
          && java.util.Objects.equals(category, value.category)
          && java.util.Objects.equals(fileName, value.fileName)
          && java.util.Objects.equals(filePath, value.filePath)
          && java.util.Objects.equals(priceType, value.priceType)
          && java.util.Objects.equals(price, value.price)
          && java.util.Objects.equals(pages, value.pages)
          && java.util.Objects.equals(description, value.description)
          && java.util.Objects.equals(academicYear, value.academicYear)
          && java.util.Objects.equals(semester, value.semester)
          && java.util.Objects.equals(tags, value.tags)
          && java.util.Objects.equals(fileSize, value.fileSize);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(type);
      result = 31 * result + java.util.Objects.hashCode(title);
      result = 31 * result + java.util.Objects.hashCode(moduleCode);
      result = 31 * result + java.util.Objects.hashCode(category);
      result = 31 * result + java.util.Objects.hashCode(fileName);
      result = 31 * result + java.util.Objects.hashCode(filePath);
      result = 31 * result + java.util.Objects.hashCode(priceType);
      result = 31 * result + java.util.Objects.hashCode(price);
      result = 31 * result + java.util.Objects.hashCode(pages);
      result = 31 * result + java.util.Objects.hashCode(description);
      result = 31 * result + java.util.Objects.hashCode(academicYear);
      result = 31 * result + java.util.Objects.hashCode(semester);
      result = 31 * result + java.util.Objects.hashCode(tags);
      result = 31 * result + java.util.Objects.hashCode(fileSize);
      return result;
    }

    @Override
    public String toString() {
      return "ResourceRequestDto["
          + "type="
          + type
          + ", title="
          + title
          + ", moduleCode="
          + moduleCode
          + ", category="
          + category
          + ", fileName="
          + fileName
          + ", filePath="
          + filePath
          + ", priceType="
          + priceType
          + ", price="
          + price
          + ", pages="
          + pages
          + ", description="
          + description
          + ", academicYear="
          + academicYear
          + ", semester="
          + semester
          + ", tags="
          + tags
          + ", fileSize="
          + fileSize
          + "]";
    }
  }

  @GetMapping
  public ResponseEntity<List<Resource>> all(
      @RequestParam(required = false) String category,
      @RequestParam(required = false) String type,
      @RequestParam(required = false) String module,
      @RequestParam(required = false) String uploader,
      HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    String email = Objects.toString(session.getAttribute("email"), "");
    boolean admin = "ADMIN".equals(session.getAttribute("role"));
    return ResponseEntity.ok(
        service.all(category, type, module, uploader).stream()
            .filter(
                r ->
                    admin
                        || "APPROVED".equalsIgnoreCase(r.getStatus())
                        || email.equalsIgnoreCase(r.getUploaderEmail()))
            .toList());
  }

  @GetMapping("/{id}")
  public ResponseEntity<Resource> one(@PathVariable long id, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    String email = Objects.toString(session.getAttribute("email"), "");
    boolean admin = "ADMIN".equals(session.getAttribute("role"));
    return service
        .byId(id)
        .filter(
            r ->
                admin
                    || "APPROVED".equalsIgnoreCase(r.getStatus())
                    || email.equalsIgnoreCase(r.getUploaderEmail()))
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PostMapping
  public ResponseEntity<Resource> create(@RequestBody ResourceRequestDto d, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    if (d == null) {
      return ResponseEntity.badRequest().build();
    }
    new ResourceSellingRules(store).validate(d.getPriceType(), d.getPrice());
    SellingPolicyStore policy = new SellingPolicyStore(store);
    String label = policy.documentType(d.getType(), d.getContentType());
    policy.validatePricing(label, d.getPriceType(), d.getTitle(), d.getDescription());
    if (d.getFilePath() != null && !d.getFilePath().isBlank()) {
      return ResponseEntity.badRequest().build();
    }
    Resource created = fromDto(d, Objects.toString(session.getAttribute("email"), ""));
    created.setStatus("PENDING");
    Resource saved = saveDocument(created, label);
    return ResponseEntity.ok(saved);
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<Resource> upload(
      @RequestParam String type,
      @RequestParam String title,
      @RequestParam(defaultValue = "") String contentType,
      @RequestParam String moduleCode,
      @RequestParam String category,
      @RequestParam(defaultValue = "Free") String priceType,
      @RequestParam(defaultValue = "0") int price,
      @RequestParam(defaultValue = "0") int pages,
      @RequestParam(defaultValue = "") String description,
      @RequestParam(defaultValue = "") String academicYear,
      @RequestParam(defaultValue = "") String semester,
      @RequestParam(defaultValue = "") String tags,
      @RequestPart MultipartFile file,
      HttpSession session)
      throws IOException {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    new ResourceSellingRules(store).validate(priceType, price);
    SellingPolicyStore policy = new SellingPolicyStore(store);
    String label = policy.documentType(type, contentType);
    policy.validatePricing(label, priceType, title, description);
    if (file.isEmpty()
        || file.getOriginalFilename() == null
        || !file.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
      return ResponseEntity.badRequest().build();
    }
    if (file.getSize() > PdfStudyText.MAX_UPLOAD_BYTES) {
      return ResponseEntity.status(413).build();
    }
    int actualPages;
    try (java.io.InputStream input = file.getInputStream();
        PDDocument pdf =
            PDDocument.load(
                input, org.apache.pdfbox.io.MemoryUsageSetting.setupMixed(16L * 1024 * 1024))) {
      if (pdf.isEncrypted() || pdf.getNumberOfPages() < 1) {
        return ResponseEntity.badRequest().build();
      }
      actualPages = pdf.getNumberOfPages();
    } catch (IOException | RuntimeException invalid) {
      return ResponseEntity.badRequest().build();
    }
    String safeName =
        UUID.randomUUID() + "-" + file.getOriginalFilename().replaceAll("[^a-zA-Z0-9._-]", "_");
    Path target = uploadDir.resolve(safeName);
    file.transferTo(target);
    ResourceRequestDto dto =
        new ResourceRequestDto(
            type,
            title,
            moduleCode,
            category,
            safeName,
            "uploads/" + safeName,
            priceType,
            price,
            actualPages,
            description,
            academicYear,
            semester,
            tags,
            String.format(java.util.Locale.ROOT, "%.2f MB", file.getSize() / 1048576.0));
    try {
      Resource created = fromDto(dto, Objects.toString(session.getAttribute("email"), ""));
      created.setStatus("PENDING");
      Resource saved = saveDocument(created, label);
      return ResponseEntity.ok(saved);
    } catch (RuntimeException failure) {
      Files.deleteIfExists(target);
      throw failure;
    }
  }

  @GetMapping("/{id}/download")
  public ResponseEntity<FileSystemResource> download(@PathVariable long id, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    Optional<Resource> found = service.byId(id);
    if (found.isEmpty()
        || found.get().getFilePath() == null
        || found.get().getFilePath().isBlank()) {
      return ResponseEntity.notFound().build();
    }
    Path path = resolveSavedUpload(found.get().getFilePath());
    if (!Files.isRegularFile(path)) {
      return ResponseEntity.notFound().build();
    }
    if (!canRead(found.get(), session)) {
      return ResponseEntity.status(403).build();
    }
    if (!path.toAbsolutePath().normalize().startsWith(uploadDir.toAbsolutePath().normalize())) {
      return ResponseEntity.notFound().build();
    }
    FileSystemResource file = new FileSystemResource(path);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"resource.pdf\"")
        .header("X-Content-Type-Options", "nosniff")
        .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
        .contentType(MediaType.APPLICATION_PDF)
        .body(file);
  }

  // Full document is never sent to browsers without entitlement. Preview is a separate PDF
  // containing only the first three pages.
  @GetMapping(value = "/{id}/preview", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> preview(@PathVariable long id, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    Optional<Resource> found = service.byId(id);
    if (found.isEmpty() || !canSeeMetadata(found.get(), session)) {
      return ResponseEntity.notFound().build();
    }
    Path path = safePdfPath(found.get());
    if (path == null) {
      return ResponseEntity.notFound().build();
    }
    try {
      byte[] bytes;
      if (canRead(found.get(), session)) {
        bytes = Files.readAllBytes(path);
      } else {
        try (PDDocument source = PDDocument.load(path.toFile());
            PDDocument sample = new PDDocument();
            ByteArrayOutputStream output = new ByteArrayOutputStream()) {
          if (source.isEncrypted()) {
            return ResponseEntity.status(422).build();
          }
          int visiblePages = Math.min(3, source.getNumberOfPages());
          for (int i = 0; i < visiblePages; i++) {
            sample.importPage(source.getPage(i));
          }
          sample.save(output);
          bytes = output.toByteArray();
        }
      }
      return ResponseEntity.ok()
          .contentType(MediaType.APPLICATION_PDF)
          .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"EduShare-preview.pdf\"")
          .header("X-Content-Type-Options", "nosniff")
          .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
          .body(bytes);
    } catch (IOException ex) {
      return ResponseEntity.status(422).build();
    }
  }

  // Only real, embedded PDF bookmarks are shown. No guessed chapter/page indexes.
  public static final class PdfBookmark {

    @com.fasterxml.jackson.annotation.JsonProperty("title")
    private final String title;

    @com.fasterxml.jackson.annotation.JsonProperty("page")
    private final int page;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public PdfBookmark(
        @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
        @com.fasterxml.jackson.annotation.JsonProperty("page") int page) {
      this.title = title;
      this.page = page;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("title")
    public String getTitle() {
      return title;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("page")
    public int getPage() {
      return page;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      PdfBookmark value = (PdfBookmark) other;
      return java.util.Objects.equals(title, value.title)
          && java.util.Objects.equals(page, value.page);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(title);
      result = 31 * result + java.util.Objects.hashCode(page);
      return result;
    }

    @Override
    public String toString() {
      return "PdfBookmark[" + "title=" + title + ", page=" + page + "]";
    }
  }

  @GetMapping("/{id}/bookmarks")
  public ResponseEntity<List<PdfBookmark>> bookmarks(@PathVariable long id, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    Optional<Resource> found = service.byId(id);
    if (found.isEmpty() || !canSeeMetadata(found.get(), session)) {
      return ResponseEntity.notFound().build();
    }
    Path path = safePdfPath(found.get());
    if (path == null) {
      return ResponseEntity.notFound().build();
    }
    try (PDDocument pdf = PDDocument.load(path.toFile())) {
      List<PdfBookmark> result = new ArrayList<>();
      PDDocumentOutline outline = pdf.getDocumentCatalog().getDocumentOutline();
      if (outline != null) {
        collectBookmarks(outline.getFirstChild(), pdf, result, 0);
      }
      // Non-entitled readers should not be given a navigation index for locked pages.
      if (!canRead(found.get(), session)) {
        result.removeIf(item -> item.getPage() > 3);
      }
      return ResponseEntity.ok(result);
    } catch (IOException ex) {
      return ResponseEntity.ok(List.of());
    }
  }

  private void collectBookmarks(
      PDOutlineItem item, PDDocument pdf, List<PdfBookmark> out, int depth) throws IOException {
    if (depth > 12) {
      return;
    }
    for (PDOutlineItem current = item;
        current != null && out.size() < 150;
        current = current.getNextSibling()) {
      // findDestinationPage handles named and explicit PDF bookmark destinations.
      org.apache.pdfbox.pdmodel.PDPage page = current.findDestinationPage(pdf);
      if (page != null && current.getTitle() != null && !current.getTitle().isBlank()) {
        int index = pdf.getPages().indexOf(page);
        if (index >= 0) {
          out.add(new PdfBookmark(current.getTitle().trim(), index + 1));
        }
      }
      if (current.getFirstChild() != null) {
        collectBookmarks(current.getFirstChild(), pdf, out, depth + 1);
      }
    }
  }

  private Path safePdfPath(Resource resource) {
    if (resource.getFilePath() == null || resource.getFilePath().isBlank()) {
      return null;
    }
    try {
      Path path = resolveSavedUpload(resource.getFilePath());
      return path.startsWith(uploadDir.toAbsolutePath().normalize())
              && Files.isRegularFile(path)
              && path.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".pdf")
          ? path
          : null;
    } catch (RuntimeException ex) {
      return null;
    }
  }

  private boolean canSeeMetadata(Resource resource, HttpSession session) {
    String email = Objects.toString(session.getAttribute("email"), "");
    return "APPROVED".equalsIgnoreCase(resource.getStatus())
        || "ADMIN".equals(session.getAttribute("role"))
        || email.equalsIgnoreCase(resource.getUploaderEmail());
  }

  @GetMapping("/{id}/access")
  public ResponseEntity<Map<String, Boolean>> access(@PathVariable long id, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    return service
        .byId(id)
        .map(
            r -> {
              boolean present = false;
              if (r.getFilePath() != null && !r.getFilePath().isBlank()) {
                Path path = resolveSavedUpload(r.getFilePath());
                present =
                    path.startsWith(uploadDir.toAbsolutePath().normalize())
                        && Files.isRegularFile(path);
              }
              return ResponseEntity.ok(
                  Map.of("allowed", canRead(r, session), "available", present));
            })
        .orElse(ResponseEntity.notFound().build());
  }

  // Test-only entitlement. No real funds are processed, no card details stored.
  @PostMapping("/{id}/demo-unlock")
  public ResponseEntity<Map<String, String>> demoUnlock(
      @PathVariable long id, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    Optional<Resource> unlocked = service.byId(id);
    if (unlocked.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    if (!"Paid".equalsIgnoreCase(unlocked.get().getPriceType())) {
      return ResponseEntity.status(403).build();
    }
    if (!canSeeMetadata(unlocked.get(), session)) {
      return ResponseEntity.status(403).build();
    }
    String email = Objects.toString(session.getAttribute("email"), "");
    synchronized (store) {
      List<String> all = store.read("demo_resource_unlocks.txt");
      String token = TextFileStore.clean(email).toLowerCase(Locale.ROOT) + "|" + id;
      if (!all.contains(token)) {
        all.add(token);
        store.write("demo_resource_unlocks.txt", all);
      }
    }
    return ResponseEntity.ok(Map.of("status", "DEMO_UNLOCKED"));
  }

  private boolean canRead(Resource resource, HttpSession session) {
    try {
      long id = Long.parseLong(Objects.toString(session.getAttribute("userId"), ""));
      return ResourceAccess.canRead(resource, users.byId(id).orElse(null), store);
    } catch (NumberFormatException invalid) {
      return false;
    }
  }

  @PutMapping("/{id}")
  public ResponseEntity<Resource> update(
      @PathVariable long id, @RequestBody ResourceRequestDto d, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    if (d == null) {
      return ResponseEntity.badRequest().build();
    }
    Optional<Resource> existing = service.byId(id);
    if (existing.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    String email = Objects.toString(session.getAttribute("email"), "");
    boolean admin = "ADMIN".equals(session.getAttribute("role"));
    if (!admin && !email.equalsIgnoreCase(existing.get().getUploaderEmail())) {
      return ResponseEntity.status(403).build();
    }
    if (!Objects.equals(d.getPriceType(), existing.get().getPriceType())
        || !Objects.equals(d.getPrice(), existing.get().getPrice())) {
      new ResourceSellingRules(store).validate(d.getPriceType(), d.getPrice());
    }
    if (d.getTitle() == null
        || d.getTitle().isBlank()
        || d.getTitle().length() > 200
        || (d.getDescription() != null && d.getDescription().length() > 5000)) {
      return ResponseEntity.badRequest().build();
    }
    SellingPolicyStore policy = new SellingPolicyStore(store);
    String label = policy.storedDocumentType(id, existing.get().getResourceType());
    policy.validatePricing(label, d.getPriceType(), d.getTitle(), d.getDescription());
    Resource temp = fromDto(d, email);
    return service
        .update(id, temp)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  // are both required by the server, not just by the React modal.
  public static final class OwnerDeleteRequest {

    @com.fasterxml.jackson.annotation.JsonProperty("reason")
    private final String reason;

    @com.fasterxml.jackson.annotation.JsonProperty("feedback")
    private final String feedback;

    @com.fasterxml.jackson.annotation.JsonProperty("confirmation")
    private final String confirmation;

    @com.fasterxml.jackson.annotation.JsonCreator()
    public OwnerDeleteRequest(
        @com.fasterxml.jackson.annotation.JsonProperty("reason") String reason,
        @com.fasterxml.jackson.annotation.JsonProperty("feedback") String feedback,
        @com.fasterxml.jackson.annotation.JsonProperty("confirmation") String confirmation) {
      this.reason = reason;
      this.feedback = feedback;
      this.confirmation = confirmation;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("reason")
    public String getReason() {
      return reason;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("feedback")
    public String getFeedback() {
      return feedback;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("confirmation")
    public String getConfirmation() {
      return confirmation;
    }

    @Override
    public boolean equals(Object other) {
      if (this == other) {
        return true;
      }
      if (other == null || getClass() != other.getClass()) {
        return false;
      }
      OwnerDeleteRequest value = (OwnerDeleteRequest) other;
      return java.util.Objects.equals(reason, value.reason)
          && java.util.Objects.equals(feedback, value.feedback)
          && java.util.Objects.equals(confirmation, value.confirmation);
    }

    @Override
    public int hashCode() {
      int result = 0;
      result = 31 * result + java.util.Objects.hashCode(reason);
      result = 31 * result + java.util.Objects.hashCode(feedback);
      result = 31 * result + java.util.Objects.hashCode(confirmation);
      return result;
    }

    @Override
    public String toString() {
      return "OwnerDeleteRequest["
          + "reason="
          + reason
          + ", feedback="
          + feedback
          + ", confirmation="
          + confirmation
          + "]";
    }
  }

  // Owner deletion is intentionally a two-step action: feedback and typed confirmation
  @PostMapping("/{id}/owner-delete")
  public ResponseEntity<Map<String, String>> ownerDelete(
      @PathVariable long id, @RequestBody OwnerDeleteRequest request, HttpSession session) {
    if (session.getAttribute("userId") == null) {
      return ResponseEntity.status(401).build();
    }
    Optional<Resource> found = service.byId(id);
    if (found.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    Resource resource = found.get();
    String email = Objects.toString(session.getAttribute("email"), "");
    if (email.isBlank() || !email.equalsIgnoreCase(resource.getUploaderEmail())) {
      return ResponseEntity.status(403)
          .body(Map.of("error", "Only the uploader may delete this resource"));
    }
    String reason = Objects.toString(request.getReason(), "").trim();
    String feedback = Objects.toString(request.getFeedback(), "").trim();
    if (!"DELETE".equals(request.getConfirmation())
        || reason.isBlank()
        || feedback.length() < 10
        || feedback.length() > 1000) {
      return ResponseEntity.badRequest()
          .body(
              Map.of(
                  "error",
                  "Select a reason, enter feedback (10-1000 characters), and type" + " DELETE"));
    }
    synchronized (store) {
      // Recheck under the file lock so feedback and deletion stay together.
      Optional<Resource> latest = service.byId(id);
      if (latest.isEmpty()) {
        return ResponseEntity.notFound().build();
      }
      if (!email.equalsIgnoreCase(latest.get().getUploaderEmail())) {
        return ResponseEntity.status(403).body(Map.of("error", "Resource owner does not match"));
      }
      if (!service.delete(id)) {
        return ResponseEntity.notFound().build();
      }
      List<String> history = store.read("resource_deletion_feedback.txt");
      history.add(
          java.time.Instant.now()
              + "|"
              + id
              + "|"
              + TextFileStore.clean(email)
              + "|"
              + TextFileStore.clean(latest.get().getTitle())
              + "|"
              + TextFileStore.clean(reason)
              + "|"
              + TextFileStore.clean(feedback));
      store.write("resource_deletion_feedback.txt", history);
      // Cleanup references to deleted PDF without touching unrelated records.
      String resourceId = String.valueOf(id);
      List<String> bookmarks = store.read("bookmarks.txt");
      bookmarks.removeIf(
          line -> {
            String[] fields = line.split("\\|", -1);
            return fields.length > 1 && resourceId.equals(fields[1]);
          });
      store.write("bookmarks.txt", bookmarks);
      List<String> reviews = store.read("reviews.txt");
      reviews.removeIf(
          line -> {
            String[] fields = line.split("\\|", -1);
            return fields.length > 2 && resourceId.equals(fields[2]);
          });
      store.write("reviews.txt", reviews);
    }
    // The original PDF is retained in uploads for recovery by a developer/admin;
    // the deleted resource's API endpoints will no longer serve it.
    return ResponseEntity.ok(Map.of("status", "DELETED"));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable long id, HttpSession session) {
    if (!"ADMIN".equals(session.getAttribute("role"))) {
      return ResponseEntity.status(403).build();
    }
    return service.delete(id)
        ? ResponseEntity.noContent().build()
        : ResponseEntity.notFound().build();
  }

  private Resource saveDocument(Resource created, String label) {
    synchronized (store) {
      Resource saved = service.create(created);
      try {
        new SellingPolicyStore(store).rememberDocumentType(saved.getId(), label);
      } catch (RuntimeException failure) {
        service.delete(saved.getId());
        throw failure;
      }
      return saved;
    }
  }

  private Resource fromDto(ResourceRequestDto d, String email) {
    Resource r;
    switch (Objects.toString(d.getType(), "LECTURE_NOTE").toUpperCase()) {
      case "EBOOK":
        r = new EBook();
        break;
      case "PAST_PAPER":
        r = new PastPaper();
        break;
      default:
        r = new LectureNote();
        break;
    }
    r.setTitle(d.getTitle());
    r.setModuleCode(d.getModuleCode());
    r.setCategory(d.getCategory());
    r.setFileName(d.getFileName());
    r.setFilePath(d.getFilePath());
    r.setUploaderEmail(email);
    r.setPriceType(d.getPriceType());
    r.setPrice(d.getPrice() == null ? 0 : d.getPrice());
    r.setPages(d.getPages() == null ? 0 : d.getPages());
    r.setDescription(d.getDescription());
    r.setAcademicYear(d.getAcademicYear());
    r.setSemester(d.getSemester());
    r.setTags(d.getTags());
    r.setFileSize(d.getFileSize());
    return r;
  }
}

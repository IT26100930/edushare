package com.edushare.modules.download;

import com.edushare.modules.resource.*;
import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;
import jakarta.servlet.http.HttpSession;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/downloads")
public class DownloadController {
  private final TextFileStore store;
  private final ResourceService resources;
  private final UserService users;
  private final LinkFileRepository links;

  public DownloadController(
      TextFileStore store, ResourceService resources, UserService users, LinkFileRepository links) {
    this.store = store;
    this.resources = resources;
    this.users = users;
    this.links = links;
  }

  private User account(HttpSession session) {
    try {
      return users
          .byId(Long.parseLong(String.valueOf(session.getAttribute("userId"))))
          .filter(u -> !u.isSuspended())
          .orElse(null);
    } catch (NumberFormatException invalid) {
      return null;
    }
  }

  private boolean videoAllowed(Link link, User user) {
    if (link == null || !link.isOwnedVideo() || links.isHidden(link.getId())) return false;
    boolean owner =
        link.getUploaderEmail().equalsIgnoreCase(user.getEmail()) || "ADMIN".equals(user.getRole());
    if (!owner && !"APPROVED".equals(link.getStatus())) return false;
    return owner
        || "Free".equals(link.getPriceType())
        || ("Premium".equals(link.getPriceType()) && user.isPremium())
        || ("Paid".equals(link.getPriceType())
            && store.read("demo_video_unlocks.txt").contains(user.getId() + "|" + link.getId()));
  }

  private boolean visibleInLibrary(long id, User user) {
    if (id > 0)
      return resources.byId(id).map(r -> ResourceAccess.canRead(r, user, store)).orElse(false);
    if (id == 0 || id == Long.MIN_VALUE) return false;
    return videoAllowed(links.findByIdIncludingHidden(-id).orElse(null), user);
  }

  private boolean hasVideoFile(long id) {
    Path root = store.getDataDirectory().resolve("private-videos").toAbsolutePath().normalize();
    for (String row : store.read("owned-video-files.txt")) {
      String[] fields = row.split("\\|", -1);
      if (fields.length >= 2 && fields[0].equals(Long.toString(id))) {
        Path file = root.resolve(fields[1]).normalize();
        try {
          return file.startsWith(root)
              && Files.isRegularFile(file)
              && file.toRealPath().startsWith(root.toRealPath());
        } catch (java.io.IOException error) {
          return false;
        }
      }
    }
    return false;
  }

  @PostMapping("/{resourceId}")
  public ResponseEntity<?> download(@PathVariable long resourceId, HttpSession session) {
    User user = account(session);
    if (user == null) return ResponseEntity.status(401).build();
    if (resourceId > 0) {
      Resource resource = resources.byId(resourceId).orElse(null);
      if (resource == null) return ResponseEntity.notFound().build();
      if (!ResourceAccess.canRead(resource, user, store)) return ResponseEntity.status(403).build();
      if (!Files.isRegularFile(ManagedUploads.resolve(store, resource.getFilePath())))
        return ResponseEntity.notFound().build();
    } else {
      if (resourceId == 0 || resourceId == Long.MIN_VALUE) return ResponseEntity.notFound().build();
      Link video = links.findByIdIncludingHidden(-resourceId).orElse(null);
      if (video == null || !video.isOwnedVideo()) return ResponseEntity.notFound().build();
      if (!videoAllowed(video, user)) return ResponseEntity.status(403).build();
      if (!hasVideoFile(video.getId())) return ResponseEntity.notFound().build();
    }
    synchronized (store) {
      List<String> rows = store.read("downloads.txt");
      rows.add(user.getId() + "|" + resourceId + "|" + LocalDateTime.now());
      store.write("downloads.txt", rows);
    }
    return ResponseEntity.ok(Map.of("resourceId", resourceId, "recorded", true));
  }

  @GetMapping("/history")
  public ResponseEntity<?> history(HttpSession session) {
    User user = account(session);
    if (user == null) return ResponseEntity.status(401).build();
    String prefix = user.getId() + "|";
    return ResponseEntity.ok(
        store.read("downloads.txt").stream().filter(row -> row.startsWith(prefix)).toList());
  }

  @GetMapping("/library")
  public ResponseEntity<?> library(HttpSession session) {
    User user = account(session);
    if (user == null) return ResponseEntity.status(401).build();
    Set<Long> downloaded = new LinkedHashSet<>(), purchased = new LinkedHashSet<>();
    for (String row : store.read("downloads.txt")) {
      String[] fields = row.split("\\|", -1);
      try {
        long id = Long.parseLong(fields[1]);
        if (fields[0].equals(Long.toString(user.getId())) && visibleInLibrary(id, user))
          downloaded.add(id);
      } catch (RuntimeException invalid) {
        /* Ignore old malformed history rows. */
      }
    }
    for (String row : store.read("demo_resource_unlocks.txt")) {
      String[] fields = row.split("\\|", -1);
      try {
        long id = Long.parseLong(fields[1]);
        if (id > 0 && fields[0].equalsIgnoreCase(user.getEmail()) && visibleInLibrary(id, user))
          purchased.add(id);
      } catch (RuntimeException invalid) {
      }
    }
    for (String row : store.read("demo_video_unlocks.txt")) {
      String[] fields = row.split("\\|", -1);
      try {
        long id = Long.parseLong(fields[1]);
        if (id > 0 && fields[0].equals(Long.toString(user.getId())) && visibleInLibrary(-id, user))
          purchased.add(-id);
      } catch (RuntimeException invalid) {
      }
    }
    return ResponseEntity.ok(Map.of("downloaded", downloaded, "purchased", purchased));
  }
}

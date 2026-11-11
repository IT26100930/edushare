package com.edushare.modules.review;

import com.edushare.modules.download.Link;
import com.edushare.modules.download.LinkFileRepository;
import com.edushare.modules.resource.DiscussionAccess;
import com.edushare.modules.resource.Resource;
import com.edushare.modules.resource.ResourceService;
import com.edushare.modules.user.User;
import com.edushare.modules.user.UserService;
import jakarta.servlet.http.HttpSession;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
  private final ReviewService service;
  private final ResourceService resources;
  private final LinkFileRepository links;
  private final UserService users;
  private final DiscussionAccess access;

  public ReviewController(
      ReviewService service,
      ResourceService resources,
      LinkFileRepository links,
      UserService users,
      DiscussionAccess access) {
    this.service = service;
    this.resources = resources;
    this.links = links;
    this.users = users;
    this.access = access;
  }

  private User viewer(HttpSession session) {
    Object id = session.getAttribute("userId");
    if (id == null) return null;
    try {
      return users
          .byId(Long.parseLong(id.toString()))
          .filter(user -> !user.isSuspended())
          .orElse(null);
    } catch (NumberFormatException exception) {
      return null;
    }
  }

  private ResponseEntity<?> error(int status, String message) {
    return ResponseEntity.status(status).body(Map.of("error", message));
  }

  private String ownerEmail(long id) {
    if (id == 0 || id == Long.MIN_VALUE) return null;
    if (id > 0) return resources.byId(id).map(Resource::getUploaderEmail).orElse(null);
    return links.findByIdIncludingHidden(-id).map(Link::getUploaderEmail).orElse(null);
  }

  private boolean valid(PublicReview input) {
    return input != null
        && input.getRating() >= 1
        && input.getRating() <= 5
        && input.getComment() != null
        && !input.getComment().isBlank()
        && input.getComment().trim().length() <= 2000;
  }

  @GetMapping
  public ResponseEntity<?> all(
      @RequestParam(required = false) Long resourceId, HttpSession session) {
    User user = viewer(session);
    if (user == null) return error(401, "Please sign in to read reviews.");
    if (resourceId != null && !access.allowed(resourceId, user.getId()))
      return error(404, "Resource is unavailable.");
    List<Review> visible = new ArrayList<>();
    for (Review review : service.all()) {
      if ((resourceId == null || review.getResourceId() == resourceId)
          && access.allowed(review.getResourceId(), user.getId())) visible.add(review);
    }
    return ResponseEntity.ok(visible);
  }

  @PostMapping
  public ResponseEntity<?> create(@RequestBody PublicReview input, HttpSession session) {
    User user = viewer(session);
    if (user == null) return error(401, "Please sign in to post a review.");
    if (!valid(input))
      return error(400, "Choose 1-5 stars and write a review of 1-2000 characters.");
    String owner = ownerEmail(input.getResourceId());
    if (owner == null || !access.allowed(input.getResourceId(), user.getId()))
      return error(404, "Resource is unavailable.");
    if (owner.equalsIgnoreCase(user.getEmail()))
      return error(403, "You cannot review your own resource.");
    synchronized (service) {
      for (Review existing : service.forResource(input.getResourceId())) {
        if (existing.getUserId() == user.getId())
          return error(409, "You have already reviewed this resource. Edit your review instead.");
      }
      input.setId(0);
      input.setUserId(user.getId());
      input.setComment(input.getComment().trim());
      return ResponseEntity.status(201).body(service.save(input));
    }
  }

  @PutMapping("/{id}")
  public ResponseEntity<?> update(
      @PathVariable long id, @RequestBody PublicReview input, HttpSession session) {
    User user = viewer(session);
    if (user == null) return error(401, "Please sign in to edit a review.");
    synchronized (service) {
      Review existing =
          service.all().stream().filter(review -> review.getId() == id).findFirst().orElse(null);
      if (existing == null) return error(404, "Review no longer exists.");
      if (existing.getUserId() != user.getId() && !"ADMIN".equals(user.getRole()))
        return error(403, "You can only edit your own review.");
      if (!access.allowed(existing.getResourceId(), user.getId()))
        return error(404, "Resource is unavailable.");
      if (!valid(input))
        return error(400, "Choose 1-5 stars and write a review of 1-2000 characters.");
      // Never move a review to another resource, change its author or change its variant.
      existing.setRating(input.getRating());
      existing.setComment(input.getComment().trim());
      return ResponseEntity.ok(service.save(existing));
    }
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable long id, HttpSession session) {
    User user = viewer(session);
    if (user == null) return error(401, "Please sign in to delete a review.");
    synchronized (service) {
      Review existing =
          service.all().stream().filter(review -> review.getId() == id).findFirst().orElse(null);
      if (existing == null) return error(404, "Review no longer exists.");
      if (existing.getUserId() != user.getId() && !"ADMIN".equals(user.getRole()))
        return error(403, "You can only delete your own review.");
      return service.delete(id)
          ? ResponseEntity.noContent().build()
          : error(404, "Review no longer exists.");
    }
  }
}

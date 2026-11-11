package com.edushare.modules.download;

import com.edushare.modules.user.UserService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/bookmarks")
public class BookmarkController {

    private final PersonalLibraryService library;

    private final UserService users;

    public BookmarkController(PersonalLibraryService library, UserService users) {
        this.library = library;
        this.users = users;
    }

    private Long user(HttpSession s) {
        try {
            long id = Long.parseLong(String.valueOf(s.getAttribute("userId")));
            return users.byId(id).filter(u -> !u.isSuspended()).map(u -> id).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping
    public ResponseEntity<?> all(HttpSession s) {
        Long uid = user(s);
        return uid == null
                ? ResponseEntity.status(401).build()
                : ResponseEntity.ok(library.state(uid).get("bookmarks"));
    }

    @PostMapping("/{resourceId}")
    public ResponseEntity<Void> add(@PathVariable long resourceId, HttpSession s) {
        Long uid = user(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        library.bookmark(uid, resourceId, true);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{resourceId}")
    public ResponseEntity<Void> remove(@PathVariable long resourceId, HttpSession s) {
        Long uid = user(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        library.bookmark(uid, resourceId, false);
        return ResponseEntity.noContent().build();
    }
}

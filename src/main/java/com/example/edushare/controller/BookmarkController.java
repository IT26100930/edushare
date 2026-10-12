package com.example.edushare.controller;

import com.example.edushare.model.Bookmark;
import com.example.edushare.model.Resource;
import com.example.edushare.model.User;
import com.example.edushare.service.BookmarkService;
import com.example.edushare.service.ResourceService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.ArrayList;
import java.util.List;

@Controller
public class BookmarkController {

    private final BookmarkService bookmarkService;
    private final ResourceService resourceService;
    private final UserService userService;

    public BookmarkController(BookmarkService bookmarkService, ResourceService resourceService,
                              UserService userService) {
        this.bookmarkService = bookmarkService;
        this.resourceService = resourceService;
        this.userService = userService;
    }

    @GetMapping("/bookmarks")
    public String list(Model model, HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        List<Resource> saved = new ArrayList<>();
        for (Bookmark b : bookmarkService.findByUser(user.getId())) {
            Resource r = resourceService.findById(b.getResourceId());
            if (r != null) {
                saved.add(r);
            }
        }
        model.addAttribute("cards", resourceService.toCards(saved, user));
        return "bookmarks";
    }

    @PostMapping("/bookmarks/toggle/{id}")
    public String toggle(@PathVariable("id") String id,
                         @RequestHeader(name = "Referer", required = false) String referer,
                         HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        bookmarkService.toggle(user.getId(), id);
        return "redirect:" + (referer == null || referer.isBlank() ? "/bookmarks" : referer);
    }
}

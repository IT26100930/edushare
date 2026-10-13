package com.example.edushare.controller;

import com.example.edushare.model.Resource;
import com.example.edushare.model.Review;
import com.example.edushare.model.User;
import com.example.edushare.service.ResourceService;
import com.example.edushare.service.ReviewService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.HashMap;
import java.util.Map;

@Controller
public class ReviewController {

    private final ReviewService reviewService;
    private final ResourceService resourceService;
    private final UserService userService;

    public ReviewController(ReviewService reviewService, ResourceService resourceService, UserService userService) {
        this.reviewService = reviewService;
        this.resourceService = resourceService;
        this.userService = userService;
    }

    @GetMapping("/reviews")
    public String list(Model model) {
        Map<String, String> titles = new HashMap<>();
        for (Resource r : resourceService.findAll()) {
            titles.put(r.getId(), r.getTitle());
        }
        model.addAttribute("reviews", reviewService.findAll());
        model.addAttribute("titles", titles);
        return "reviews";
    }

    @PostMapping("/reviews/add")
    public String add(@RequestParam("resourceId") String resourceId, @RequestParam("rating") int rating,
                      @RequestParam("comment") String comment, HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        try {
            Review r = reviewService.add(user, resourceId, rating, comment);
            ra.addFlashAttribute("msg", "Thanks! Your " + r.getKindLabel().toLowerCase() + " was posted.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/resources/" + resourceId;
    }

    @PostMapping("/reviews/{id}/delete")
    public String delete(@PathVariable("id") String id, HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null || !user.isAdmin()) {
            ra.addFlashAttribute("error", "Only admins can delete reviews.");
            return "redirect:/reviews";
        }
        reviewService.delete(id);
        ra.addFlashAttribute("msg", "Review deleted.");
        return "redirect:/reviews";
    }
}

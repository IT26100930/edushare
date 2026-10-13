package com.example.edushare.controller;

import com.example.edushare.model.Resource;
import com.example.edushare.model.User;
import com.example.edushare.service.CategoryService;
import com.example.edushare.service.MembershipService;
import com.example.edushare.service.ResourceService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;

import java.util.List;

@Controller
public class HomeController {

    private final ResourceService resourceService;
    private final CategoryService categoryService;
    private final UserService userService;

    public HomeController(ResourceService resourceService, CategoryService categoryService, UserService userService) {
        this.resourceService = resourceService;
        this.categoryService = categoryService;
        this.userService = userService;
    }

    @GetMapping("/")
    public String index(Model model, HttpSession session) {
        User user = userService.current(session);
        List<Resource> all = resourceService.findAll();
        model.addAttribute("latest", resourceService.toCards(all.stream().limit(6).toList(), user));
        model.addAttribute("premiumCards", resourceService.toCards(
                resourceService.findPremium().stream().limit(3).toList(), user));
        model.addAttribute("categoryCounts", categoryService.counts());
        model.addAttribute("resourceTotal", all.size());
        model.addAttribute("memberTotal", userService.findAll().size());
        model.addAttribute("categoryTotal", categoryService.findAll().size());
        return "index";
    }

    /** Adds the logged-in user and watermark text to every page (used by the navbar). */
    @ControllerAdvice
    public static class GlobalModel {

        private final UserService userService;
        private final MembershipService membershipService;

        public GlobalModel(UserService userService, MembershipService membershipService) {
            this.userService = userService;
            this.membershipService = membershipService;
        }

        @ModelAttribute("currentUser")
        public User currentUser(HttpSession session) {
            return userService.current(session);
        }

        @ModelAttribute("watermark")
        public String watermark(HttpSession session) {
            return membershipService.watermark(userService.current(session));
        }
    }
}

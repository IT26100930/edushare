package com.example.edushare.controller;

import com.example.edushare.model.User;
import com.example.edushare.service.CategoryService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class CategoryController {

    private final CategoryService categoryService;
    private final UserService userService;

    public CategoryController(CategoryService categoryService, UserService userService) {
        this.categoryService = categoryService;
        this.userService = userService;
    }

    @GetMapping("/categories")
    public String list(Model model) {
        model.addAttribute("categoryCounts", categoryService.counts());
        return "categories";
    }

    @PostMapping("/categories/add")
    public String add(@RequestParam("name") String name,
                      @RequestParam(name = "color", defaultValue = "") String color,
                      HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null || !user.isAdmin()) {
            ra.addFlashAttribute("error", "Only admins can add categories.");
            return "redirect:/categories";
        }
        try {
            categoryService.add(name, color);
            ra.addFlashAttribute("msg", "Category added.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/categories";
    }
}

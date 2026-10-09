package com.example.edushare.controller;

import com.example.edushare.model.User;
import com.example.edushare.service.BookmarkService;
import com.example.edushare.service.DownloadService;
import com.example.edushare.service.ResourceService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class UserController {

    private final UserService userService;
    private final DownloadService downloadService;
    private final BookmarkService bookmarkService;
    private final ResourceService resourceService;

    public UserController(UserService userService, DownloadService downloadService,
                          BookmarkService bookmarkService, ResourceService resourceService) {
        this.userService = userService;
        this.downloadService = downloadService;
        this.bookmarkService = bookmarkService;
        this.resourceService = resourceService;
    }

    @GetMapping("/login")
    public String loginPage(HttpSession session) {
        return userService.current(session) != null ? "redirect:/" : "login";
    }

    @PostMapping("/login")
    public String login(@RequestParam("email") String email, @RequestParam("password") String password,
                        HttpSession session, RedirectAttributes ra) {
        User u = userService.login(email, password);
        if (u == null) {
            ra.addFlashAttribute("error", "Invalid email or password.");
            return "redirect:/login";
        }
        session.setAttribute(UserService.SESSION_KEY, u.getId());
        ra.addFlashAttribute("msg", "Welcome back, " + u.getName() + "!");
        return "redirect:/";
    }

    @GetMapping("/register")
    public String registerPage(HttpSession session) {
        return userService.current(session) != null ? "redirect:/" : "register";
    }

    @PostMapping("/register")
    public String register(@RequestParam("name") String name, @RequestParam("email") String email,
                           @RequestParam("password") String password, @RequestParam("confirm") String confirm,
                           HttpSession session, RedirectAttributes ra) {
        try {
            if (!password.equals(confirm)) {
                throw new IllegalArgumentException("Passwords do not match.");
            }
            User u = userService.register(name, email, password);
            session.setAttribute(UserService.SESSION_KEY, u.getId());
            ra.addFlashAttribute("msg", "Welcome to EduShare, " + u.getName() + "!");
            return "redirect:/";
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
            return "redirect:/register";
        }
    }

    @PostMapping("/logout")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/login";
    }

    @GetMapping("/profile")
    public String profile(HttpSession session, Model model) {
        User u = userService.current(session);
        if (u == null) {
            return "redirect:/login";
        }
        model.addAttribute("downloadCount", downloadService.countByUser(u.getId()));
        model.addAttribute("bookmarkCount", bookmarkService.countByUser(u.getId()));
        model.addAttribute("uploadCount", resourceService.findByUploader(u.getId()).size());
        return "profile";
    }

    @PostMapping("/profile/name")
    public String updateName(@RequestParam("name") String name, HttpSession session, RedirectAttributes ra) {
        User u = userService.current(session);
        if (u == null) {
            return "redirect:/login";
        }
        try {
            userService.updateName(u, name);
            ra.addFlashAttribute("msg", "Profile updated.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/profile";
    }

    @PostMapping("/profile/password")
    public String changePassword(@RequestParam("oldPassword") String oldPassword,
                                 @RequestParam("newPassword") String newPassword,
                                 HttpSession session, RedirectAttributes ra) {
        User u = userService.current(session);
        if (u == null) {
            return "redirect:/login";
        }
        try {
            userService.changePassword(u, oldPassword, newPassword);
            ra.addFlashAttribute("msg", "Password changed.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/profile";
    }
}

package com.example.edushare.controller;

import com.example.edushare.model.User;
import com.example.edushare.service.CategoryService;
import com.example.edushare.service.DownloadService;
import com.example.edushare.service.RequestService;
import com.example.edushare.service.ResourceService;
import com.example.edushare.service.SubscriptionService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;

@Controller
public class AdminController {

    private final UserService userService;
    private final ResourceService resourceService;
    private final CategoryService categoryService;
    private final DownloadService downloadService;
    private final RequestService requestService;
    private final SubscriptionService subscriptionService;

    public AdminController(UserService userService, ResourceService resourceService,
                           CategoryService categoryService, DownloadService downloadService,
                           RequestService requestService, SubscriptionService subscriptionService) {
        this.userService = userService;
        this.resourceService = resourceService;
        this.categoryService = categoryService;
        this.downloadService = downloadService;
        this.requestService = requestService;
        this.subscriptionService = subscriptionService;
    }

    private boolean notAdmin(HttpSession session) {
        User u = userService.current(session);
        return u == null || !u.isAdmin();
    }

    @GetMapping("/admin")
    public String dashboard(HttpSession session, Model model, RedirectAttributes ra) {
        if (notAdmin(session)) {
            ra.addFlashAttribute("error", "Admin access only.");
            return "redirect:/";
        }
        model.addAttribute("userTotal", userService.findAll().size());
        model.addAttribute("premiumTotal", userService.findAll().stream().filter(User::isPremium)
                .filter(u -> !u.isAdmin()).count());
        model.addAttribute("resourceTotal", resourceService.findAll().size());
        model.addAttribute("downloadTotal", downloadService.findAll().size());
        model.addAttribute("openRequests", requestService.findAll().stream().filter(r -> r.isOpen()).count());
        model.addAttribute("categoryTotal", categoryService.findAll().size());
        model.addAttribute("revenue", String.format("%,d", subscriptionService.totalRevenue()));
        model.addAttribute("resources", resourceService.findAll());
        return "admin";
    }

    @GetMapping("/admin/users")
    public String users(HttpSession session, Model model, RedirectAttributes ra) {
        if (notAdmin(session)) {
            ra.addFlashAttribute("error", "Admin access only.");
            return "redirect:/";
        }
        model.addAttribute("users", userService.findAll());
        return "admin-users";
    }

    @PostMapping("/admin/users/{id}/grant")
    public String grant(@PathVariable("id") String id, HttpSession session, RedirectAttributes ra) {
        if (notAdmin(session)) {
            return "redirect:/";
        }
        userService.upgrade(id, LocalDate.now().plusMonths(1).toString());
        ra.addFlashAttribute("msg", "Granted one month of Premium.");
        return "redirect:/admin/users";
    }

    @PostMapping("/admin/users/{id}/revoke")
    public String revoke(@PathVariable("id") String id, HttpSession session, RedirectAttributes ra) {
        if (notAdmin(session)) {
            return "redirect:/";
        }
        subscriptionService.cancel(id);
        ra.addFlashAttribute("msg", "Premium revoked.");
        return "redirect:/admin/users";
    }

    @PostMapping("/admin/users/{id}/delete")
    public String delete(@PathVariable("id") String id, HttpSession session, RedirectAttributes ra) {
        User me = userService.current(session);
        if (me == null || !me.isAdmin()) {
            return "redirect:/";
        }
        if (me.getId().equals(id)) {
            ra.addFlashAttribute("error", "You cannot delete your own account.");
        } else {
            userService.delete(id);
            ra.addFlashAttribute("msg", "User deleted.");
        }
        return "redirect:/admin/users";
    }

    @GetMapping("/admin/subscriptions")
    public String subscriptions(HttpSession session, Model model, RedirectAttributes ra) {
        if (notAdmin(session)) {
            ra.addFlashAttribute("error", "Admin access only.");
            return "redirect:/";
        }
        model.addAttribute("views", subscriptionService.allViews());
        model.addAttribute("revenue", String.format("%,d", subscriptionService.totalRevenue()));
        return "admin-subscriptions";
    }
}

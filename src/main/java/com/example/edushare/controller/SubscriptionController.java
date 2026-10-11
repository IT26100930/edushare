package com.example.edushare.controller;

import com.example.edushare.model.Subscription;
import com.example.edushare.model.User;
import com.example.edushare.service.MembershipService;
import com.example.edushare.service.SubscriptionService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;


@Controller
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final UserService userService;

    public SubscriptionController(SubscriptionService subscriptionService, UserService userService) {
        this.subscriptionService = subscriptionService;
        this.userService = userService;
    }

    @GetMapping("/premium")
    public String premium(Model model) {
        model.addAttribute("monthlyPrice", MembershipService.MONTHLY_PRICE);
        model.addAttribute("yearlyPrice", "4,999");
        return "premium";
    }

    @GetMapping("/checkout")
    public String checkoutPage(@RequestParam(name = "plan", defaultValue = "MONTHLY") String plan,
                               Model model, HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null) {
            ra.addFlashAttribute("error", "Please log in or register before upgrading.");
            return "redirect:/login";
        }
        if (user.isAdmin()) {
            ra.addFlashAttribute("error", "Admins already have full access.");
            return "redirect:/premium";
        }
        String p = SubscriptionService.normalise(plan);
        model.addAttribute("plan", p);
        model.addAttribute("planLabel", "YEARLY".equals(p) ? "Yearly" : "Monthly");
        model.addAttribute("price", String.format("%,d", SubscriptionService.priceFor(p)));
        return "checkout";
    }

    @PostMapping("/checkout")
    public String checkout(@RequestParam("plan") String plan, HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null || user.isAdmin()) {
            return "redirect:/login";
        }
        Subscription s = subscriptionService.subscribe(user, plan);
        return "redirect:/payment-success?id=" + s.getId();
    }

    @GetMapping("/payment-success")
    public String success(@RequestParam("id") String id, Model model, HttpSession session) {
        User user = userService.current(session);
        Subscription s = subscriptionService.findById(id);
        if (user == null || s == null || !s.getUserId().equals(user.getId())) {
            return "redirect:/premium";
        }
        model.addAttribute("sub", s);
        return "payment-success";
    }

    @GetMapping("/subscription")
    public String subscription(Model model, HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        model.addAttribute("active", subscriptionService.findActiveFor(user.getId()));
        model.addAttribute("history", subscriptionService.historyFor(user.getId()));
        return "subscription";
    }

    @PostMapping("/subscription/cancel")
    public String cancel(HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        subscriptionService.cancel(user.getId());
        ra.addFlashAttribute("msg", "Subscription cancelled. You are back on the free plan.");
        return "redirect:/subscription";
    }
}

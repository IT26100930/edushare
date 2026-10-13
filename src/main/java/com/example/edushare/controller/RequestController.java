package com.example.edushare.controller;

import com.example.edushare.model.User;
import com.example.edushare.service.RequestService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class RequestController {

    private final RequestService requestService;
    private final UserService userService;

    public RequestController(RequestService requestService, UserService userService) {
        this.requestService = requestService;
        this.userService = userService;
    }

    @GetMapping("/requests")
    public String list(Model model) {
        model.addAttribute("requests", requestService.findAll());
        return "requests";
    }

    @PostMapping("/requests/add")
    public String add(@RequestParam("title") String title,
                      @RequestParam(name = "description", defaultValue = "") String description,
                      HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        try {
            requestService.create(user, title, description);
            ra.addFlashAttribute("msg", "Request posted. The community can see it now.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/requests";
    }

    @PostMapping("/requests/{id}/fulfil")
    public String fulfil(@PathVariable("id") String id, HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        requestService.markFulfilled(user, id);
        return "redirect:/requests";
    }

    @PostMapping("/requests/{id}/delete")
    public String delete(@PathVariable("id") String id, HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        requestService.delete(user, id);
        return "redirect:/requests";
    }
}

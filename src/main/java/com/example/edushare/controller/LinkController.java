package com.example.edushare.controller;

import com.example.edushare.model.User;
import com.example.edushare.service.LinkService;
import com.example.edushare.service.UserService;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** "Watch & Read": curated video and article links. */
@Controller
public class LinkController {

    private final LinkService linkService;
    private final UserService userService;

    public LinkController(LinkService linkService, UserService userService) {
        this.linkService = linkService;
        this.userService = userService;
    }

    @GetMapping("/links")
    public String list(@RequestParam(name = "kind", required = false) String kind, Model model) {
        String k = "VIDEO".equals(kind) || "ARTICLE".equals(kind) ? kind : "";
        model.addAttribute("links", k.isEmpty() ? linkService.findAll() : linkService.findByKind(k));
        model.addAttribute("selKind", k);
        return "links";
    }

    @PostMapping("/links/add")
    public String add(@RequestParam("kind") String kind, @RequestParam("title") String title,
                      @RequestParam("url") String url,
                      @RequestParam(name = "description", defaultValue = "") String description,
                      @RequestParam(name = "extra", defaultValue = "") String extra,
                      HttpSession session, RedirectAttributes ra) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        try {
            linkService.add(user, kind, title, url, description, extra);
            ra.addFlashAttribute("msg", "Link added to Watch & Read.");
        } catch (IllegalArgumentException e) {
            ra.addFlashAttribute("error", e.getMessage());
        }
        return "redirect:/links";
    }

    @PostMapping("/links/{id}/delete")
    public String delete(@PathVariable("id") String id, HttpSession session) {
        User user = userService.current(session);
        if (user == null) {
            return "redirect:/login";
        }
        linkService.delete(user, id);
        return "redirect:/links";
    }
}

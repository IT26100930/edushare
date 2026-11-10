package com.edushare.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    @GetMapping({
        "/",
        "/browse",
        "/login",
        "/register",
        "/verify",
        "/profile",
        "/pricing",
        "/admin",
        "/admin/login",
        "/admin/register",
        "/admin/setup",
        "/admin/dashboard",
        "/share",
        "/community",
        "/requests",
        "/terms",
        "/privacy",
        "/academic-integrity",
        "/notifications",
        "/my-reports",
        "/forgot-password",
        "/verify-email",
        "/email-reset",
        "/reset-password",
        "/admin/recover"
    })
    public String app() {
        return "forward:/index.html";
    }

    @GetMapping({
        "/secure-admin",
        "/secure-admin/",
        "/secure-admin/login",
        "/secure-admin/login/",
        "/admin/login/"
    })
    public String adminLogin() {
        return "redirect:/admin/login";
    }

    @GetMapping({
        "/admin/dashboard/",
        "/admin/",
        "/secure-admin/dashboard",
        "/secure-admin/dashboard/"
    })
    public String adminDashboard() {
        return "redirect:/admin/dashboard";
    }

    @GetMapping({"/secure-admin/setup", "/secure-admin/setup/", "/admin/setup/"})
    public String adminSetup() {
        return "redirect:/admin/setup";
    }

    @GetMapping({"/secure-admin/recover", "/secure-admin/recover/", "/admin/recover/"})
    public String adminRecovery() {
        return "redirect:/admin/recover";
    }

    @GetMapping({"/admin/register/", "/secure-admin/register"})
    public String adminRegister() {
        return "redirect:/admin/register";
    }

    @GetMapping({"/admin/profile", "/secure-admin/profile"})
    public String adminProfile() {
        return "redirect:/profile";
    }

    @GetMapping({"/resource/{id}", "/u/{username}", "/community/groups/{id}"})
    public String dynamic() {
        return "forward:/index.html";
    }
}

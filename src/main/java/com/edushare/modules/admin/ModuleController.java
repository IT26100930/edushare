package com.edushare.modules.admin;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ModuleController {

    private final AcademicModuleFileRepository modules;

    private final CategoryFileRepository categories;

    private final com.edushare.modules.user.UserService users;

    public ModuleController(
            AcademicModuleFileRepository modules,
            CategoryFileRepository categories,
            com.edushare.modules.user.UserService users) {
        this.modules = modules;
        this.categories = categories;
        this.users = users;
    }

    private boolean knownCategory(String name) {
        return name != null
                && categories.findAll().stream()
                        .anyMatch(category -> category.getName().equalsIgnoreCase(name.trim()));
    }

    private boolean admin(HttpSession session) {
    Object id = session.getAttribute("userId");

    if (id == null) {
        return false;
    }

    try {
        return users.byId(Long.parseLong(id.toString()))
                .filter(u -> "ADMIN".equals(u.getRole()) && !u.isSuspended())
                .isPresent();
    } catch (NumberFormatException e) {
        return false;
    }
}

    @GetMapping("/api/modules")
    public List<AcademicModule> publicModules() {
        return modules.findAll().stream().filter(AcademicModule::isActive).toList();
    }

    @GetMapping("/api/admin/modules")
    public ResponseEntity<List<AcademicModule>> adminModules(HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(modules.findAll());
    }

    @PostMapping("/api/admin/modules")
    public ResponseEntity<AcademicModule> add(
            @RequestBody AcademicModule module, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (module.getCode() == null
                || module.getCode().isBlank()
                || module.getName() == null
                || module.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        module.setCode(module.getCode().trim().toUpperCase());
        if (!knownCategory(module.getFacultySubject())) {
            return ResponseEntity.badRequest().build();
        }
        module.setFacultySubject(
                categories.findAll().stream()
                        .filter(
                                c ->
                                        c.getName()
                                                .equalsIgnoreCase(
                                                        module.getFacultySubject().trim()))
                        .findFirst()
                        .orElseThrow()
                        .getName());
        if (modules.findAll().stream()
                .anyMatch(m -> m.getCode().equalsIgnoreCase(module.getCode()))) {
            return ResponseEntity.status(409).build();
        }
        module.setId(0);
        return ResponseEntity.ok(modules.save(module));
    }

    @PutMapping("/api/admin/modules/{id}")
    public ResponseEntity<AcademicModule> edit(
            @PathVariable long id, @RequestBody AcademicModule module, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (modules.findAll().stream().noneMatch(m -> m.getId() == id)) {
            return ResponseEntity.notFound().build();
        }
        if (module.getCode() == null
                || module.getCode().isBlank()
                || module.getName() == null
                || module.getName().isBlank()
                || !knownCategory(module.getFacultySubject())) {
            return ResponseEntity.badRequest().build();
        }
        module.setId(id);
        module.setCode(module.getCode().trim().toUpperCase());
        module.setFacultySubject(
                categories.findAll().stream()
                        .filter(
                                c ->
                                        c.getName()
                                                .equalsIgnoreCase(
                                                        module.getFacultySubject().trim()))
                        .findFirst()
                        .orElseThrow()
                        .getName());
        if (modules.findAll().stream()
                .anyMatch(m -> m.getId() != id && m.getCode().equalsIgnoreCase(module.getCode()))) {
            return ResponseEntity.status(409).build();
        }
        return ResponseEntity.ok(modules.save(module));
    }

    @DeleteMapping("/api/admin/modules/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        return modules.delete(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}

package com.edushare.controller;

import com.edushare.modules.admin.AcademicModule;
import com.edushare.modules.admin.AcademicModuleFileRepository;
import com.edushare.modules.resource.ResourceService;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/** Public counts from saved data files, never illustrative dashboard numbers. */
@RestController
public class PublicMetricsController {

    private final UserService users;

    private final ResourceService resources;

    private final AcademicModuleFileRepository modules;

    private final TextFileStore store;

    public PublicMetricsController(
            UserService users,
            ResourceService resources,
            AcademicModuleFileRepository modules,
            TextFileStore store) {
        this.users = users;
        this.resources = resources;
        this.modules = modules;
        this.store = store;
    }

    @GetMapping("/api/public/stats")
    public Map<String, Object> stats() {
        Map<String, Object> results = new LinkedHashMap<>();
        results.put("members", users.all().size());
        results.put(
                "resources",
                resources.all(null, null, null).stream()
                        .filter(resource -> "APPROVED".equalsIgnoreCase(resource.getStatus()))
                        .count());
        results.put("modules", modules.findAll().stream().filter(AcademicModule::isActive).count());
        Map<String, Long> days = new LinkedHashMap<>();
        LocalDate now = LocalDate.now();
        for (int offset = 6; offset >= 0; offset--) {
            days.put(now.minusDays(offset).toString(), 0L);
        }
        for (String line : store.read("downloads.txt")) {
            String[] parts = line.split("\\|", -1);
            if (parts.length >= 3 && parts[2].length() >= 10) {
                String date = parts[2].substring(0, 10);
                if (days.containsKey(date)) {
                    days.put(date, days.get(date) + 1);
                }
            }
        }
        results.put("downloadsByDay", days);
        return results;
    }
}

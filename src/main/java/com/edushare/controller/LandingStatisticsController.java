package com.edushare.controller;

import com.edushare.modules.admin.AcademicModuleFileRepository;
import com.edushare.modules.community.StudyGroupFileRepository;
import com.edushare.modules.resource.Resource;
import com.edushare.modules.resource.ResourceFileRepository;
import com.edushare.shared.TextFileStore;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Read-only, aggregate statistics for the public landing page. Never returns individual users, file
 * paths, private resources or credentials.
 */
@RestController
@RequestMapping("/api/public/landing-stats")
public class LandingStatisticsController {

    private final ResourceFileRepository resources;

    private final AcademicModuleFileRepository modules;

    private final StudyGroupFileRepository groups;

    private final TextFileStore store;

    public LandingStatisticsController(
            ResourceFileRepository resources,
            AcademicModuleFileRepository modules,
            StudyGroupFileRepository groups,
            TextFileStore store) {
        this.resources = resources;
        this.modules = modules;
        this.groups = groups;
        this.store = store;
    }

    @GetMapping
    public ResponseEntity<Map<String, Long>> totals() {
        // Public stats never count pending or rejected resources.
        Set<Long> approvedIds = new HashSet<>();
        for (Resource resource : resources.findAll()) {
            if ("APPROVED".equalsIgnoreCase(resource.getStatus())) {
                approvedIds.add(resource.getId());
            }
        }
        long activeModules = modules.findAll().stream().filter(m -> m.isActive()).count();
        long studyGroups = groups.findAll().size();
        long recordedDownloads = 0;
        for (String line : store.read("downloads.txt")) {
            String[] fields = line.split("\\|", -1);
            if (fields.length < 3) {
                continue;
            }
            try {
                long resourceId = Long.parseLong(fields[1]);
                if (approvedIds.contains(resourceId) && !fields[2].isBlank()) {
                    recordedDownloads++;
                }
            } catch (NumberFormatException ignored) {
                // Ignore corrupt or outdated records rather than inflating counts.
            }
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(
                        Map.of(
                                "resources",
                                (long) approvedIds.size(),
                                "modules",
                                activeModules,
                                "groups",
                                studyGroups,
                                "downloads",
                                recordedDownloads));
    }
}

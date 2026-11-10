package com.edushare.modules.user;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Creates the initial admin only on a new, empty installation. */
@Component
public class FirstAdminSetup implements ApplicationRunner {

    private final UserFileRepository repository;

    public FirstAdminSetup(UserFileRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(ApplicationArguments arguments) {
        // Real administrators only. Disable any old demo administrator account safely.
        repository
                .findByEmail("demo.admin@edushare.example")
                .ifPresent(
                        demo -> {
                            if (!demo.isSuspended()) {
                                demo.setSuspended(true);
                                repository.save(demo);
                            }
                        });
        if (repository.findAll().stream()
                .anyMatch(
                        u ->
                                "ADMIN".equalsIgnoreCase(u.getRole())
                                        && !"demo.admin@edushare.example"
                                                .equalsIgnoreCase(u.getEmail()))) {
            return;
        }
        // Never silently create an unverified administrator from environment variables.
        // Initial administrator is provisioned only through the localhost-only setup API,
        // with email verification required before first login.
        System.out.println(
                "EduShare first setup: open http://localhost:8080/admin/setup on this computer.");
    }
}

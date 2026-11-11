package com.edushare.modules.admin;

import com.edushare.modules.user.User;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;

import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ModuleControllerTest {

    @TempDir
    Path dir;

    private TextFileStore store;
    private AcademicModuleFileRepository modules;
    private CategoryFileRepository categories;
    private UserService users;
    private ModuleController controller;
    private MockHttpSession adminSession;
    private MockHttpSession studentSession;

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        modules = new AcademicModuleFileRepository(store);
        categories = new CategoryFileRepository(store);
        users = mock(UserService.class);

        User admin = new User(
                1, "Admin", "admin", "admin@example.org", "", "ADMIN", false);
        User student = new User(
                2, "Student", "student", "student@example.org", "", "STUDENT", false);

        when(users.byId(1L)).thenReturn(Optional.of(admin));
        when(users.byId(2L)).thenReturn(Optional.of(student));

        adminSession = new MockHttpSession();
        adminSession.setAttribute("userId", 1L);

        studentSession = new MockHttpSession();
        studentSession.setAttribute("userId", 2L);

        categories.save(new Category(0, "Computing", "IT"));

        controller = new ModuleController(modules, categories, users);
    }

    @Test
    void adminCanCreateModule() {
        AcademicModule module =
                new AcademicModule(0, "se1020", "Object Oriented Programming", "Computing", true);

        ResponseEntity<AcademicModule> response =
                controller.add(module, adminSession);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, modules.findAll().size());
        assertEquals("SE1020", modules.findAll().get(0).getCode());
    }

    @Test
    void duplicateModuleCodeIsRejected() {
        modules.save(new AcademicModule(0, "SE1020", "OOP", "Computing", true));

        AcademicModule duplicate =
                new AcademicModule(0, "se1020", "Another Module", "Computing", true);

        ResponseEntity<AcademicModule> response =
                controller.add(duplicate, adminSession);

        assertEquals(409, response.getStatusCode().value());
        assertEquals(1, modules.findAll().size());
    }

    @Test
    void nonAdminCannotCreateModule() {
        AcademicModule module =
                new AcademicModule(0, "SE1020", "OOP", "Computing", true);

        ResponseEntity<AcademicModule> response =
                controller.add(module, studentSession);

        assertEquals(403, response.getStatusCode().value());
        assertTrue(modules.findAll().isEmpty());
    }

    @Test
    void adminCanUpdateModule() {
        AcademicModule saved =
                modules.save(new AcademicModule(0, "SE1020", "OOP", "Computing", true));

        AcademicModule updated =
                new AcademicModule(0, "se1021", "Advanced OOP", "Computing", true);

        ResponseEntity<AcademicModule> response =
                controller.edit(saved.getId(), updated, adminSession);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("SE1021", modules.findAll().get(0).getCode());
        assertEquals("Advanced OOP", modules.findAll().get(0).getName());
    }

    @Test
    void adminCanDeleteModule() {
        AcademicModule saved =
                modules.save(new AcademicModule(0, "SE1020", "OOP", "Computing", true));

        ResponseEntity<Void> response =
                controller.delete(saved.getId(), adminSession);

        assertEquals(204, response.getStatusCode().value());
        assertTrue(modules.findAll().isEmpty());
    }

    @Test
    void publicUsersOnlySeeActiveModules() {
        modules.save(new AcademicModule(0, "SE1020", "OOP", "Computing", true));
        modules.save(new AcademicModule(0, "SE1021", "Inactive Module", "Computing", false));

        assertEquals(1, controller.publicModules().size());
        assertEquals("SE1020", controller.publicModules().get(0).getCode());
    }

    @Test
    void invalidSessionUserIdIsRejectedWithoutCrashing() {
        MockHttpSession invalidSession = new MockHttpSession();
        invalidSession.setAttribute("userId", "not-a-number");

        AcademicModule module =
                new AcademicModule(0, "SE1020", "OOP", "Computing", true);

        ResponseEntity<AcademicModule> response =
                controller.add(module, invalidSession);

        assertEquals(403, response.getStatusCode().value());
        assertTrue(modules.findAll().isEmpty());
    }
}
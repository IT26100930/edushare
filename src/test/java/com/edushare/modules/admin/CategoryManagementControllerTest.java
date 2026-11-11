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

class CategoryManagementControllerTest {

    @TempDir
    Path dir;

    private TextFileStore store;
    private CategoryFileRepository categories;
    private AcademicModuleFileRepository modules;
    private UserService users;
    private CategoryManagementController controller;
    private MockHttpSession adminSession;
    private MockHttpSession studentSession;

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        categories = new CategoryFileRepository(store);
        modules = new AcademicModuleFileRepository(store);
        users = mock(UserService.class);

        User admin = new User(
            1, "Admin", "admin", "admin@example.org", "", "ADMIN", false
        );
        User student = new User(
            2, "Student", "student", "student@example.org", "", "STUDENT", false
        );

        when(users.byId(1L)).thenReturn(Optional.of(admin));
        when(users.byId(2L)).thenReturn(Optional.of(student));

        adminSession = new MockHttpSession();
        adminSession.setAttribute("userId", 1L);

        studentSession = new MockHttpSession();
        studentSession.setAttribute("userId", 2L);

        controller = new CategoryManagementController(
            categories, modules, users, store
        );
    }

    @Test
    void adminCanCreateCategoryAndPersistIt() {
        Category category = new Category(0, "Programming", "IT");

        ResponseEntity<?> response = controller.create(category, adminSession);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(1, categories.findAll().size());
        assertEquals("Programming", categories.findAll().get(0).getName());
        assertFalse(store.read("categories.txt").isEmpty());
    }

    @Test
    void duplicateCategoryNameIsRejected() {
        categories.save(new Category(0, "Programming", "IT"));

        ResponseEntity<?> response = controller.create(
            new Category(0, " programming ", "IT"),
            adminSession
        );

        assertEquals(409, response.getStatusCode().value());
        assertEquals(1, categories.findAll().size());
    }

    @Test
    void nonAdminCannotCreateCategory() {
        ResponseEntity<?> response = controller.create(
            new Category(0, "Programming", "IT"),
            studentSession
        );

        assertEquals(403, response.getStatusCode().value());
        assertTrue(categories.findAll().isEmpty());
    }

    @Test
    void renamingCategoryAlsoUpdatesAcademicModules() {
        Category category = categories.save(
            new Category(0, "Programming", "IT")
        );

        modules.save(new AcademicModule(
            0, "SE1010", "Introduction to Programming",
            "Programming", true
        ));

        ResponseEntity<?> response = controller.update(
            category.getId(),
            new Category(0, "Software Development", null),
            adminSession
        );

        assertEquals(200, response.getStatusCode().value());
        assertEquals(
            "Software Development",
            categories.findAll().get(0).getName()
        );
        assertEquals(
            "Software Development",
            modules.findAll().get(0).getFacultySubject()
        );
    }

    @Test
    void categoryWithAcademicModulesCannotBeDeleted() {
        Category category = categories.save(
            new Category(0, "Programming", "IT")
        );

        modules.save(new AcademicModule(
            0, "SE1010", "Introduction to Programming",
            "Programming", true
        ));

        ResponseEntity<?> response = controller.delete(
            category.getId(), adminSession
        );

        assertEquals(409, response.getStatusCode().value());
        assertEquals(1, categories.findAll().size());
    }

    @Test
    void unusedCategoryCanBeDeleted() {
        Category category = categories.save(
            new Category(0, "Programming", "IT")
        );

        ResponseEntity<?> response = controller.delete(
            category.getId(), adminSession
        );

        assertEquals(204, response.getStatusCode().value());
        assertTrue(categories.findAll().isEmpty());
    }
    @Test
    void adminCanReadCategories() {
        categories.save(new Category(0, "Programming", "IT"));

        ResponseEntity<?> response = controller.findAll(adminSession);

        assertEquals(200, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(
            1,
            ((java.util.List<?>) response.getBody()).size()
        );
    }
    @Test
    void nonAdminCannotUpdateCategory() {
        Category category = categories.save(
            new Category(0, "Programming", "IT")
        );

        ResponseEntity<?> response = controller.update(
            category.getId(),
            new Category(0, "Software Development", null),
            studentSession
        );

        assertEquals(403, response.getStatusCode().value());
        assertEquals(
            "Programming",
            categories.findAll().get(0).getName()
        );
    }
    @Test
    void nonAdminCannotDeleteCategory() {
        Category category = categories.save(
            new Category(0, "Programming", "IT")
        );

        ResponseEntity<?> response = controller.delete(
            category.getId(),
            studentSession
        );

        assertEquals(403, response.getStatusCode().value());
        assertEquals(1, categories.findAll().size());
    }
    @Test
    void categoryPersistsAfterRepositoryRecreation() {
        categories.save(new Category(0, "Programming", "IT"));

        TextFileStore newStore = new TextFileStore(dir.toString());
        CategoryFileRepository newRepository =
            new CategoryFileRepository(newStore);

        assertEquals(1, newRepository.findAll().size());
        assertEquals(
            "Programming",
            newRepository.findAll().get(0).getName()
        );
    }
}

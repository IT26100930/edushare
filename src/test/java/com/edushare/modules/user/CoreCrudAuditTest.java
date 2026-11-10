package com.edushare.modules.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.modules.community.CommunityFeedController;
import com.edushare.modules.request.*;
import com.edushare.modules.resource.*;
import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Path;
import java.util.*;

class CoreCrudAuditTest {

    @TempDir Path dir;

    TextFileStore store;

    UserService users;

    UserFileRepository repo;

    MockHttpSession owner, other, admin;

    MockMvc mvc;

    MockHttpSession session(User u) {
        org.springframework.mock.web.MockHttpSession s = new MockHttpSession();
        s.setAttribute("userId", u.getId());
        s.setAttribute("email", u.getEmail());
        s.setAttribute("role", u.getRole());
        return s;
    }

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        repo = new UserFileRepository(store);
        users = new UserService(repo, store);
        owner =
                session(
                        repo.save(
                                new Student(
                                        0, "Owner", "owner", "owner@example.org", "hash", false)));
        other =
                session(
                        repo.save(
                                new Student(
                                        0, "Other", "other", "other@example.org", "hash", false)));
        admin = session(repo.save(new Admin(0, "Admin", "admin", "admin@example.org", "hash")));
    }

    @Test
    void accountCreateReadUpdateDeletePersistsAndGuardsOwnership() throws Exception {
        EmailIdentityService emails = mock(EmailIdentityService.class);
        when(emails.configured()).thenReturn(true);
        mvc = MockMvcBuilders.standaloneSetup(new UserController(users, emails)).build();
        mvc.perform(
                        post("/api/users")
                                .contentType("application/json")
                                .content(
                                        "{\"name\":\"Learner\",\"username\":\"learner\",\"email\":\"learner@example.org\",\"password\":\"SafePassword2026!\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk());
        User created =
                users.all().stream()
                        .filter(u -> u.getUsername().equals("learner"))
                        .findFirst()
                        .orElseThrow();
        assertEquals("STUDENT", created.getRole());
        assertTrue(created.getPassword().startsWith("pbkdf2$"));
        org.springframework.mock.web.MockHttpSession learner = session(created);
        mvc.perform(get("/api/users/me").session(learner))
                .andExpect(jsonPath("$.username").value("learner"));
        String payload =
                "{\"name\":\"Updated"
                    + " Learner\",\"username\":\"learner\",\"email\":\"learner@example.org\",\"bio\":\"Updated"
                    + " biography\"}";
        mvc.perform(
                        put("/api/users/" + created.getId())
                                .session(other)
                                .contentType("application/json")
                                .content(payload))
                .andExpect(status().isForbidden());
        mvc.perform(
                        put("/api/users/" + created.getId())
                                .session(learner)
                                .contentType("application/json")
                                .content(payload))
                .andExpect(status().isOk());
        assertEquals(
                "Updated biography",
                new UserFileRepository(new TextFileStore(dir.toString()))
                        .findById(created.getId())
                        .orElseThrow()
                        .getBio());
        mvc.perform(delete("/api/users/" + created.getId()).session(other))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/users/" + created.getId()).session(learner))
                .andExpect(status().isNoContent());
        assertTrue(learner.isInvalid());
        assertTrue(users.byId(created.getId()).isEmpty());
        User next = repo.save(new Student(0, "New", "newuser", "new@example.org", "hash", false));
        assertTrue(next.getId() > created.getId());
    }

    @Test
    void communityPostCrudPreservesAuthorAndUnrelatedPostsAndRejectsOthers() throws Exception {
        mvc = MockMvcBuilders.standaloneSetup(new CommunityFeedController(store, users)).build();
        String post =
                "{\"type\":\"Question\",\"title\":\"Explain Java classes\",\"content\":\"How do"
                    + " classes and objects work?\",\"moduleCode\":\"IT1010\",\"tags\":\"Java\"}";
        mvc.perform(
                        post("/api/community/posts")
                                .session(owner)
                                .contentType("application/json")
                                .content(post))
                .andExpect(status().isOk());
        mvc.perform(
                        post("/api/community/posts")
                                .session(other)
                                .contentType("application/json")
                                .content(post))
                .andExpect(status().isOk());
        mvc.perform(get("/api/community/posts").session(owner))
                .andExpect(jsonPath("$[1].canManage").value(true));
        String changed = post.replace("Explain Java classes", "Updated question");
        mvc.perform(
                        put("/api/community/posts/1")
                                .session(other)
                                .contentType("application/json")
                                .content(changed))
                .andExpect(status().isForbidden());
        mvc.perform(
                        put("/api/community/posts/1")
                                .session(owner)
                                .contentType("application/json")
                                .content(changed))
                .andExpect(status().isOk());
        mvc.perform(get("/api/community/posts").session(other))
                .andExpect(jsonPath("$[1].title").value("Updated question"))
                .andExpect(jsonPath("$[1].canManage").value(false));
        mvc.perform(
                        post("/api/community/posts/1/comments")
                                .session(other)
                                .contentType("application/json")
                                .content("{\"text\":\"A useful comment\"}"))
                .andExpect(status().isOk());
        mvc.perform(
                        post("/api/community/posts/2/comments")
                                .session(owner)
                                .contentType("application/json")
                                .content("{\"text\":\"Keep this other comment\"}"))
                .andExpect(status().isOk());
        mvc.perform(delete("/api/community/posts/1").session(other))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/community/posts/1").session(owner))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/community/posts").session(other))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].comments.length()").value(1));
        assertEquals(1, store.read("community-comments.txt").size());
        mvc.perform(delete("/api/community/posts/2").session(admin))
                .andExpect(status().isNoContent());
        mvc.perform(
                        post("/api/community/posts")
                                .session(owner)
                                .contentType("application/json")
                                .content(post))
                .andExpect(jsonPath("$.id").value("post-3"));
    }

    @Test
    void requestsHaveOwnedDetailUpdatesAndDeletionWithoutLosingStatusOrTransferringOffers()
            throws Exception {
        RequestService service = new RequestService(new RequestFileRepository(store), users);
        mvc = MockMvcBuilders.standaloneSetup(new RequestController(service)).build();
        String json =
                "{\"title\":\"Need OOP lecture notes\",\"message\":\"Please share Java inheritance"
                    + " notes.\",\"moduleCode\":\"IT1010\",\"resourceType\":\"Notes\",\"academicYear\":\"2026\",\"neededBy\":\"\"}";
        mvc.perform(
                        post("/api/requests")
                                .session(owner)
                                .contentType("application/json")
                                .content(json))
                .andExpect(status().isOk());
        String edit = json.replace("Need OOP lecture notes", "Need updated OOP notes");
        mvc.perform(
                        put("/api/requests/1")
                                .session(other)
                                .contentType("application/json")
                                .content(edit))
                .andExpect(status().isForbidden());
        mvc.perform(
                        put("/api/requests/1")
                                .session(owner)
                                .contentType("application/json")
                                .content(
                                        edit.substring(0, edit.length() - 1)
                                                + ",\"requestedById\":999,\"status\":\"FULFILLED\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/requests").session(other))
                .andExpect(jsonPath("$[0].status").value("OPEN"))
                .andExpect(jsonPath("$[0].requestedById").value(1))
                .andExpect(jsonPath("$[0].title").value("Need updated OOP notes"));
        store.write(
                "request-offers.txt",
                List.of(
                        "1|1|2|encoded|encoded|OFFERED|time",
                        "2|9|2|encoded|encoded|OFFERED|time"));
        mvc.perform(delete("/api/requests/1").session(other)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/requests/1").session(owner)).andExpect(status().isNoContent());
        assertEquals(1, store.read("request-offers.txt").size());
        mvc.perform(
                        post("/api/requests")
                                .session(owner)
                                .contentType("application/json")
                                .content(json))
                .andExpect(jsonPath("$.id").value(2));
    }

    @Test
    void documentDetailUpdatePersistsDescriptionAndCannotPointAtAnotherUploadedFile()
            throws Exception {
        ResourceService resources = new ResourceService(new ResourceFileRepository(store));
        Resource doc = new LectureNote();
        doc.setTitle("My document");
        doc.setDescription("Old description");
        doc.setUploaderEmail("owner@example.org");
        doc.setFileName("original.pdf");
        doc.setFilePath("data/uploads/original.pdf");
        doc.setPages(8);
        doc.setPriceType("Free");
        doc.setPrice(0);
        resources.create(doc);
        mvc =
                MockMvcBuilders.standaloneSetup(
                                new ResourceController(resources, "ignored", store, users))
                        .build();
        String json =
                "{\"title\":\"New title\",\"description\":\"New saved"
                    + " description\",\"priceType\":\"Free\",\"price\":0,\"filePath\":\"data/uploads/somebody-else.pdf\",\"fileName\":\"somebody-else.pdf\",\"pages\":0}";
        mvc.perform(
                        put("/api/resources/1")
                                .session(other)
                                .contentType("application/json")
                                .content(json))
                .andExpect(status().isForbidden());
        mvc.perform(
                        put("/api/resources/1")
                                .session(owner)
                                .contentType("application/json")
                                .content(json))
                .andExpect(status().isOk());
        Resource saved =
                new ResourceFileRepository(new TextFileStore(dir.toString()))
                        .findById(1)
                        .orElseThrow();
        assertEquals("New saved description", saved.getDescription());
        assertEquals("data/uploads/original.pdf", saved.getFilePath());
        assertEquals(8, saved.getPages());
        mvc.perform(
                        post("/api/resources")
                                .session(owner)
                                .contentType("application/json")
                                .content(json))
                .andExpect(status().isBadRequest());
    }
}

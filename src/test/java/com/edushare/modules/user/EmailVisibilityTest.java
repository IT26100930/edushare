package com.edushare.modules.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.modules.download.*;
import com.edushare.modules.resource.*;
import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.*;

@SpringBootTest
@AutoConfigureMockMvc
class EmailVisibilityTest {

    static final Path DATA;

    static {
        try {
            DATA = Files.createTempDirectory("email-visibility-");
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @DynamicPropertySource
    static void config(DynamicPropertyRegistry r) {
        r.add("edushare.data-dir", () -> DATA.toString());
    }

    @Autowired MockMvc mvc;

    @Autowired UserFileRepository repo;

    @Autowired TextFileStore store;

    @Autowired ResourceService resources;

    @Autowired LinkFileRepository links;

    User owner, peer, admin;
    MockHttpSession own, other, staff;
    long resourceId, linkId;

    MockHttpSession session(User u) {
        org.springframework.mock.web.MockHttpSession s = new MockHttpSession();
        s.setAttribute("userId", u.getId());
        s.setAttribute("role", u.getRole());
        s.setAttribute("email", u.getEmail());
        return s;
    }

    @BeforeEach
    void setup() {
        store.write("users.txt", java.util.List.of());
        store.write("resources.txt", java.util.List.of());
        store.write("links.txt", java.util.List.of());
        owner = repo.save(new Student(0, "Owner", "owner", "personal@example.org", "hash", false));
        peer = repo.save(new Student(0, "Peer", "peer", "peer@university.edu", "hash", false));
        admin = repo.save(new Admin(0, "Admin", "admin", "admin@example.org", "hash"));
        own = session(owner);
        other = session(peer);
        staff = session(admin);
        Resource r = new LectureNote();
        r.setTitle("Private-contact notes");
        r.setModuleCode("IT1010");
        r.setCategory("Programming");
        r.setUploaderEmail(owner.getEmail());
        r.setStatus("APPROVED");
        r.setPriceType("Free");
        resourceId = resources.create(r).getId();
        Link l = new VideoLink();
        l.setTitle("Video");
        l.setUrl("https://www.youtube.com/watch?v=example");
        l.setUploaderEmail(owner.getEmail());
        l.setStatus("APPROVED");
        linkId = links.save(l).getId();
    }

    void visibility(boolean enabled) throws Exception {
        mvc.perform(
                        put("/api/users/" + owner.getId())
                                .session(own)
                                .contentType("application/json")
                                .content(
                                        "{\"name\":\"Owner\",\"username\":\"owner\",\"showEmail\":"
                                                + enabled
                                                + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.showEmail").value(enabled));
    }

    @Test
    void privateByDefaultAndOwnerAndAdminKeepAccountAccess() throws Exception {
        mvc.perform(get("/api/users/profile/owner").session(other))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(""));
        mvc.perform(get("/api/users/directory").session(other))
                .andExpect(jsonPath("$[0].email").value(""));
        mvc.perform(get("/api/users/me").session(own))
                .andExpect(jsonPath("$.email").value(owner.getEmail()));
        mvc.perform(get("/api/users/profile/owner").session(staff))
                .andExpect(jsonPath("$.email").value(owner.getEmail()));
        mvc.perform(get("/api/auth/admin-setup-status").header("Host", "localhost:8080"))
                .andExpect(jsonPath("$.adminEmail").doesNotExist());
        mvc.perform(get("/api/users/" + owner.getId()).session(other))
                .andExpect(status().isForbidden());
    }

    @Test
    void togglePersistsAfterRepositoryReopenAndUnrelatedUpdate() throws Exception {
        visibility(true);
        assertTrue(
                new UserFileRepository(new TextFileStore(DATA.toString()))
                        .findById(owner.getId())
                        .orElseThrow()
                        .emailVisibleToMembers());
        mvc.perform(get("/api/users/me").session(session(owner)))
                .andExpect(jsonPath("$.showEmail").value(true));
        mvc.perform(
                        put("/api/users/" + owner.getId())
                                .session(own)
                                .contentType("application/json")
                                .content(
                                        "{\"name\":\"Owner\",\"username\":\"owner\",\"bio\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.showEmail").value(true));
        mvc.perform(get("/api/users/profile/owner").session(other))
                .andExpect(jsonPath("$.email").value(owner.getEmail()));
        visibility(false);
        mvc.perform(get("/api/users/profile/owner").session(other))
                .andExpect(jsonPath("$.email").value(""));
        assertFalse(
                new UserFileRepository(store)
                        .findById(owner.getId())
                        .orElseThrow()
                        .emailVisibleToMembers());
    }

    @Test
    void resourceAndVideoApisHideEmailWithoutBreakingAuthorIdentityOrStoredOwnership()
            throws Exception {
        mvc.perform(get("/api/resources/" + resourceId).session(other))
                .andExpect(jsonPath("$.uploaderEmail").value(""))
                .andExpect(jsonPath("$.uploaderId").value(owner.getId()))
                .andExpect(header().string("Cache-Control", "private, no-store"));
        mvc.perform(get("/api/resources").session(other))
                .andExpect(jsonPath("$[0].uploaderEmail").value(""));
        mvc.perform(get("/api/links").session(other))
                .andExpect(jsonPath("$[0].uploaderEmail").value(""))
                .andExpect(jsonPath("$[0].uploaderId").value(owner.getId()));
        mvc.perform(get("/api/resources/" + resourceId).session(staff))
                .andExpect(jsonPath("$.uploaderEmail").value(owner.getEmail()));
        visibility(true);
        mvc.perform(get("/api/links").session(other))
                .andExpect(jsonPath("$[0].uploaderEmail").value(owner.getEmail()));
        assertEquals(owner.getEmail(), resources.byId(resourceId).orElseThrow().getUploaderEmail());
        assertEquals(
                owner.getEmail(),
                links.findByIdIncludingHidden(linkId).orElseThrow().getUploaderEmail());
    }

    @Test
    void otherAccountsCannotChangePreferenceAndGuestsOrSuspendedSessionsCannotReadDirectory()
            throws Exception {
        mvc.perform(
                        put("/api/users/" + owner.getId())
                                .session(other)
                                .contentType("application/json")
                                .content(
                                        "{\"name\":\"Owner\",\"username\":\"owner\",\"showEmail\":true}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/users/directory")).andExpect(status().isUnauthorized());
        peer.setSuspended(true);
        repo.save(peer);
        mvc.perform(get("/api/users/directory").session(other))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void oldTxtRowsDefaultToHiddenWithoutLosingExistingFields() {
        String old = store.read("users.txt").get(0);
        store.write(
                "users.txt",
                java.util.List.of(
                        String.join("|", java.util.Arrays.copyOf(old.split("\\|", -1), 18))));
        User restored = new UserFileRepository(store).findById(owner.getId()).orElseThrow();
        assertFalse(restored.emailVisibleToMembers());
        assertEquals(owner.getUsername(), restored.getUsername());
        assertEquals(owner.getEmail(), restored.getEmail());
        restored.setShowEmail(true);
        repo.save(restored);
        assertTrue(repo.findById(owner.getId()).orElseThrow().emailVisibleToMembers());
    }
}

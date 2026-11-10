package com.edushare.modules.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.*;
import java.util.*;

class ProfileSettingsPersistenceTest {

    @TempDir Path dir;

    TextFileStore store;

    UserFileRepository repo;

    UserService users;

    MockMvc mvc;

    User owner, peer;
    MockHttpSession own, other;

    MockHttpSession session(User user) {
        org.springframework.mock.web.MockHttpSession s = new MockHttpSession();
        s.setAttribute("userId", user.getId());
        return s;
    }

    void reopen() {
        store = new TextFileStore(dir.toString());
        repo = new UserFileRepository(store);
        users = new UserService(repo, store);
        mvc = MockMvcBuilders.standaloneSetup(new UserController(users, null)).build();
    }

    @BeforeEach
    void setup() {
        reopen();
        owner =
                repo.save(
                        new Student(
                                0,
                                "Original",
                                "original",
                                "student@example.org",
                                "original-hash",
                                false));
        peer = repo.save(new Student(0, "Peer", "peer", "peer@example.org", "peer-hash", false));
        own = session(owner);
        other = session(peer);
    }

    @Test
    void allEditableProfileDetailsAndPreferencesSurviveFreshRepositoryAndSession()
            throws Exception {
        mvc.perform(
                        put("/api/users/" + owner.getId())
                                .session(own)
                                .contentType("application/json")
                                .content(
                                        """
{"name":"Updated Name","username":"updated_name","bio":"IT undergraduate","university":"SLIIT","degree":"BSc IT","batch":"Y1S2","coverPattern":"navy-code","githubUrl":"github.com/updated","linkedinUrl":"linkedin.com/in/updated","showEmail":true,"isPublic":true,"interests":["Java","Cyber Security","සිංහල | tags, examples"],"notifications":{"emailDigest":true,"newReviews":false,"payouts":true}}
"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interests[2]").value("සිංහල | tags, examples"));
        reopen();
        mvc.perform(get("/api/users/me").session(session(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated Name"))
                .andExpect(jsonPath("$.username").value("updated_name"))
                .andExpect(jsonPath("$.bio").value("IT undergraduate"))
                .andExpect(jsonPath("$.university").value("SLIIT"))
                .andExpect(jsonPath("$.degree").value("BSc IT"))
                .andExpect(jsonPath("$.batch").value("Y1S2"))
                .andExpect(jsonPath("$.coverPattern").value("navy-code"))
                .andExpect(jsonPath("$.githubUrl").value("github.com/updated"))
                .andExpect(jsonPath("$.linkedinUrl").value("linkedin.com/in/updated"))
                .andExpect(jsonPath("$.showEmail").value(true))
                .andExpect(jsonPath("$.isPublic").value(true))
                .andExpect(jsonPath("$.notifications.emailDigest").value(true))
                .andExpect(jsonPath("$.notifications.newReviews").value(false));
        assertEquals("original-hash", repo.findById(owner.getId()).orElseThrow().getPassword());
        mvc.perform(get("/api/users/profile/updated_name").session(other))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interests[0]").value("Java"));
    }

    @Test
    void privateProfileIsEnforcedWhileBasicAuthorIdentityRemainsInDirectory() throws Exception {
        mvc.perform(
                        put("/api/users/" + owner.getId())
                                .session(own)
                                .contentType("application/json")
                                .content(
                                        "{\"name\":\"Original\",\"username\":\"original\",\"bio\":\"Private"
                                            + " bio\",\"showEmail\":true,\"isPublic\":false}"))
                .andExpect(status().isOk());
        reopen();
        mvc.perform(get("/api/users/profile/original").session(other))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/users/directory").session(other))
                .andExpect(jsonPath("$[0].id").value(owner.getId()))
                .andExpect(jsonPath("$[0].username").value("original"))
                .andExpect(jsonPath("$[0].bio").value(""))
                .andExpect(jsonPath("$[0].email").value(""));
        mvc.perform(get("/api/users/profile/original").session(own))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Private bio"));
    }

    @Test
    void clearingInterestsAndPartialChangesDoNotResetOtherPreferences() throws Exception {
        Student first = new Student();
        first.setName("Original");
        first.setUsername("original");
        first.setInterests(List.of("Java"));
        first.setIsPublic(false);
        first.setShowEmail(true);
        first.setNotifications(Map.of("emailDigest", true));
        users.update(owner.getId(), first);
        Student next = new Student();
        next.setName("Original");
        next.setUsername("original");
        next.setInterests(List.of());
        users.update(owner.getId(), next);
        reopen();
        User saved = repo.findById(owner.getId()).orElseThrow();
        assertEquals(List.of(), saved.getInterests());
        assertFalse(saved.publicProfileEnabled());
        assertTrue(saved.emailVisibleToMembers());
        assertTrue(saved.getNotifications().get("emailDigest"));
    }

    @Test
    void previousAccountRowsLoadAndUpgradeWithoutLosingAccountsOrPasswords() {
        java.util.List<java.lang.String> before = store.read("users.txt");
        store.write(
                "users.txt",
                before.stream()
                        .map(line -> String.join("|", Arrays.copyOf(line.split("\\|", -1), 18)))
                        .toList());
        reopen();
        User saved = repo.findById(owner.getId()).orElseThrow();
        assertTrue(saved.publicProfileEnabled());
        assertFalse(saved.emailVisibleToMembers());
        assertEquals(List.of(), saved.getInterests());
        assertFalse(saved.getNotifications().get("emailDigest"));
        saved.setInterests(List.of("Java"));
        repo.save(saved);
        reopen();
        assertEquals(2, repo.findAll().size());
        assertEquals("original-hash", repo.findById(owner.getId()).orElseThrow().getPassword());
        assertEquals(List.of("Java"), repo.findById(owner.getId()).orElseThrow().getInterests());
    }

    @Test
    void invalidPreferenceAndUnauthorizedUpdateDoNotWriteAnything() throws Exception {
        java.util.List<java.lang.String> before = store.read("users.txt");
        mvc.perform(
                        put("/api/users/" + owner.getId())
                                .session(other)
                                .contentType("application/json")
                                .content(
                                        "{\"name\":\"Changed\",\"username\":\"original\",\"isPublic\":false}"))
                .andExpect(status().isForbidden());
        mvc.perform(
                        put("/api/users/" + owner.getId())
                                .session(own)
                                .contentType("application/json")
                                .content(
                                        "{\"name\":\"Changed\",\"username\":\"original\",\"interests\":[\"\"]}"))
                .andExpect(status().isBadRequest());
        assertEquals(before, store.read("users.txt"));
    }
}

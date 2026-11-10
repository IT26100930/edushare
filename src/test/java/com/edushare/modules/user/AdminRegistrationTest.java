package com.edushare.modules.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.modules.admin.AdminRegistrationController;
import com.edushare.shared.TextFileStore;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.Path;
import java.util.*;

class AdminRegistrationTest {
    @TempDir Path dir;
    TextFileStore store;
    UserFileRepository repo;
    UserService users;
    EmailIdentityService emails;
    MockMvc mvc;
    User admin, student;
    MockHttpSession own, peer;
    FakeMail mail;

    static class FakeMail extends JavaMailSenderImpl {
        boolean fail;
        List<SimpleMailMessage> messages = new ArrayList<>();

        @Override
        public void send(SimpleMailMessage message) {
            if (fail) throw new MailSendException("Simulated delivery failure");
            messages.add(new SimpleMailMessage(message));
        }
    }

    MockHttpSession session(User u) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute("userId", u.getId());
        s.setAttribute("role", u.getRole());
        return s;
    }

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        repo = new UserFileRepository(store);
        users = new UserService(repo, store);
        admin =
                repo.save(
                        new Admin(
                                0,
                                "Owner",
                                "owner",
                                "owner@example.org",
                                PasswordHash.hash("OwnerPassword123")));
        student =
                repo.save(
                        new Student(
                                0,
                                "Student",
                                "student",
                                "student@example.org",
                                PasswordHash.hash("StudentPassword123"),
                                false));
        own = session(admin);
        peer = session(student);
        mail = new FakeMail();
        mail.setPassword("smtp-test-password");
        emails = new EmailIdentityService(store, repo, mail);
        ReflectionTestUtils.setField(emails, "from", "sender@example.org");
        ReflectionTestUtils.setField(emails, "mailHost", "smtp.example.org");
        ReflectionTestUtils.setField(emails, "mailUsername", "sender@example.org");
        ReflectionTestUtils.setField(emails, "publicUrl", "http://localhost:8080");
        mvc =
                MockMvcBuilders.standaloneSetup(
                                new AdminRegistrationController(users, repo, emails, store),
                                new AuthController(users, repo, emails))
                        .build();
    }

    String payload(String username, String email) throws Exception {
        return new ObjectMapper()
                .writeValueAsString(
                        Map.of(
                                "name",
                                "New Administrator",
                                "username",
                                username,
                                "email",
                                email,
                                "password",
                                "NewAdminPassword123",
                                "adminPassword",
                                "OwnerPassword123"));
    }

    @Test
    void existingAdministratorCanCreateFiveMoreAndAccountsSurviveReload() throws Exception {
        for (int i = 1; i <= 5; i++)
            mvc.perform(
                            post("/api/admin/accounts/register")
                                    .session(own)
                                    .contentType("application/json")
                                    .content(
                                            payload(
                                                    "admin" + i,
                                                    "owner+admin" + i + "@example.org")))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.next").value("/admin/login"))
                    .andExpect(jsonPath("$.password").doesNotExist());
        UserFileRepository restarted = new UserFileRepository(new TextFileStore(dir.toString()));
        assertEquals(
                6, restarted.findAll().stream().filter(u -> "ADMIN".equals(u.getRole())).count());
        assertEquals(5, mail.messages.size());
        User saved = restarted.findByEmail("owner+admin1@example.org").orElseThrow();
        assertFalse(saved.isVerified());
        assertFalse(saved.isSuspended());
        assertTrue(PasswordHash.matches("NewAdminPassword123", saved.getPassword()));
        assertNotEquals("NewAdminPassword123", saved.getPassword());
        assertEquals(admin.getId(), own.getAttribute("userId"));
    }

    @Test
    void verificationRequiredBeforeNewAdminCanSignIn() throws Exception {
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(payload("new_admin", "new@example.org")))
                .andExpect(status().isCreated());
        mvc.perform(
                        post("/api/auth/admin-login")
                                .session(new MockHttpSession())
                                .contentType("application/json")
                                .content(
                                        "{\"email\":\"new@example.org\",\"password\":\"NewAdminPassword123\"}"))
                .andExpect(status().isForbidden());
        String body = mail.messages.get(0).getText();
        String token = body.substring(body.indexOf("token=") + 6).split("\\s")[0];
        assertEquals("/admin/login", emails.verifyEmailSignInPath(token));
        MockHttpSession newSession = new MockHttpSession();
        mvc.perform(
                        post("/api/auth/admin-login")
                                .session(newSession)
                                .contentType("application/json")
                                .content(
                                        "{\"email\":\"new@example.org\",\"password\":\"NewAdminPassword123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
        assertNotEquals(admin.getId(), newSession.getAttribute("userId"));
    }

    @Test
    void guestStudentSuspendedAndForgedRoleSessionsCannotCreateAdmins() throws Exception {
        String input = payload("new_admin", "new@example.org");
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .contentType("application/json")
                                .content(input))
                .andExpect(status().isUnauthorized());
        peer.setAttribute("role", "ADMIN");
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(peer)
                                .contentType("application/json")
                                .content(input))
                .andExpect(status().isForbidden());
        admin.setSuspended(true);
        repo.save(admin);
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(input))
                .andExpect(status().isForbidden());
        assertEquals(2, repo.findAll().size());
    }

    @Test
    void duplicateIdentityAndWrongPasswordDoNotWriteAccounts() throws Exception {
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(payload("owner", "other@example.org")))
                .andExpect(status().isConflict());
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(payload("other", " OWNER@example.org ")))
                .andExpect(status().isConflict());
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(
                                        payload("other", "other@example.org")
                                                .replace("OwnerPassword123", "incorrect")))
                .andExpect(status().isForbidden());
        assertEquals(2, repo.findAll().size());
    }

    @Test
    void invalidInputAndMailFailureLeaveExistingUsersUntouched() throws Exception {
        String before = store.read("users.txt").toString();
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(payload("bad name", "new@example.org")))
                .andExpect(status().isBadRequest());
        mail.fail = true;
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(payload("new_admin", "new@example.org")))
                .andExpect(status().isServiceUnavailable());
        assertEquals(before, store.read("users.txt").toString());
        assertFalse(
                store.read("email-identity-tokens.txt").stream()
                        .anyMatch(row -> row.contains("|pending")));
        mail.fail = false;
        ReflectionTestUtils.setField(emails, "mailHost", "");
        mvc.perform(
                        post("/api/admin/accounts/register")
                                .session(own)
                                .contentType("application/json")
                                .content(payload("new_admin", "new@example.org")))
                .andExpect(status().isServiceUnavailable());
        assertEquals(before, store.read("users.txt").toString());
    }
}

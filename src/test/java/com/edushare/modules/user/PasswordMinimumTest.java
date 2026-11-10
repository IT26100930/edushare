package com.edushare.modules.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.shared.TextFileStore;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PasswordMinimumTest {
  @TempDir Path dir;
  TextFileStore store;
  UserFileRepository repo;
  UserService users;
  EmailIdentityService emails;
  static final String TOKEN = "fixed-test-token-with-at-least-thirty-characters";

  @BeforeEach
  void setup() {
    store = new TextFileStore(dir.toString());
    repo = new UserFileRepository(store);
    users = new UserService(repo, store);
    emails = new EmailIdentityService(store, repo, new JavaMailSenderImpl());
  }

  User account(boolean admin) {
    User user =
        admin
            ? new Admin(0, "Admin", "admin", "admin@example.org", PasswordHash.hash("OldPass123"))
            : new Student(
                0,
                "Student",
                "student",
                "student@example.org",
                PasswordHash.hash("OldPass123"),
                false);
    return repo.save(user);
  }

  void token(User user, long expiry) throws Exception {
    String hash =
        HexFormat.of()
            .formatHex(
                MessageDigest.getInstance("SHA-256")
                    .digest(TOKEN.getBytes(StandardCharsets.UTF_8)));
    store.write(
        "email-identity-tokens.txt",
        List.of(user.getId() + "|RESET|" + hash + "|" + expiry + "|pending"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"Abcd1234", "Abcd12345", "Abcdefgh1234"})
  void emailResetAcceptsEightNineAndTwelveCharactersAndPersists(String password) throws Exception {
    User user = account(false);
    token(user, System.currentTimeMillis() + 60000);
    MockMvc mvc =
        MockMvcBuilders.standaloneSetup(new EmailIdentityController(emails, users)).build();
    mvc.perform(
            post("/api/email-auth/reset")
                .contentType("application/json")
                .content("{\"token\":\"" + TOKEN + "\",\"password\":\"" + password + "\"}"))
        .andExpect(status().isOk());
    User saved =
        new UserFileRepository(new TextFileStore(dir.toString()))
            .findById(user.getId())
            .orElseThrow();
    assertTrue(PasswordHash.matches(password, saved.getPassword()));
    assertFalse(PasswordHash.matches("OldPass123", saved.getPassword()));
    assertNotEquals(password, saved.getPassword());
    assertFalse(emails.useResetToken(TOKEN, password, users));
  }

  @ParameterizedTest
  @ValueSource(strings = {"Abcd1234", "Abcd12345", "Abcdefgh1234"})
  void administratorEmailResetUsesTheSameMinimum(String password) throws Exception {
    User user = account(true);
    token(user, System.currentTimeMillis() + 60000);
    assertTrue(emails.useResetToken(TOKEN, password, users));
    assertTrue(users.login(user.getEmail(), password).isPresent());
  }

  @Test
  void sevenCharactersCannotConsumeAValidResetToken() throws Exception {
    User user = account(false);
    token(user, System.currentTimeMillis() + 60000);
    assertFalse(emails.useResetToken(TOKEN, "Abcd123", users));
    assertTrue(users.login(user.getEmail(), "OldPass123").isPresent());
    assertTrue(emails.useResetToken(TOKEN, "Abcd1234", users));
  }

  @Test
  void expiryAndTokenChecksStillApply() throws Exception {
    User user = account(false);
    token(user, System.currentTimeMillis() - 1000);
    assertFalse(emails.useResetToken(TOKEN, "Abcd1234", users));
    token(user, System.currentTimeMillis() + 60000);
    assertFalse(emails.useResetToken("wrong-test-token-with-thirty-characters", "Abcd1234", users));
    assertTrue(users.login(user.getEmail(), "OldPass123").isPresent());
  }

  @Test
  void currentPasswordChangeAcceptsEightAndRejectsSeven() {
    User user = account(false);
    assertThrows(
        IllegalArgumentException.class,
        () -> users.changePassword(user.getId(), "OldPass123", "Abcd123"));
    users.changePassword(user.getId(), "OldPass123", "Abcd1234");
    assertTrue(users.login(user.getEmail(), "Abcd1234").isPresent());
  }

  @Test
  void strengthAndMaximumRulesAreRetained() {
    assertDoesNotThrow(() -> UserService.validateNewPassword("Abcd1234"));
    for (String invalid : List.of("Abcd123", "abcdefgh", "12345678", "a".repeat(128) + "1"))
      assertThrows(IllegalArgumentException.class, () -> UserService.validateNewPassword(invalid));
  }

  @Test
  void registrationAlsoAcceptsEight() {
    User user =
        users.register(
            new Student(0, "New member", "newmember", "new@example.org", "Abcd1234", false));
    assertTrue(
        PasswordHash.matches("Abcd1234", repo.findById(user.getId()).orElseThrow().getPassword()));
  }
}

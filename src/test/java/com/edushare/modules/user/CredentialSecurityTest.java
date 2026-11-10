package com.edushare.modules.user;

import static org.junit.jupiter.api.Assertions.*;

import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

/** Run via `mvn test` on a machine with Maven and project dependencies. */
class CredentialSecurityTest {

    @TempDir Path temp;

    @Test
    void passwordsRequireCorrectCurrentPasswordAndPersistAsHash() {
        TextFileStore storage = new TextFileStore(temp.toString());
        UserFileRepository repository = new UserFileRepository(storage);
        UserService service = new UserService(repository, storage);
        User account =
                new Admin(
                        0,
                        "Owner",
                        "owner",
                        "owner@example.test",
                        PasswordHash.hash("OldSecret2026!!"));
        account = repository.save(account);
        long id = account.getId();
        assertThrows(
                IllegalArgumentException.class,
                () -> service.changePassword(id, "incorrect", "NewSecret2026!!"));
        assertTrue(service.login("owner@example.test", "OldSecret2026!!").isPresent());
        service.changePassword(id, "OldSecret2026!!", "NewSecret2026!!");
        assertFalse(service.login("owner@example.test", "OldSecret2026!!").isPresent());
        assertTrue(service.login("owner@example.test", "NewSecret2026!!").isPresent());
        assertTrue(repository.findById(id).orElseThrow().getPassword().startsWith("pbkdf2$"));
        assertFalse(storage.read("users.txt").get(0).contains("NewSecret2026!!"));
    }

    @Test
    void profileUpdatesCannotChangeEmailOrPassword() {
        TextFileStore storage = new TextFileStore(temp.toString());
        UserFileRepository repository = new UserFileRepository(storage);
        UserService service = new UserService(repository, storage);
        User account =
                repository.save(
                        new Student(
                                0,
                                "Student",
                                "student",
                                "student@example.test",
                                PasswordHash.hash("OldSecret2026!!"),
                                false));
        Student payload = new Student();
        payload.setName("Student");
        payload.setUsername("student");
        payload.setEmail("attacker@example.test");
        assertThrows(
                IllegalArgumentException.class, () -> service.update(account.getId(), payload));
        payload.setEmail("student@example.test");
        payload.setPassword("UnverifiedPass2026!");
        assertThrows(
                IllegalArgumentException.class, () -> service.update(account.getId(), payload));
        assertEquals(
                "student@example.test",
                repository.findById(account.getId()).orElseThrow().getEmail());
    }
}

package com.edushare.modules.user;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.*;

import javax.imageio.ImageIO;

class AvatarEditingTest {

    @TempDir Path dir;

    TextFileStore store;

    UserService users;

    UserFileRepository repo;

    MockMvc mvc;

    MockHttpSession owner, other;

    long uid;

    byte[] png(int w, int h) throws Exception {
        java.awt.image.BufferedImage image = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
        image.setRGB(w / 2, h / 2, 0xff0000);
        java.io.ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    MockHttpSession session(long id) {
        org.springframework.mock.web.MockHttpSession s = new MockHttpSession();
        s.setAttribute("userId", id);
        return s;
    }

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        repo = new UserFileRepository(store);
        users = new UserService(repo, store);
        com.edushare.modules.user.User a =
                repo.save(new Student(0, "Owner", "owner", "owner@example.org", "hash", false));
        com.edushare.modules.user.User b =
                repo.save(new Student(0, "Other", "other", "other@example.org", "hash", false));
        uid = a.getId();
        owner = session(uid);
        other = session(b.getId());
        mvc = MockMvcBuilders.standaloneSetup(new AvatarController(users, store)).build();
    }

    void upload() throws Exception {
        mvc.perform(
                        multipart("/api/users/me/avatar")
                                .file(
                                        new MockMultipartFile(
                                                "file", "crop.png", "image/png", png(64, 64)))
                                .file(
                                        new MockMultipartFile(
                                                "original",
                                                "original.png",
                                                "image/png",
                                                png(240, 120)))
                                .param("zoom", "220")
                                .param("x", "-35")
                                .param("y", "25")
                                .session(owner))
                .andExpect(status().isOk());
    }

    @Test
    void originalAndFramingPersistAndReeditingCanZoomBackOutWithoutRecroppingSource()
            throws Exception {
        upload();
        String url = users.byId(uid).orElseThrow().getAvatar();
        byte[] source =
                mvc.perform(get("/api/users/me/avatar-source").session(owner))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsByteArray();
        assertArrayEquals(png(240, 120), source);
        org.springframework.test.web.servlet.MockMvc restarted =
                MockMvcBuilders.standaloneSetup(
                                new AvatarController(
                                        new UserService(
                                                new UserFileRepository(
                                                        new TextFileStore(dir.toString())),
                                                new TextFileStore(dir.toString())),
                                        new TextFileStore(dir.toString())))
                        .build();
        restarted
                .perform(get("/api/users/me/avatar-editor").session(owner))
                .andExpect(jsonPath("$.hasOriginal").value(true))
                .andExpect(jsonPath("$.zoom").value(220))
                .andExpect(jsonPath("$.x").value(-35));
        restarted
                .perform(
                        multipart("/api/users/me/avatar")
                                .file(
                                        new MockMultipartFile(
                                                "file", "new.png", "image/png", png(80, 80)))
                                .param("zoom", "100")
                                .param("x", "0")
                                .param("y", "0")
                                .session(owner))
                .andExpect(status().isOk());
        restarted
                .perform(get("/api/users/me/avatar-source").session(owner))
                .andExpect(content().bytes(source));
        restarted
                .perform(get("/api/users/me/avatar-editor").session(owner))
                .andExpect(jsonPath("$.zoom").value(100));
        assertNotEquals(url, users.byId(uid).orElseThrow().getAvatar());
        assertEquals(1, Files.list(dir.resolve("avatar-originals")).count());
    }

    @Test
    void deletionClearsProfileAndBothStoredImagesAndStaysRemovedAfterReload() throws Exception {
        upload();
        String old = users.byId(uid).orElseThrow().getAvatar();
        mvc.perform(delete("/api/users/me/avatar").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").value(""));
        assertEquals(
                "",
                new UserFileRepository(new TextFileStore(dir.toString()))
                        .findById(uid)
                        .orElseThrow()
                        .getAvatar());
        mvc.perform(get(old)).andExpect(status().isNotFound());
        mvc.perform(get("/api/users/me/avatar-source").session(owner))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/users/me/avatar-editor").session(owner))
                .andExpect(jsonPath("$.hasOriginal").value(false));
        assertTrue(store.read("avatar-edits.txt").isEmpty());
        assertEquals(0, Files.list(dir.resolve("avatar-originals")).count());
    }

    @Test
    void originalIsPrivateAndAnotherAccountCannotRemoveOwnersPhoto() throws Exception {
        upload();
        String ownerUrl = users.byId(uid).orElseThrow().getAvatar();
        mvc.perform(get("/api/users/me/avatar-source").session(other))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/users/me/avatar-source")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/users/me/avatar").session(other)).andExpect(status().isOk());
        assertEquals(ownerUrl, users.byId(uid).orElseThrow().getAvatar());
        mvc.perform(delete("/api/users/me/avatar")).andExpect(status().isUnauthorized());
        User u = repo.findById(uid).orElseThrow();
        u.setSuspended(true);
        repo.save(u);
        mvc.perform(delete("/api/users/me/avatar").session(owner))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void invalidUploadsAndCoordinatesDoNotReplaceASavedPhoto() throws Exception {
        upload();
        String before = users.byId(uid).orElseThrow().getAvatar();
        mvc.perform(
                        multipart("/api/users/me/avatar")
                                .file(
                                        new MockMultipartFile(
                                                "file",
                                                "fake.jpg",
                                                "image/jpeg",
                                                new byte[] {1, 2, 3}))
                                .session(owner))
                .andExpect(status().isBadRequest());
        for (String zoom : List.of("99", "301", "NaN")) {
            mvc.perform(
                            multipart("/api/users/me/avatar")
                                    .file(
                                            new MockMultipartFile(
                                                    "file", "crop.png", "image/png", png(10, 10)))
                                    .param("zoom", zoom)
                                    .session(owner))
                    .andExpect(status().isBadRequest());
        }
        assertEquals(before, users.byId(uid).orElseThrow().getAvatar());
    }

    @Test
    void legacyPhotoRemainsReadableAndDoesNotInventAnOriginal() throws Exception {
        Files.createDirectories(dir.resolve("avatars"));
        Files.write(dir.resolve("avatars/legacy-student.png"), png(40, 40));
        users.updateAvatar(uid, "/api/users/avatar/legacy-student.png");
        mvc.perform(get("/api/users/avatar/legacy-student.png")).andExpect(status().isOk());
        mvc.perform(get("/api/users/me/avatar-editor").session(owner))
                .andExpect(jsonPath("$.hasOriginal").value(false))
                .andExpect(jsonPath("$.zoom").value(100));
    }
}

package com.edushare.modules.download;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.modules.resource.*;
import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.util.*;

class PersonalLibraryTest {

    @TempDir Path dir;

    TextFileStore store;

    UserService users;

    ResourceService resources;

    LinkFileRepository links;

    DiscussionAccess access;

    PersonalLibraryService library;

    MockMvc mvc;

    MockHttpSession member, other;

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        users = mock(UserService.class);
        resources = mock(ResourceService.class);
        User a = new User(1, "Member", "member", "member@example.org", "", "STUDENT", false),
                b = new User(2, "Owner", "owner", "owner@example.org", "", "STUDENT", false);
        when(users.byId(1)).thenReturn(Optional.of(a));
        when(users.byId(2)).thenReturn(Optional.of(b));
        Resource pdf = new LectureNote();
        pdf.setId(7);
        pdf.setStatus("APPROVED");
        pdf.setUploaderEmail(b.getEmail());
        when(resources.byId(7)).thenReturn(Optional.of(pdf));
        links = new LinkFileRepository(store);
        Link video = new VideoLink();
        video.setId(7);
        video.setTitle("Video");
        video.setUrl("https://youtu.be/abcdefghijk");
        video.setStatus("APPROVED");
        video.setUploaderEmail(b.getEmail());
        links.save(video);
        Link article = new ArticleLink();
        article.setId(8);
        article.setTitle("Article");
        article.setUrl("https://example.org/article");
        article.setStatus("APPROVED");
        article.setUploaderEmail(b.getEmail());
        links.save(article);
        access = new DiscussionAccess(resources, links, users);
        library = new PersonalLibraryService(store, access, links);
        mvc =
                MockMvcBuilders.standaloneSetup(
                                new BookmarkController(library, users),
                                new PersonalLibraryController(library, users))
                        .build();
        member = new MockHttpSession();
        member.setAttribute("userId", 1L);
        other = new MockHttpSession();
        other.setAttribute("userId", 2L);
    }

    @Test
    void legacyPdfAndVideoArticleBookmarksPersistWithoutIdCollisions() throws Exception {
        store.write("bookmarks.txt", List.of("1|7"));
        mvc.perform(post("/api/bookmarks/-7").session(member)).andExpect(status().isNoContent());
        mvc.perform(post("/api/bookmarks/-8").session(member)).andExpect(status().isNoContent());
        mvc.perform(post("/api/bookmarks/-7").session(member)).andExpect(status().isNoContent());
        com.edushare.modules.download.PersonalLibraryService reload =
                new PersonalLibraryService(new TextFileStore(dir.toString()), access, links);
        assertEquals(List.of(7L, -7L, -8L), reload.state(1).get("bookmarks"));
        assertEquals(List.of(), reload.state(2).get("bookmarks"));
        mvc.perform(delete("/api/bookmarks/-7").session(member)).andExpect(status().isNoContent());
        assertEquals(List.of(7L, -8L), library.state(1).get("bookmarks"));
    }

    @Test
    void collectionsPersistItemsAndEnforceOwnership() throws Exception {
        String id = library.createCollection(1, "Exam | revision");
        library.collectionItem(1, id, 7, true);
        library.collectionItem(1, id, -7, true);
        library.collectionItem(1, id, -7, true);
        com.edushare.modules.download.PersonalLibraryService reload =
                new PersonalLibraryService(new TextFileStore(dir.toString()), access, links);
        java.util.List<?> collections = (List<?>) reload.state(1).get("collections");
        assertEquals(1, collections.size());
        assertEquals("Exam | revision", ((Map<?, ?>) collections.get(0)).get("name"));
        assertEquals(2, ((List<?>) ((Map<?, ?>) collections.get(0)).get("resourceIds")).size());
        mvc.perform(put("/api/library/collections/" + id + "/items/-8").session(other))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/library/collections/" + id).session(other))
                .andExpect(status().isNotFound());
        library.collectionItem(1, id, 7, false);
        library.deleteCollection(1, id);
        assertEquals(List.of(), library.state(1).get("collections"));
    }

    @Test
    void watchHistoryPersistsAndAutomaticUpdatesCannotUndoWatchedStatus() {
        library.progress(1, -7, "IN_PROGRESS", 200, true);
        library.progress(1, -7, "COMPLETED", 240, false);
        library.progress(1, -7, "IN_PROGRESS", 250, true);
        java.util.List<?> progress =
                (List<?>)
                        new PersonalLibraryService(new TextFileStore(dir.toString()), access, links)
                                .state(1)
                                .get("progress");
        assertEquals("COMPLETED", ((Map<?, ?>) progress.get(0)).get("status"));
        assertEquals(240, ((Map<?, ?>) progress.get(0)).get("seconds"));
        library.progress(1, -7, "IN_PROGRESS", 250, false);
        assertEquals(
                "IN_PROGRESS",
                ((Map<?, ?>) ((List<?>) library.state(1).get("progress")).get(0)).get("status"));
        library.clearProgress(1, -7);
        assertEquals(List.of(), library.state(1).get("progress"));
    }

    @Test
    void invalidUnavailableAndNonVideoTargetsAreRejected() {
        assertThrows(ResponseStatusException.class, () -> library.bookmark(1, -999, true));
        assertThrows(ResponseStatusException.class, () -> library.progress(1, 7, "COMPLETED", 0));
        assertThrows(ResponseStatusException.class, () -> library.progress(1, -8, "COMPLETED", 0));
        assertThrows(ResponseStatusException.class, () -> library.progress(1, -7, "COMPLETED", -1));
        links.hide(7);
        assertThrows(ResponseStatusException.class, () -> library.bookmark(1, -7, true));
    }

    @Test
    void hiddenAndRemovedResourcesDoNotLeakIntoPersonalLibrary() {
        library.bookmark(1, -7, true);
        String id = library.createCollection(1, "Saved");
        library.collectionItem(1, id, -7, true);
        library.progress(1, -7, "IN_PROGRESS", 20);
        links.hide(7);
        assertEquals(List.of(), library.state(1).get("bookmarks"));
        assertEquals(List.of(), library.state(1).get("progress"));
        java.util.List<?> collections = (List<?>) library.state(1).get("collections");
        assertEquals(List.of(), ((Map<?, ?>) collections.get(0)).get("resourceIds"));
    }

    @Test
    void apiRequiresCurrentAccountAndRollsBackInvalidCollectionCreation() throws Exception {
        mvc.perform(get("/api/library")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/bookmarks/-7")).andExpect(status().isUnauthorized());
        mvc.perform(
                        post("/api/library/collections")
                                .session(member)
                                .contentType("application/json")
                                .content("{\"name\":\"Bad target\",\"resourceId\":-999}"))
                .andExpect(status().isNotFound());
        assertEquals(List.of(), library.state(1).get("collections"));
        mvc.perform(
                        post("/api/library/collections")
                                .session(member)
                                .contentType("application/json")
                                .content("{\"name\":\"My videos\",\"resourceId\":-7}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/library").session(member))
                .andExpect(jsonPath("$.collections[0].resourceIds[0]").value(-7));
        mvc.perform(get("/api/library").session(other))
                .andExpect(jsonPath("$.collections.length()").value(0));
        mvc.perform(
                        put("/api/library/progress/-7")
                                .session(member)
                                .contentType("application/json")
                                .content("{\"status\":\"COMPLETED\",\"seconds\":60}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/library").session(member))
                .andExpect(jsonPath("$.progress[0].status").value("COMPLETED"));
    }

    @Test
    void collectionNamesAreValidatedAndCaseInsensitive() {
        assertThrows(ResponseStatusException.class, () -> library.createCollection(1, " "));
        library.createCollection(1, "Revision");
        assertThrows(ResponseStatusException.class, () -> library.createCollection(1, "revision"));
    }
}

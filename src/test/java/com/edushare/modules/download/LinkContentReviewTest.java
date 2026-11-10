package com.edushare.modules.download;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.edushare.modules.admin.AdminCatalogLinkController;
import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpSession;

import java.nio.file.Path;
import java.util.*;

class LinkContentReviewTest {

    @TempDir Path dir;

    ObjectMapper json = new ObjectMapper();

    LinkFileRepository repo;

    TextFileStore store;

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        repo = new LinkFileRepository(store);
    }

    Link link(String status) {
        Link link = new ArticleLink();
        link.setTitle("Programming lesson");
        link.setUrl("https://example.org/lesson");
        link.setStatus(status);
        link.setUploaderEmail("student@example.org");
        return link;
    }

    @Test
    void onlyApprovedVisibleAndRestoreCannotBypassReview() {
        Link a = repo.save(link("APPROVED")),
                b = repo.save(link("REJECTED")),
                c = repo.save(link("NEEDS_REVIEW"));
        assertEquals(1, repo.findAll().size());
        repo.hide(a.getId());
        assertTrue(repo.findAll().isEmpty());
        repo.restore(b.getId());
        repo.restore(c.getId());
        assertTrue(repo.findAll().isEmpty());
        repo.restore(a.getId());
        assertEquals(a.getId(), repo.findAll().get(0).getId());
        assertEquals(
                "REJECTED",
                new LinkFileRepository(store)
                        .findByIdIncludingHidden(b.getId())
                        .orElseThrow()
                        .getStatus());
    }

    @Test
    void legacyLinksKeepPublishedStateAndNextSavePreservesOldColumns() {
        store.write(
                "links.txt",
                List.of("1|ARTICLE|Old title|https://example.org|student@example.org|W10="));
        assertEquals(1, repo.findAll().size());
        Link old = repo.findByIdIncludingHidden(1).orElseThrow();
        old.setStatus("APPROVED");
        old.setModerationReason("Reviewed by admin | approved\nwith context");
        repo.save(old);
        Link restored = repo.findById(1).orElseThrow();
        assertEquals("Old title", restored.getTitle());
        assertEquals("[]", restored.getChapters());
        assertEquals(old.getModerationReason(), restored.getModerationReason());
    }

    @Test
    void existingEnvironmentVariablesConfigureContentChecks() {
        new org.springframework.boot.test.context.runner.ApplicationContextRunner()
                .withInitializer(
                        context -> {
                            try {
                                java.util.Properties properties =
                                        org.springframework.core.io.support.PropertiesLoaderUtils
                                                .loadProperties(
                                                        new org.springframework.core.io
                                                                .ClassPathResource(
                                                                "application.properties"));
                                context.getEnvironment()
                                        .getPropertySources()
                                        .addLast(
                                                new org.springframework.core.env
                                                        .PropertiesPropertySource(
                                                        "applicationFile", properties));
                            } catch (java.io.IOException error) {
                                throw new RuntimeException(error);
                            }
                        })
                .withPropertyValues(
                        "GEMINI_API_KEY=dummy-test-key", "GEMINI_MODEL=gemini-3.5-flash-lite")
                .withBean(
                        org.springframework.context.support.PropertySourcesPlaceholderConfigurer
                                .class)
                .withBean(ObjectMapper.class, ObjectMapper::new)
                .withBean(LinkContentPolicy.class)
                .run(
                        context -> {
                            LinkContentPolicy policy = context.getBean(LinkContentPolicy.class);
                            assertEquals(
                                    "gemini-3.5-flash-lite",
                                    org.springframework.test.util.ReflectionTestUtils.getField(
                                            policy, "model"));
                            assertEquals(
                                    "dummy-test-key",
                                    org.springframework.test.util.ReflectionTestUtils.getField(
                                            policy, "key"));
                        });
    }

    @Test
    void missingKeyDoesNotApprove() {
        assertEquals(
                "NEEDS_REVIEW",
                new LinkContentPolicy(json, "", "gemini-3.5-flash-lite")
                        .check(link("APPROVED"))
                        .getStatus());
    }

    String response(String status, double confidence, String retrieval, boolean inspected)
            throws Exception {
        String result =
                json.writeValueAsString(
                        Map.of(
                                "status",
                                status,
                                "confidence",
                                confidence,
                                "inspected",
                                inspected,
                                "reason",
                                "Source assessment",
                                "evidence",
                                "An observed paragraph"));
        return json.writeValueAsString(
                Map.of(
                        "candidates",
                        List.of(
                                Map.of(
                                        "finishReason",
                                        "STOP",
                                        "content",
                                        Map.of("parts", List.of(Map.of("text", result))),
                                        "urlContextMetadata",
                                        Map.of(
                                                "urlMetadata",
                                                List.of(
                                                        Map.of(
                                                                "retrievedUrl",
                                                                "https://example.org/lesson",
                                                                "urlRetrievalStatus",
                                                                retrieval)))))));
    }

    @Test
    void actualRetrievalAndHighConfidenceRequired() throws Exception {
        LinkContentPolicy policy = new LinkContentPolicy(json, "", "gemini-3.5-flash-lite");
        for (String status : List.of("APPROVED", "REJECTED")) {
            assertEquals(
                    status,
                    policy.interpret(
                                    json.readTree(
                                            response(
                                                    status,
                                                    .95,
                                                    "URL_RETRIEVAL_STATUS_SUCCESS",
                                                    true)),
                                    false,
                                    "https://example.org/lesson")
                            .getStatus());
            assertEquals(
                    "NEEDS_REVIEW",
                    policy.interpret(
                                    json.readTree(
                                            response(
                                                    status,
                                                    .95,
                                                    "URL_RETRIEVAL_STATUS_ERROR",
                                                    true)),
                                    false,
                                    "https://example.org/lesson")
                            .getStatus());
            assertEquals(
                    "NEEDS_REVIEW",
                    policy.interpret(
                                    json.readTree(
                                            response(
                                                    status,
                                                    .7,
                                                    "URL_RETRIEVAL_STATUS_SUCCESS",
                                                    true)),
                                    false,
                                    "https://example.org/lesson")
                            .getStatus());
            assertEquals(
                    "NEEDS_REVIEW",
                    policy.interpret(
                                    json.readTree(
                                            response(
                                                    status,
                                                    .95,
                                                    "URL_RETRIEVAL_STATUS_SUCCESS",
                                                    false)),
                                    true,
                                    "https://example.org/lesson")
                            .getStatus());
        }
        assertEquals(
                "NEEDS_REVIEW",
                policy.interpret(
                                json.readTree("{\"promptFeedback\":{\"blockReason\":\"SAFETY\"}}"),
                                false,
                                "https://example.org/lesson")
                        .getStatus());
    }

    @Test
    void createRejectedDoesNotNotifyFollowersAndEditIsCheckedAgain() {
        UserService users = mock(UserService.class);
        FollowResourceAlertService alerts = mock(FollowResourceAlertService.class);
        User owner = mock(User.class);
        when(owner.getEmail()).thenReturn("student@example.org");
        when(users.byId(1)).thenReturn(Optional.of(owner));
        LinkContentPolicy policy = mock(LinkContentPolicy.class);
        when(policy.check(any()))
                .thenReturn(
                        new LinkContentPolicy.Result(
                                "REJECTED", "Promotion of violence observed."));
        LinkController controller = new LinkController(repo, users, store, alerts, policy);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", 1L);
        com.edushare.modules.download.LinkController.LinkDto dto =
                new LinkController.LinkDto(
                        "ARTICLE", "Title", "https://example.org/lesson", "[]", "Publisher", true);
        com.edushare.modules.download.Link saved = controller.create(dto, session).getBody();
        assertNotNull(saved);
        assertEquals("REJECTED", saved.getStatus());
        assertTrue(repo.findAll().isEmpty());
        verifyNoInteractions(alerts);
        when(policy.check(any()))
                .thenReturn(
                        new LinkContentPolicy.Result("APPROVED", "Educational article observed."));
        assertEquals(200, controller.update(saved.getId(), dto, session).getStatusCode().value());
        assertEquals(1, repo.findAll().size());
        verify(policy, times(2)).check(any());
        verify(alerts).published(anyString(), anyString(), anyString(), anyString());
        MockHttpSession stranger = new MockHttpSession();
        stranger.setAttribute("userId", 2L);
        assertEquals(403, controller.update(saved.getId(), dto, stranger).getStatusCode().value());
    }

    @Test
    void adminDecisionRequiresRealAdminAndReasonAndExpectedStatus() {
        UserService users = mock(UserService.class);
        FollowResourceAlertService alerts = mock(FollowResourceAlertService.class);
        User admin = mock(User.class);
        when(admin.getRole()).thenReturn("ADMIN");
        when(users.byId(5)).thenReturn(Optional.of(admin));
        AdminCatalogLinkController controller = new AdminCatalogLinkController(repo, users, alerts);
        Link pending = repo.save(link("NEEDS_REVIEW"));
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("userId", 5L);
        com.edushare.modules.admin.AdminCatalogLinkController.Decision valid =
                new AdminCatalogLinkController.Decision(
                        "APPROVED", "Reviewed educational article.", "NEEDS_REVIEW");
        assertEquals(
                403,
                controller
                        .decide(pending.getId(), valid, new MockHttpSession())
                        .getStatusCode()
                        .value());
        assertEquals(
                400,
                controller
                        .decide(
                                pending.getId(),
                                new AdminCatalogLinkController.Decision(
                                        "APPROVED", "x", "NEEDS_REVIEW"),
                                session)
                        .getStatusCode()
                        .value());
        assertEquals(
                200, controller.decide(pending.getId(), valid, session).getStatusCode().value());
        assertEquals(
                409, controller.decide(pending.getId(), valid, session).getStatusCode().value());
        assertEquals(1, store.read("link-content-review-history.txt").size());
    }
}

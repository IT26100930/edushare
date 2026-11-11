package com.edushare.modules.review;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.modules.download.*;
import com.edushare.modules.resource.*;
import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;
import java.nio.file.Path;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ReviewCrudTest {
  @TempDir Path dir;
  TextFileStore store;
  UserFileRepository accounts;
  ReviewFileRepository reviews;
  ResourceFileRepository resources;
  LinkFileRepository links;
  MockMvc mvc;
  User author, student, peer, admin;
  long pdf, video;

  MockHttpSession session(User user) {
    MockHttpSession session = new MockHttpSession();
    session.setAttribute("userId", user.getId());
    session.setAttribute("role", user.getRole());
    session.setAttribute("email", user.getEmail());
    return session;
  }

  @BeforeEach
  void setup() {
    store = new TextFileStore(dir.toString());
    accounts = new UserFileRepository(store);
    author = accounts.save(new Student(0, "Author", "author", "author@example.org", "test", false));
    student =
        accounts.save(new Student(0, "Student", "student", "student@example.org", "test", false));
    peer = accounts.save(new Student(0, "Peer", "peer", "peer@example.org", "test", false));
    admin = accounts.save(new Admin(0, "Admin", "admin", "admin@example.org", "test"));
    resources = new ResourceFileRepository(store);
    Resource resource =
        new LectureNote(
            0, "Real notes", "IT1010", "Programming", author.getEmail(), "notes.pdf", "notes.pdf");
    resource.setStatus("APPROVED");
    pdf = resources.save(resource).getId();
    links = new LinkFileRepository(store);
    VideoLink link = new VideoLink(0, "Video", "https://www.youtube.com/watch?v=abcdef12345");
    link.setUploaderEmail(author.getEmail());
    link.setStatus("APPROVED");
    video = links.save(link).getId();
    UserService users = new UserService(accounts, store);
    ResourceService service = new ResourceService(resources);
    reviews = new ReviewFileRepository(store);
    mvc =
        MockMvcBuilders.standaloneSetup(
                new ReviewController(
                    new ReviewService(reviews),
                    service,
                    links,
                    users,
                    new DiscussionAccess(service, links, users)))
            .build();
  }

  String body(long target, int rating, String comment) {
    return "{\"id\":999,\"userId\":999,\"resourceId\":"
        + target
        + ",\"rating\":"
        + rating
        + ",\"comment\":\""
        + comment
        + "\"}";
  }

  long create() throws Exception {
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(body(pdf, 4, " Useful notes ")))
        .andExpect(status().isCreated());
    return reviews.findAll().get(0).getId();
  }

  @Test
  void createUsesSessionAndSurvivesRepositoryReload() throws Exception {
    long id = create();
    Review saved = new ReviewFileRepository(new TextFileStore(dir.toString())).findAll().get(0);
    assertNotEquals(999, id);
    assertEquals(student.getId(), saved.getUserId());
    assertEquals("Useful notes", saved.getComment());
    assertEquals(4, saved.getRating());
    mvc.perform(get("/api/reviews").param("resourceId", Long.toString(pdf)).session(session(peer)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].userId").value(student.getId()));
  }

  @Test
  void videosUseSignedIdentityWithoutPdfCollision() throws Exception {
    create();
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(body(-video, 5, "Clear video")))
        .andExpect(status().isCreated());
    mvc.perform(
            get("/api/reviews").session(session(peer)).param("resourceId", Long.toString(-video)))
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].resourceId").value(-video));
    assertEquals(2, new ReviewFileRepository(new TextFileStore(dir.toString())).findAll().size());
  }

  @Test
  void ownerCanUpdateWithoutMovingResourceOrOwner() throws Exception {
    long id = create();
    mvc.perform(
            put("/api/reviews/" + id)
                .session(session(student))
                .contentType("application/json")
                .content(body(-video, 2, "Updated")))
        .andExpect(status().isOk());
    Review saved = reviews.findAll().get(0);
    assertEquals(pdf, saved.getResourceId());
    assertEquals(student.getId(), saved.getUserId());
    assertEquals(2, saved.getRating());
    assertEquals("Updated", saved.getComment());
  }

  @Test
  void ownerCanDeleteAndRepostWithoutReusingId() throws Exception {
    long id = create();
    mvc.perform(delete("/api/reviews/" + id).session(session(student)))
        .andExpect(status().isNoContent());
    assertTrue(new ReviewFileRepository(new TextFileStore(dir.toString())).findAll().isEmpty());
    assertTrue(create() > id);
  }

  @Test
  void adminCanModerate() throws Exception {
    long id = create();
    mvc.perform(delete("/api/reviews/" + id).session(session(admin)))
        .andExpect(status().isNoContent());
  }

  @Test
  void otherStudentCannotEditOrDeleteEvenWithForgedSessionRole() throws Exception {
    long id = create();
    MockHttpSession forged = session(peer);
    forged.setAttribute("role", "ADMIN");
    mvc.perform(
            put("/api/reviews/" + id)
                .session(forged)
                .contentType("application/json")
                .content(body(pdf, 1, "Unwanted")))
        .andExpect(status().isForbidden());
    mvc.perform(delete("/api/reviews/" + id).session(forged)).andExpect(status().isForbidden());
    assertEquals(4, reviews.findAll().get(0).getRating());
  }

  @Test
  void selfReviewAndDuplicateAreRejected() throws Exception {
    mvc.perform(
            post("/api/reviews")
                .session(session(author))
                .contentType("application/json")
                .content(body(pdf, 5, "My own")))
        .andExpect(status().isForbidden());
    create();
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(body(pdf, 5, "Again")))
        .andExpect(status().isConflict());
    assertEquals(1, reviews.findAll().size());
  }

  @ParameterizedTest
  @ValueSource(ints = {-1, 0, 6, 100})
  void invalidRatingsAreNotStored(int rating) throws Exception {
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(body(pdf, rating, "Invalid")))
        .andExpect(status().isBadRequest());
    assertTrue(reviews.findAll().isEmpty());
  }

  @ParameterizedTest
  @ValueSource(strings = {"1.5", "\"5\"", "null"})
  void noSilentRatingCoercion(String rating) throws Exception {
    String input = "{\"resourceId\":" + pdf + ",\"rating\":" + rating + ",\"comment\":\"Example\"}";
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(input))
        .andExpect(status().isBadRequest());
    assertTrue(reviews.findAll().isEmpty());
  }

  @Test
  void blankAndLongTextAreRejected() throws Exception {
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(body(pdf, 4, "   ")))
        .andExpect(status().isBadRequest());
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(body(pdf, 4, "x".repeat(2001))))
        .andExpect(status().isBadRequest());
  }

  @Test
  void updateAlsoValidates() throws Exception {
    long id = create();
    mvc.perform(
            put("/api/reviews/" + id)
                .session(session(student))
                .contentType("application/json")
                .content(body(pdf, 0, "Bad")))
        .andExpect(status().isBadRequest());
    assertEquals(4, reviews.findAll().get(0).getRating());
  }

  @Test
  void hiddenAndMissingResourcesAreNotReviewableOrListed() throws Exception {
    create();
    Resource r = resources.findById(pdf).orElseThrow();
    r.setStatus("REJECTED");
    resources.save(r);
    mvc.perform(get("/api/reviews").session(session(peer)))
        .andExpect(jsonPath("$.length()").value(0));
    mvc.perform(
            post("/api/reviews")
                .session(session(peer))
                .contentType("application/json")
                .content(body(pdf, 3, "Hidden")))
        .andExpect(status().isNotFound());
    mvc.perform(
            post("/api/reviews")
                .session(session(peer))
                .contentType("application/json")
                .content(body(9999, 3, "Missing")))
        .andExpect(status().isNotFound());
  }

  @Test
  void noSessionMalformedIdentityAndSuspensionAreDenied() throws Exception {
    mvc.perform(get("/api/reviews")).andExpect(status().isUnauthorized());
    MockHttpSession invalid = new MockHttpSession();
    invalid.setAttribute("userId", "invalid");
    mvc.perform(
            post("/api/reviews")
                .session(invalid)
                .contentType("application/json")
                .content(body(pdf, 3, "No")))
        .andExpect(status().isUnauthorized());
    student.setSuspended(true);
    accounts.save(student);
    mvc.perform(
            post("/api/reviews")
                .session(session(student))
                .contentType("application/json")
                .content(body(pdf, 3, "No")))
        .andExpect(status().isUnauthorized());
  }
}

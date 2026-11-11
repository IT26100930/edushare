package com.edushare.modules.download;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.edushare.modules.admin.ResourceSellingSettingsController;
import com.edushare.modules.resource.*;
import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.nio.file.*;
import java.util.*;

class OwnedVideoSellingTest {

    @TempDir Path dir;

    TextFileStore store;

    LinkFileRepository links;

    UserService users;

    ResourceSellingRules rules;

    ResourceService resources;

    MockMvc mvc;

    MockHttpSession owner, buyer, other, admin;

    User buyerUser;

    byte[] videoBytes() {
        return new byte[] {
            0, 0, 0, 24, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm', 0, 0, 0, 0, 1, 2, 3, 4
        };
    }

    MockMultipartFile full() {
        return new MockMultipartFile("file", "my-lecture.mp4", "video/mp4", videoBytes());
    }

    MockMultipartFile preview() {
        return new MockMultipartFile("preview", "preview.mp4", "video/mp4", videoBytes());
    }

    MockHttpSession session(User u) {
        MockHttpSession s = new MockHttpSession();
        s.setAttribute("userId", u.getId());
        s.setAttribute("email", u.getEmail());
        s.setAttribute("role", u.getRole());
        return s;
    }

    @BeforeEach
    void setup() {
        store = new TextFileStore(dir.toString());
        store.write("modules.txt", List.of("1|IT1010|Programming|Programming|true"));
        links = new LinkFileRepository(store);
        resources = new ResourceService(new ResourceFileRepository(store));
        rules = new ResourceSellingRules(store);
        users = mock(UserService.class);
        User a = new User(1, "Creator", "creator", "creator@example.org", "", "STUDENT", false),
                b = new User(2, "Buyer", "buyer", "buyer@example.org", "", "STUDENT", false),
                c = new User(3, "Other", "other", "other@example.org", "", "STUDENT", false),
                d = new User(4, "Admin", "admin", "admin@example.org", "", "ADMIN", false);
        buyerUser = b;
        for (User u : List.of(a, b, c, d)) {
            when(users.byId(u.getId())).thenReturn(Optional.of(u));
        }
        owner = session(a);
        buyer = session(b);
        other = session(c);
        admin = session(d);
        mvc =
                MockMvcBuilders.standaloneSetup(
                                new OwnedVideoController(links, users, store, rules),
                                new ResourceSellingSettingsController(
                                        rules, resources, links, users))
                        .build();
    }

    long upload(String type, int price) throws Exception {
        org.springframework.test.web.servlet.MvcResult result =
                mvc.perform(
                                multipart("/api/owned-videos")
                                        .file(full())
                                        .file(preview())
                                        .param("title", "My own lecture")
                                        .param("moduleCode", "IT1010")
                                        .param("category", "Programming")
                                        .param("ownership", "OWNED")
                                        .param("originalCreator", "Creator")
                                        .param("rightsConfirmed", "true")
                                        .param("priceType", type)
                                        .param("price", String.valueOf(price))
                                        .session(owner))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.url").value(""))
                        .andExpect(jsonPath("$.status").value("NEEDS_REVIEW"))
                        .andExpect(jsonPath("$.ownedVideo").value(true))
                        .andReturn();
        return new com.fasterxml.jackson.databind.ObjectMapper()
                .readTree(result.getResponse().getContentAsString())
                .path("id")
                .asLong();
    }

    void approve(long id) {
        Link l = links.findByIdIncludingHidden(id).orElseThrow();
        l.setStatus("APPROVED");
        links.save(l);
    }

    @Test
    void pendingVideosStayPrivateAndMetadataSurvivesReload() throws Exception {
        long id = upload("Paid", 500);
        mvc.perform(get("/api/owned-videos/" + id + "/stream").session(buyer))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/owned-videos/" + id + "/preview").session(buyer))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/owned-videos/" + id + "/stream").session(owner))
                .andExpect(status().isOk());
        mvc.perform(get("/api/owned-videos/" + id + "/stream").session(admin))
                .andExpect(status().isOk());
        Link reloaded =
                new LinkFileRepository(new TextFileStore(dir.toString()))
                        .findByIdIncludingHidden(id)
                        .orElseThrow();
        assertEquals("Paid", reloaded.getPriceType());
        assertEquals(500, reloaded.getPrice());
        assertTrue(reloaded.isHasPreview());
        assertEquals("", reloaded.getUrl());
        mvc.perform(get("/api/owned-videos/" + id + "/rights").session(buyer))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/owned-videos/" + id + "/rights").session(admin))
                .andExpect(jsonPath("$.creator").value("Creator"));
    }

    @Test
    void previewIsSeparateAndPaidAccessPersistsPerAccountIncludingRangeRequests() throws Exception {
        long id = upload("Paid", 500);
        approve(id);
        // Use different preview bytes to establish this endpoint cannot send the full upload.
        String[] files = store.read("owned-video-files.txt").get(0).split("\\|", -1);
        byte[] sample = {1, 2, 3, 4};
        Files.write(dir.resolve("private-videos").resolve(files[2]), sample);
        mvc.perform(get("/api/owned-videos/" + id + "/preview").session(buyer))
                .andExpect(status().isOk())
                .andExpect(content().bytes(sample));
        mvc.perform(
                        get("/api/owned-videos/" + id + "/stream")
                                .session(buyer)
                                .header("Range", "bytes=0-3"))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/owned-videos/" + id + "/demo-unlock").session(buyer))
                .andExpect(status().isOk());
        mvc.perform(
                        get("/api/owned-videos/" + id + "/stream")
                                .session(buyer)
                                .header("Range", "bytes=0-3"))
                .andExpect(status().isPartialContent())
                .andExpect(header().string("Content-Range", "bytes 0-3/20"))
                .andExpect(content().bytes(Arrays.copyOf(videoBytes(), 4)));
        mvc.perform(get("/api/owned-videos/" + id + "/stream").session(other))
                .andExpect(status().isForbidden());
        com.edushare.modules.download.OwnedVideoController restarted =
                new OwnedVideoController(
                        new LinkFileRepository(new TextFileStore(dir.toString())),
                        users,
                        new TextFileStore(dir.toString()),
                        rules);
        assertEquals(200, restarted.stream(id, "stream", buyer).getStatusCode().value());
        mvc.perform(get("/api/owned-videos/" + id + "/stream"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void freePremiumHiddenAndSuspendedAccessAreCheckedOnEveryRequest() throws Exception {
        long free = upload("Free", 0), premium = upload("Premium", 0);
        approve(free);
        approve(premium);
        mvc.perform(get("/api/owned-videos/" + free + "/stream").session(buyer))
                .andExpect(status().isOk());
        mvc.perform(get("/api/owned-videos/" + premium + "/stream").session(buyer))
                .andExpect(status().isForbidden());
        buyerUser.setPremium(true);
        mvc.perform(get("/api/owned-videos/" + premium + "/stream").session(buyer))
                .andExpect(status().isOk());
        buyerUser.setPremium(false);
        mvc.perform(get("/api/owned-videos/" + premium + "/stream").session(buyer))
                .andExpect(status().isForbidden());
        links.hide(free);
        mvc.perform(get("/api/owned-videos/" + free + "/stream").session(buyer))
                .andExpect(status().isNotFound());
        buyerUser.setSuspended(true);
        mvc.perform(get("/api/owned-videos/" + premium + "/preview").session(buyer))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void rejectsMissingRightsFakeFilesAndPaidVideoWithoutPreviewBeforeWriting() throws Exception {
        for (String reason : List.of("rights", "preview", "file", "permission", "price")) {
            org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder
                    request =
                            multipart("/api/owned-videos")
                                    .file(
                                            reason.equals("file")
                                                    ? new MockMultipartFile(
                                                            "file",
                                                            "fake.mp4",
                                                            "video/mp4",
                                                            new byte[] {1, 2, 3})
                                                    : full());
            if (!reason.equals("preview")) {
                request.file(preview());
            }
            mvc.perform(
                            request.param("title", "Owned video")
                                    .param("moduleCode", "IT1010")
                                    .param("category", "Programming")
                                    .param(
                                            "ownership",
                                            reason.equals("permission") ? "AUTHORIZED" : "OWNED")
                                    .param("originalCreator", "Creator")
                                    .param(
                                            "rightsConfirmed",
                                            reason.equals("rights") ? "false" : "true")
                                    .param("priceType", "Paid")
                                    .param("price", reason.equals("price") ? "9000" : "500")
                                    .session(owner))
                    .andExpect(status().isBadRequest());
        }
        assertTrue(links.findAllIncludingHidden().isEmpty());
        assertTrue(store.read("owned-video-files.txt").isEmpty());
    }

    @Test
    void externalLinksCannotBecomePaidAndOldRecordsSurviveOwnedVideoSave() throws Exception {
        store.write(
                "links.txt",
                List.of("8|VIDEO|Public video|https://youtu.be/abcdefghijk|someone@example.org|"));
        long id = upload("Paid", 500);
        assertTrue(links.findById(8).isPresent());
        assertEquals("Free", links.findById(8).orElseThrow().getPriceType());
        mvc.perform(
                        put("/api/links/8/pricing")
                                .session(admin)
                                .contentType("application/json")
                                .content("{\"priceType\":\"Paid\",\"price\":100}"))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        put("/api/links/" + id + "/pricing")
                                .session(other)
                                .contentType("application/json")
                                .content("{\"priceType\":\"Paid\",\"price\":100}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminLimitsPersistFlagOldPricesAndLeaveResourcesAndSubscriptionsUntouched()
            throws Exception {
        long id = upload("Paid", 500);
        com.edushare.modules.resource.LectureNote pdf = new LectureNote();
        pdf.setTitle("Existing PDF");
        pdf.setPriceType("Paid");
        pdf.setPrice(200);
        pdf.setUploaderEmail("creator@example.org");
        resources.create(pdf);
        store.write("plan_prices.txt", List.of("premiumMonthly|199"));
        mvc.perform(
                        put("/api/config/resource-selling-limits")
                                .session(buyer)
                                .contentType("application/json")
                                .content("{\"minimum\":600,\"maximum\":1000}"))
                .andExpect(status().isForbidden());
        mvc.perform(
                        put("/api/config/resource-selling-limits")
                                .session(admin)
                                .contentType("application/json")
                                .content("{\"minimum\":600,\"maximum\":1000}"))
                .andExpect(status().isOk());
        assertEquals(
                new ResourceSellingRules.Limits(600, 1000),
                new ResourceSellingRules(new TextFileStore(dir.toString())).limits());
        assertEquals(500, links.findByIdIncludingHidden(id).orElseThrow().getPrice());
        assertEquals(200, resources.byId(pdf.getId()).orElseThrow().getPrice());
        assertEquals(List.of("premiumMonthly|199"), store.read("plan_prices.txt"));
        mvc.perform(get("/api/admin/resource-selling-exceptions").session(admin))
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(
                        put("/api/links/" + id + "/pricing")
                                .session(owner)
                                .contentType("application/json")
                                .content("{\"priceType\":\"Paid\",\"price\":500}"))
                .andExpect(status().isBadRequest());
        mvc.perform(
                        put("/api/links/" + id + "/pricing")
                                .session(owner)
                                .contentType("application/json")
                                .content("{\"priceType\":\"Paid\",\"price\":600}"))
                .andExpect(status().isOk());
    }

    @Test
    void deletingLastVideoNeverTransfersAnOldPurchaseToANewVideo() throws Exception {
        long first = upload("Paid", 500);
        approve(first);
        mvc.perform(post("/api/owned-videos/" + first + "/demo-unlock").session(buyer))
                .andExpect(status().isOk());
        links.delete(first);
        long next = upload("Paid", 500);
        assertTrue(next > first);
        approve(next);
        mvc.perform(get("/api/owned-videos/" + next + "/stream").session(buyer))
                .andExpect(status().isForbidden());
    }

    @Test
    void pdfCreateUploadAndEditUseTheSameLimitsAndPreserveOtherFields() throws Exception {
        rules.save(100, 200);
        com.edushare.modules.resource.ResourceController pdfController =
                new ResourceController(resources, "ignored", store, users);
        org.springframework.test.web.servlet.MockMvc pdfMvc =
                MockMvcBuilders.standaloneSetup(
                                pdfController,
                                new ResourceSellingSettingsController(
                                        rules, resources, links, users))
                        .build();
        String invalid =
                "{\"type\":\"LECTURE_NOTE\",\"title\":\"Test\",\"priceType\":\"Paid\",\"price\":99}";
        pdfMvc.perform(
                        post("/api/resources")
                                .session(owner)
                                .contentType("application/json")
                                .content(invalid))
                .andExpect(status().isBadRequest());
        pdfMvc.perform(
                        multipart("/api/resources/upload")
                                .file(
                                        new MockMultipartFile(
                                                "file",
                                                "notes.pdf",
                                                "application/pdf",
                                                new byte[] {1}))
                                .param("type", "LECTURE_NOTE")
                                .param("title", "Notes")
                                .param("moduleCode", "IT1010")
                                .param("category", "Programming")
                                .param("priceType", "Paid")
                                .param("price", "201")
                                .session(owner))
                .andExpect(status().isBadRequest());
        assertTrue(resources.all(null, null, null).isEmpty());
        com.edushare.modules.resource.LectureNote pdf = new LectureNote();
        pdf.setTitle("Existing title");
        pdf.setDescription("Existing description");
        pdf.setStatus("APPROVED");
        pdf.setModuleCode("IT1010");
        pdf.setCategory("Programming");
        pdf.setUploaderEmail("creator@example.org");
        pdf.setFilePath("data/uploads/original.pdf");
        pdf.setPriceType("Paid");
        pdf.setPrice(500);
        resources.create(pdf);
        pdfMvc.perform(
                        put("/api/resources/" + pdf.getId() + "/pricing")
                                .session(owner)
                                .contentType("application/json")
                                .content("{\"priceType\":\"Paid\",\"price\":200}"))
                .andExpect(status().isOk());
        com.edushare.modules.resource.Resource saved = resources.byId(pdf.getId()).orElseThrow();
        assertEquals("Existing description", saved.getDescription());
        assertEquals("APPROVED", saved.getStatus());
        assertEquals("data/uploads/original.pdf", saved.getFilePath());
        assertEquals(200, saved.getPrice());
    }

    @Test
    void invalidLimitsAndPriceBypassDoNotWrite() throws Exception {
        for (String json :
                List.of(
                        "{\"minimum\":0,\"maximum\":3000}",
                        "{\"minimum\":4000,\"maximum\":3000}",
                        "{\"minimum\":1.5,\"maximum\":3000}",
                        "{\"minimum\":30}")) {
            mvc.perform(
                            put("/api/config/resource-selling-limits")
                                    .session(admin)
                                    .contentType("application/json")
                                    .content(json))
                    .andExpect(status().isBadRequest());
        }
        assertEquals(new ResourceSellingRules.Limits(30, 3000), rules.limits());
    }
}

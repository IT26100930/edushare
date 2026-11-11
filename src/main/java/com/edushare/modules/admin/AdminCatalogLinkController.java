package com.edushare.modules.admin;

import com.edushare.modules.download.LinkFileRepository;
import com.edushare.modules.user.FollowResourceAlertService;
import com.edushare.modules.user.UserService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/catalog-links")
public class AdminCatalogLinkController {

    private final LinkFileRepository links;

    private final UserService users;

    private final FollowResourceAlertService alerts;

    public AdminCatalogLinkController(
            LinkFileRepository links, UserService users, FollowResourceAlertService alerts) {
        this.links = links;
        this.users = users;
        this.alerts = alerts;
    }

    private boolean admin(HttpSession session) {
        try {
            long id = Long.parseLong(String.valueOf(session.getAttribute("userId")));
            return users.byId(id)
                    .filter(u -> !u.isSuspended() && "ADMIN".equals(u.getRole()))
                    .isPresent();
        } catch (NumberFormatException error) {
            return false;
        }
    }

    public static final class Entry {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final long id;

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        private final String title;

        @com.fasterxml.jackson.annotation.JsonProperty("url")
        private final String url;

        @com.fasterxml.jackson.annotation.JsonProperty("linkType")
        private final String linkType;

        @com.fasterxml.jackson.annotation.JsonProperty("uploaderEmail")
        private final String uploaderEmail;

        @com.fasterxml.jackson.annotation.JsonProperty("hidden")
        private final boolean hidden;

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        private final String status;

        @com.fasterxml.jackson.annotation.JsonProperty("moderationReason")
        private final String moderationReason;

        @com.fasterxml.jackson.annotation.JsonProperty("category")
        private final String category;

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        private final String moduleCode;

        @com.fasterxml.jackson.annotation.JsonProperty("legacyPublication")
        private final boolean legacyPublication;

        @com.fasterxml.jackson.annotation.JsonProperty("ownedVideo")
        private final boolean ownedVideo;

        @com.fasterxml.jackson.annotation.JsonProperty("ownership")
        private final String ownership;

        @com.fasterxml.jackson.annotation.JsonProperty("priceType")
        private final String priceType;

        @com.fasterxml.jackson.annotation.JsonProperty("price")
        private final int price;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Entry(
                @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
                @com.fasterxml.jackson.annotation.JsonProperty("title") String title,
                @com.fasterxml.jackson.annotation.JsonProperty("url") String url,
                @com.fasterxml.jackson.annotation.JsonProperty("linkType") String linkType,
                @com.fasterxml.jackson.annotation.JsonProperty("uploaderEmail")
                        String uploaderEmail,
                @com.fasterxml.jackson.annotation.JsonProperty("hidden") boolean hidden,
                @com.fasterxml.jackson.annotation.JsonProperty("status") String status,
                @com.fasterxml.jackson.annotation.JsonProperty("moderationReason")
                        String moderationReason,
                @com.fasterxml.jackson.annotation.JsonProperty("category") String category,
                @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode,
                @com.fasterxml.jackson.annotation.JsonProperty("legacyPublication")
                        boolean legacyPublication,
                @com.fasterxml.jackson.annotation.JsonProperty("ownedVideo") boolean ownedVideo,
                @com.fasterxml.jackson.annotation.JsonProperty("ownership") String ownership,
                @com.fasterxml.jackson.annotation.JsonProperty("priceType") String priceType,
                @com.fasterxml.jackson.annotation.JsonProperty("price") int price) {
            this.id = id;
            this.title = title;
            this.url = url;
            this.linkType = linkType;
            this.uploaderEmail = uploaderEmail;
            this.hidden = hidden;
            this.status = status;
            this.moderationReason = moderationReason;
            this.category = category;
            this.moduleCode = moduleCode;
            this.legacyPublication = legacyPublication;
            this.ownedVideo = ownedVideo;
            this.ownership = ownership;
            this.priceType = priceType;
            this.price = price;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public long getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("title")
        public String getTitle() {
            return title;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("url")
        public String getUrl() {
            return url;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("linkType")
        public String getLinkType() {
            return linkType;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("uploaderEmail")
        public String getUploaderEmail() {
            return uploaderEmail;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("hidden")
        public boolean getHidden() {
            return hidden;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        public String getStatus() {
            return status;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moderationReason")
        public String getModerationReason() {
            return moderationReason;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("category")
        public String getCategory() {
            return category;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        public String getModuleCode() {
            return moduleCode;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("legacyPublication")
        public boolean getLegacyPublication() {
            return legacyPublication;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("ownedVideo")
        public boolean getOwnedVideo() {
            return ownedVideo;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("ownership")
        public String getOwnership() {
            return ownership;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("priceType")
        public String getPriceType() {
            return priceType;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("price")
        public int getPrice() {
            return price;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Entry value = (Entry) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(title, value.title)
                    && java.util.Objects.equals(url, value.url)
                    && java.util.Objects.equals(linkType, value.linkType)
                    && java.util.Objects.equals(uploaderEmail, value.uploaderEmail)
                    && java.util.Objects.equals(hidden, value.hidden)
                    && java.util.Objects.equals(status, value.status)
                    && java.util.Objects.equals(moderationReason, value.moderationReason)
                    && java.util.Objects.equals(category, value.category)
                    && java.util.Objects.equals(moduleCode, value.moduleCode)
                    && java.util.Objects.equals(legacyPublication, value.legacyPublication)
                    && java.util.Objects.equals(ownedVideo, value.ownedVideo)
                    && java.util.Objects.equals(ownership, value.ownership)
                    && java.util.Objects.equals(priceType, value.priceType)
                    && java.util.Objects.equals(price, value.price);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(title);
            result = 31 * result + java.util.Objects.hashCode(url);
            result = 31 * result + java.util.Objects.hashCode(linkType);
            result = 31 * result + java.util.Objects.hashCode(uploaderEmail);
            result = 31 * result + java.util.Objects.hashCode(hidden);
            result = 31 * result + java.util.Objects.hashCode(status);
            result = 31 * result + java.util.Objects.hashCode(moderationReason);
            result = 31 * result + java.util.Objects.hashCode(category);
            result = 31 * result + java.util.Objects.hashCode(moduleCode);
            result = 31 * result + java.util.Objects.hashCode(legacyPublication);
            result = 31 * result + java.util.Objects.hashCode(ownedVideo);
            result = 31 * result + java.util.Objects.hashCode(ownership);
            result = 31 * result + java.util.Objects.hashCode(priceType);
            result = 31 * result + java.util.Objects.hashCode(price);
            return result;
        }

        @Override
        public String toString() {
            return "Entry["
                    + "id="
                    + id
                    + ", title="
                    + title
                    + ", url="
                    + url
                    + ", linkType="
                    + linkType
                    + ", uploaderEmail="
                    + uploaderEmail
                    + ", hidden="
                    + hidden
                    + ", status="
                    + status
                    + ", moderationReason="
                    + moderationReason
                    + ", category="
                    + category
                    + ", moduleCode="
                    + moduleCode
                    + ", legacyPublication="
                    + legacyPublication
                    + ", ownedVideo="
                    + ownedVideo
                    + ", ownership="
                    + ownership
                    + ", priceType="
                    + priceType
                    + ", price="
                    + price
                    + "]";
        }
    }

    @GetMapping
    public ResponseEntity<?> all(HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(
                links.findAllIncludingHidden().stream()
                        .map(
                                link ->
                                        new Entry(
                                                link.getId(),
                                                link.getTitle(),
                                                link.getUrl(),
                                                link.getLinkType(),
                                                link.getUploaderEmail(),
                                                links.isHidden(link.getId()),
                                                link.getStatus(),
                                                link.getModerationReason(),
                                                link.getCategory(),
                                                link.getModuleCode(),
                                                link.isLegacyPublication(),
                                                link.isOwnedVideo(),
                                                link.getOwnership(),
                                                link.getPriceType(),
                                                link.getPrice()))
                        .toList());
    }

    public static final class Decision {

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        private final String status;

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        private final String reason;

        @com.fasterxml.jackson.annotation.JsonProperty("expectedStatus")
        private final String expectedStatus;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Decision(
                @com.fasterxml.jackson.annotation.JsonProperty("status") String status,
                @com.fasterxml.jackson.annotation.JsonProperty("reason") String reason,
                @com.fasterxml.jackson.annotation.JsonProperty("expectedStatus")
                        String expectedStatus) {
            this.status = status;
            this.reason = reason;
            this.expectedStatus = expectedStatus;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        public String getStatus() {
            return status;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        public String getReason() {
            return reason;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("expectedStatus")
        public String getExpectedStatus() {
            return expectedStatus;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Decision value = (Decision) other;
            return java.util.Objects.equals(status, value.status)
                    && java.util.Objects.equals(reason, value.reason)
                    && java.util.Objects.equals(expectedStatus, value.expectedStatus);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(status);
            result = 31 * result + java.util.Objects.hashCode(reason);
            result = 31 * result + java.util.Objects.hashCode(expectedStatus);
            return result;
        }

        @Override
        public String toString() {
            return "Decision["
                    + "status="
                    + status
                    + ", reason="
                    + reason
                    + ", expectedStatus="
                    + expectedStatus
                    + "]";
        }
    }

    @PostMapping("/{id}/decision")
    public ResponseEntity<?> decide(
            @PathVariable long id, @RequestBody Decision body, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (body == null
                || body.getStatus() == null
                || !Set.of("APPROVED", "REJECTED", "NEEDS_REVIEW").contains(body.getStatus())
                || body.getReason() == null
                || body.getReason().trim().length() < 10
                || body.getReason().length() > 1000) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Provide a valid decision and a reason of 10–1000"
                                        + " characters."));
        }
        synchronized (links) {
            com.edushare.modules.download.Link link =
                    links.findByIdIncludingHidden(id).orElse(null);
            if (link == null) {
                return ResponseEntity.notFound().build();
            }
            if (!link.getStatus().equals(body.getExpectedStatus())) {
                return ResponseEntity.status(409)
                        .body(Map.of("error", "This link changed. Refresh before reviewing."));
            }
            link.setStatus(body.getStatus());
            link.setModerationReason(body.getReason().trim());
            links.save(link);
            links.audit(link, "ADMIN:" + session.getAttribute("userId"));
            if ("APPROVED".equals(link.getStatus()) && !links.isHidden(id)) {
                alerts.published(
                        "backend-link-" + id,
                        link.getTitle(),
                        link.getLinkType(),
                        link.getUploaderEmail());
            }
            return ResponseEntity.ok(link);
        }
    }

    public static final class Subject {

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        private final String moduleCode;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Subject(
                @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode) {
            this.moduleCode = moduleCode;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        public String getModuleCode() {
            return moduleCode;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Subject value = (Subject) other;
            return java.util.Objects.equals(moduleCode, value.moduleCode);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(moduleCode);
            return result;
        }

        @Override
        public String toString() {
            return "Subject[" + "moduleCode=" + moduleCode + "]";
        }
    }

    @PostMapping("/{id}/subject")
    public ResponseEntity<?> subject(
            @PathVariable long id, @RequestBody Subject body, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (links.findByIdIncludingHidden(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (body == null) {
            return ResponseEntity.badRequest().build();
        }
        return links.assignModule(id, body.getModuleCode())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(
                        () ->
                                ResponseEntity.badRequest()
                                        .body(Map.of("error", "Choose an active saved module.")));
    }

    public static final class Visibility {

        @com.fasterxml.jackson.annotation.JsonProperty("hidden")
        private final Boolean hidden;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Visibility(@com.fasterxml.jackson.annotation.JsonProperty("hidden") Boolean hidden) {
            this.hidden = hidden;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("hidden")
        public Boolean getHidden() {
            return hidden;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Visibility value = (Visibility) other;
            return java.util.Objects.equals(hidden, value.hidden);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(hidden);
            return result;
        }

        @Override
        public String toString() {
            return "Visibility[" + "hidden=" + hidden + "]";
        }
    }

    @PostMapping("/{id}/visibility")
    public ResponseEntity<?> visibility(
            @PathVariable long id, @RequestBody Visibility body, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (body == null || body.getHidden() == null) {
            return ResponseEntity.badRequest().build();
        }
        synchronized (links) {
            boolean changed = body.getHidden() ? links.hide(id) : links.restore(id);
            if (!changed) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("hidden", links.isHidden(id)));
        }
    }
}

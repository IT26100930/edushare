package com.edushare.modules.admin;

import com.edushare.modules.download.LinkFileRepository;
import com.edushare.modules.resource.ResourceService;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/** Resource reports and admin decisions, persisted in data/reports.txt. */
@RestController
@RequestMapping("/api/reports")
public class ResourceReportController {

    private final TextFileStore store;

    private final ResourceService resources;

    private final LinkFileRepository links;

    private final UserService users;

    private final NotificationMailService notifyMail;

    public ResourceReportController(
            TextFileStore store,
            ResourceService resources,
            UserService users,
            LinkFileRepository links,
            NotificationMailService notifyMail) {
        this.store = store;
        this.resources = resources;
        this.links = links;
        this.users = users;
        this.notifyMail = notifyMail;
    }

    public static final class Report {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final String id;

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        private final long resourceId;

        @com.fasterxml.jackson.annotation.JsonProperty("targetTitle")
        private final String targetTitle;

        @com.fasterxml.jackson.annotation.JsonProperty("reporterId")
        private final long reporterId;

        @com.fasterxml.jackson.annotation.JsonProperty("reportedBy")
        private final String reportedBy;

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        private final String reason;

        @com.fasterxml.jackson.annotation.JsonProperty("date")
        private final String date;

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        private final String status;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Report(
                @com.fasterxml.jackson.annotation.JsonProperty("id") String id,
                @com.fasterxml.jackson.annotation.JsonProperty("resourceId") long resourceId,
                @com.fasterxml.jackson.annotation.JsonProperty("targetTitle") String targetTitle,
                @com.fasterxml.jackson.annotation.JsonProperty("reporterId") long reporterId,
                @com.fasterxml.jackson.annotation.JsonProperty("reportedBy") String reportedBy,
                @com.fasterxml.jackson.annotation.JsonProperty("reason") String reason,
                @com.fasterxml.jackson.annotation.JsonProperty("date") String date,
                @com.fasterxml.jackson.annotation.JsonProperty("status") String status) {
            this.id = id;
            this.resourceId = resourceId;
            this.targetTitle = targetTitle;
            this.reporterId = reporterId;
            this.reportedBy = reportedBy;
            this.reason = reason;
            this.date = date;
            this.status = status;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public String getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        public long getResourceId() {
            return resourceId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("targetTitle")
        public String getTargetTitle() {
            return targetTitle;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("reporterId")
        public long getReporterId() {
            return reporterId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("reportedBy")
        public String getReportedBy() {
            return reportedBy;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        public String getReason() {
            return reason;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("date")
        public String getDate() {
            return date;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        public String getStatus() {
            return status;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Report value = (Report) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(resourceId, value.resourceId)
                    && java.util.Objects.equals(targetTitle, value.targetTitle)
                    && java.util.Objects.equals(reporterId, value.reporterId)
                    && java.util.Objects.equals(reportedBy, value.reportedBy)
                    && java.util.Objects.equals(reason, value.reason)
                    && java.util.Objects.equals(date, value.date)
                    && java.util.Objects.equals(status, value.status);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(resourceId);
            result = 31 * result + java.util.Objects.hashCode(targetTitle);
            result = 31 * result + java.util.Objects.hashCode(reporterId);
            result = 31 * result + java.util.Objects.hashCode(reportedBy);
            result = 31 * result + java.util.Objects.hashCode(reason);
            result = 31 * result + java.util.Objects.hashCode(date);
            result = 31 * result + java.util.Objects.hashCode(status);
            return result;
        }

        @Override
        public String toString() {
            return "Report["
                    + "id="
                    + id
                    + ", resourceId="
                    + resourceId
                    + ", targetTitle="
                    + targetTitle
                    + ", reporterId="
                    + reporterId
                    + ", reportedBy="
                    + reportedBy
                    + ", reason="
                    + reason
                    + ", date="
                    + date
                    + ", status="
                    + status
                    + "]";
        }
    }

    public static final class Submit {

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        private final long resourceId;

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        private final String reason;

        @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl")
        private final String evidenceUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("details")
        private final String details;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Submit(
                @com.fasterxml.jackson.annotation.JsonProperty("resourceId") long resourceId,
                @com.fasterxml.jackson.annotation.JsonProperty("reason") String reason,
                @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl") String evidenceUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("details") String details) {
            this.resourceId = resourceId;
            this.reason = reason;
            this.evidenceUrl = evidenceUrl;
            this.details = details;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        public long getResourceId() {
            return resourceId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        public String getReason() {
            return reason;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl")
        public String getEvidenceUrl() {
            return evidenceUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("details")
        public String getDetails() {
            return details;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Submit value = (Submit) other;
            return java.util.Objects.equals(resourceId, value.resourceId)
                    && java.util.Objects.equals(reason, value.reason)
                    && java.util.Objects.equals(evidenceUrl, value.evidenceUrl)
                    && java.util.Objects.equals(details, value.details);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(resourceId);
            result = 31 * result + java.util.Objects.hashCode(reason);
            result = 31 * result + java.util.Objects.hashCode(evidenceUrl);
            result = 31 * result + java.util.Objects.hashCode(details);
            return result;
        }

        @Override
        public String toString() {
            return "Submit["
                    + "resourceId="
                    + resourceId
                    + ", reason="
                    + reason
                    + ", evidenceUrl="
                    + evidenceUrl
                    + ", details="
                    + details
                    + "]";
        }
    }

    public static final class Decision {

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        private final String status;

        @com.fasterxml.jackson.annotation.JsonProperty("note")
        private final String note;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Decision(
                @com.fasterxml.jackson.annotation.JsonProperty("status") String status,
                @com.fasterxml.jackson.annotation.JsonProperty("note") String note) {
            this.status = status;
            this.note = note;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        public String getStatus() {
            return status;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("note")
        public String getNote() {
            return note;
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
                    && java.util.Objects.equals(note, value.note);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(status);
            result = 31 * result + java.util.Objects.hashCode(note);
            return result;
        }

        @Override
        public String toString() {
            return "Decision[" + "status=" + status + ", note=" + note + "]";
        }
    }

    private static String encode(String input) {
        return Base64.getEncoder()
                .encodeToString((input == null ? "" : input).getBytes(StandardCharsets.UTF_8));
    }

    private static String decode(String input) {
        try {
            return new String(Base64.getDecoder().decode(input), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return "";
        }
    }

    private String now() {
        return java.time.Instant.now().toString();
    }

    private boolean validEvidence(String url, String details) {
        if (details != null && details.length() > 1200) {
            return false;
        }
        if (url == null || url.isBlank()) {
            return true;
        }
        if (url.length() > 700) {
            return false;
        }
        try {
            URI parsed = URI.create(url.trim());
            return Set.of("https", "http").contains(parsed.getScheme()) && parsed.getHost() != null;
        } catch (Exception e) {
            return false;
        }
    }

    /** Evidence is additive, never silently overwritten. Base64 protects pipe-delimited rows. */
    private void addEvidence(String reportId, long reporterId, String url, String details) {
        if ((url == null || url.isBlank()) && (details == null || details.isBlank())) {
            return;
        }
        List<String> lines = store.read("report-evidence.txt");
        lines.add(
                String.join(
                        "|",
                        reportId,
                        String.valueOf(reporterId),
                        encode(url),
                        encode(details),
                        now()));
        store.write("report-evidence.txt", lines);
    }

    private void logDecision(String reportId, long actorId, String action, String note) {
        List<String> lines = store.read("report-decision-history.txt");
        lines.add(
                String.join(
                        "|",
                        reportId,
                        String.valueOf(actorId),
                        TextFileStore.clean(action),
                        encode(note),
                        now()));
        store.write("report-decision-history.txt", lines);
    }

    private List<Map<String, Object>> evidence(String reportId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String line : store.read("report-evidence.txt")) {
            String[] fields = line.split("\\|", -1);
            if (fields.length != 5 || !reportId.equals(fields[0])) {
                continue;
            }
            result.add(
                    Map.of(
                            "userId",
                            fields[1],
                            "url",
                            decode(fields[2]),
                            "details",
                            decode(fields[3]),
                            "date",
                            fields[4]));
        }
        return result;
    }

    private List<Map<String, Object>> history(String reportId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (String line : store.read("report-decision-history.txt")) {
            String[] fields = line.split("\\|", -1);
            if (fields.length != 5 || !reportId.equals(fields[0])) {
                continue;
            }
            result.add(
                    Map.of(
                            "actorId",
                            fields[1],
                            "action",
                            fields[2],
                            "note",
                            decode(fields[3]),
                            "date",
                            fields[4]));
        }
        return result;
    }

    private long currentUser(HttpSession s) {
        try {
            return Long.parseLong(Objects.toString(s.getAttribute("userId"), "-1"));
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private boolean admin(HttpSession s) {
        Object uid = s.getAttribute("userId");
        if (uid == null) {
            return false;
        }
        try {
            long id = Long.parseLong(uid.toString());
            return users.byId(id)
                    .filter(u -> "ADMIN".equals(u.getRole()) && !u.isSuspended())
                    .isPresent();
        } catch (NumberFormatException ex) {
            return false;
        }
    }

    private List<Report> read() {
        List<Report> out = new ArrayList<>();
        for (String line : store.read("reports.txt")) {
            if (line.isBlank()) {
                continue;
            }
            String[] p = line.split("\\|", -1);
            if (p.length < 8) {
                continue;
            }
            try {
                out.add(
                        new Report(
                                p[0],
                                Long.parseLong(p[1]),
                                p[2],
                                Long.parseLong(p[3]),
                                p[4],
                                p[5],
                                p[6],
                                p[7]));
            } catch (NumberFormatException ignored) {
            }
        }
        return out;
    }

    private void write(List<Report> reports) {
        store.write(
                "reports.txt",
                reports.stream()
                        .map(
                                r ->
                                        String.join(
                                                "|",
                                                r.getId(),
                                                String.valueOf(r.getResourceId()),
                                                TextFileStore.clean(r.getTargetTitle()),
                                                String.valueOf(r.getReporterId()),
                                                TextFileStore.clean(r.getReportedBy()),
                                                TextFileStore.clean(r.getReason()),
                                                r.getDate(),
                                                r.getStatus()))
                        .toList());
    }

    @PostMapping
    public synchronized ResponseEntity<?> submit(@RequestBody Submit request, HttpSession session) {
        Object uid = session.getAttribute("userId");
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        long userId = Long.parseLong(uid.toString());
        java.util.Optional<com.edushare.modules.user.User> reporter = users.byId(userId);
        if (reporter.isEmpty() || reporter.get().isSuspended()) {
            return ResponseEntity.status(403).build();
        }
        if (request == null
                || request.getReason() == null
                || request.getReason().trim().length() < 6
                || request.getReason().trim().length() > 500) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Provide a reason (6-500 characters)."));
        }
        if (!validEvidence(request.getEvidenceUrl(), request.getDetails())) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Provide a valid HTTP(S) evidence URL and details up to 1200"
                                        + " characters."));
        }
        java.util.Optional<com.edushare.modules.resource.Resource> resource =
                resources.byId(request.getResourceId());
        if (resource.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (reporter.get().getEmail().equalsIgnoreCase(resource.get().getUploaderEmail())) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Cannot report your own resource."));
        }
        List<Report> reports = read();
        if (reports.stream()
                .anyMatch(
                        r ->
                                r.getResourceId() == request.getResourceId()
                                        && r.getReporterId() == userId)) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "You already reported this resource."));
        }
        long next = store.nextId(store.read("reports.txt"));
        Report r =
                new Report(
                        String.valueOf(next),
                        request.getResourceId(),
                        resource.get().getTitle(),
                        userId,
                        reporter.get().getName(),
                        request.getReason().trim(),
                        LocalDateTime.now().toString(),
                        "pending");
        reports.add(r);
        write(reports);
        addEvidence(r.getId(), userId, request.getEvidenceUrl(), request.getDetails());
        logDecision(r.getId(), userId, "SUBMITTED", request.getReason());
        return ResponseEntity.ok(r);
    }

    /**
     * Reports for video/article links. A negative resourceId stores link IDs without changing the
     * existing pipe-delimited reports.txt format.
     */
    public static final class LinkSubmit {

        @com.fasterxml.jackson.annotation.JsonProperty("linkId")
        private final long linkId;

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        private final String reason;

        @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl")
        private final String evidenceUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("details")
        private final String details;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public LinkSubmit(
                @com.fasterxml.jackson.annotation.JsonProperty("linkId") long linkId,
                @com.fasterxml.jackson.annotation.JsonProperty("reason") String reason,
                @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl") String evidenceUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("details") String details) {
            this.linkId = linkId;
            this.reason = reason;
            this.evidenceUrl = evidenceUrl;
            this.details = details;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("linkId")
        public long getLinkId() {
            return linkId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("reason")
        public String getReason() {
            return reason;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl")
        public String getEvidenceUrl() {
            return evidenceUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("details")
        public String getDetails() {
            return details;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            LinkSubmit value = (LinkSubmit) other;
            return java.util.Objects.equals(linkId, value.linkId)
                    && java.util.Objects.equals(reason, value.reason)
                    && java.util.Objects.equals(evidenceUrl, value.evidenceUrl)
                    && java.util.Objects.equals(details, value.details);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(linkId);
            result = 31 * result + java.util.Objects.hashCode(reason);
            result = 31 * result + java.util.Objects.hashCode(evidenceUrl);
            result = 31 * result + java.util.Objects.hashCode(details);
            return result;
        }

        @Override
        public String toString() {
            return "LinkSubmit["
                    + "linkId="
                    + linkId
                    + ", reason="
                    + reason
                    + ", evidenceUrl="
                    + evidenceUrl
                    + ", details="
                    + details
                    + "]";
        }
    }

    @PostMapping("/link")
    public synchronized ResponseEntity<?> submitLink(
            @RequestBody LinkSubmit request, HttpSession session) {
        Object uid = session.getAttribute("userId");
        if (uid == null) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Please sign in to report a link."));
        }
        long userId = Long.parseLong(uid.toString());
        java.util.Optional<com.edushare.modules.user.User> reporter = users.byId(userId);
        if (reporter.isEmpty() || reporter.get().isSuspended()) {
            return ResponseEntity.status(403).build();
        }
        if (request == null
                || request.getLinkId() <= 0
                || request.getReason() == null
                || request.getReason().trim().length() < 6
                || request.getReason().trim().length() > 500) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Please explain the issue in 6–500 characters."));
        }
        if (!validEvidence(request.getEvidenceUrl(), request.getDetails())) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Provide a valid HTTP(S) evidence URL and details up to 1200"
                                        + " characters."));
        }
        java.util.Optional<com.edushare.modules.download.Link> link =
                links.findById(request.getLinkId());
        if (link.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "The link is no longer available."));
        }
        if (reporter.get().getEmail().equalsIgnoreCase(link.get().getUploaderEmail())) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "You cannot report your own link."));
        }
        List<Report> records = read();
        long targetId = -request.getLinkId();
        if (records.stream()
                .anyMatch(r -> r.getResourceId() == targetId && r.getReporterId() == userId)) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "You have already reported this link."));
        }
        Report report =
                new Report(
                        String.valueOf(store.nextId(store.read("reports.txt"))),
                        targetId,
                        link.get().getTitle(),
                        userId,
                        reporter.get().getName(),
                        request.getReason().trim(),
                        LocalDateTime.now().toString(),
                        "pending");
        records.add(report);
        write(records);
        addEvidence(report.getId(), userId, request.getEvidenceUrl(), request.getDetails());
        logDecision(report.getId(), userId, "SUBMITTED", request.getReason());
        return ResponseEntity.ok(report);
    }

    @GetMapping("/admin")
    public ResponseEntity<?> all(HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(read());
    }

    @GetMapping("/admin/{id}/investigation")
    public ResponseEntity<?> investigate(@PathVariable String id, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        Report report = read().stream().filter(r -> r.getId().equals(id)).findFirst().orElse(null);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("report", report);
        result.put("evidence", evidence(id));
        result.put("history", history(id));
        if (report.getResourceId() < 0) {
            long linkId = -report.getResourceId();
            java.util.Optional<com.edushare.modules.download.Link> link =
                    links.findByIdIncludingHidden(linkId);
            result.put("type", "link");
            result.put("available", link.isPresent());
            result.put("hidden", links.isHidden(linkId));
            if (link.isPresent()) {
                result.put("sourceUrl", link.get().getUrl());
                result.put("uploaderEmail", Objects.toString(link.get().getUploaderEmail(), ""));
                result.put("resourceType", link.get().getLinkType());
            }
        } else {
            java.util.Optional<com.edushare.modules.resource.Resource> resource =
                    resources.byId(report.getResourceId());
            result.put("type", "resource");
            result.put("available", resource.isPresent());
            if (resource.isPresent()) {
                result.put("resourceStatus", resource.get().getStatus());
                result.put("uploaderEmail", resource.get().getUploaderEmail());
                result.put("resourceType", resource.get().getResourceType());
                result.put("description", resource.get().getDescription());
            }
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/mine")
    public ResponseEntity<?> myReports(HttpSession session) {
        long uid = currentUser(session);
        if (uid <= 0 || users.byId(uid).isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(read().stream().filter(r -> r.getReporterId() == uid).toList());
    }

    public static final class AdditionalEvidence {

        @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl")
        private final String evidenceUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("details")
        private final String details;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public AdditionalEvidence(
                @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl") String evidenceUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("details") String details) {
            this.evidenceUrl = evidenceUrl;
            this.details = details;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("evidenceUrl")
        public String getEvidenceUrl() {
            return evidenceUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("details")
        public String getDetails() {
            return details;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            AdditionalEvidence value = (AdditionalEvidence) other;
            return java.util.Objects.equals(evidenceUrl, value.evidenceUrl)
                    && java.util.Objects.equals(details, value.details);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(evidenceUrl);
            result = 31 * result + java.util.Objects.hashCode(details);
            return result;
        }

        @Override
        public String toString() {
            return "AdditionalEvidence["
                    + "evidenceUrl="
                    + evidenceUrl
                    + ", details="
                    + details
                    + "]";
        }
    }

    @PostMapping("/{id}/evidence")
    public synchronized ResponseEntity<?> additionalEvidence(
            @PathVariable String id, @RequestBody AdditionalEvidence input, HttpSession session) {
        long uid = currentUser(session);
        if (uid <= 0) {
            return ResponseEntity.status(401).build();
        }
        Report report = read().stream().filter(r -> r.getId().equals(id)).findFirst().orElse(null);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        if (report.getReporterId() != uid) {
            return ResponseEntity.status(403).build();
        }
        if (!"needs_evidence".equals(report.getStatus())) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Additional evidence was not requested."));
        }
        if (input == null
                || !validEvidence(input.getEvidenceUrl(), input.getDetails())
                || ((input.getEvidenceUrl() == null || input.getEvidenceUrl().isBlank())
                        && (input.getDetails() == null
                                || input.getDetails().trim().length() < 10))) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Provide a URL or 10+ characters of details."));
        }
        addEvidence(id, uid, input.getEvidenceUrl(), input.getDetails());
        List<Report> updated = new ArrayList<>();
        for (Report r : read()) {
            updated.add(
                    r.getId().equals(id)
                            ? new Report(
                                    r.getId(),
                                    r.getResourceId(),
                                    r.getTargetTitle(),
                                    r.getReporterId(),
                                    r.getReportedBy(),
                                    r.getReason(),
                                    r.getDate(),
                                    "pending")
                            : r);
        }
        write(updated);
        logDecision(id, uid, "EVIDENCE_SUBMITTED", "Additional evidence received");
        return ResponseEntity.ok(Map.of("status", "pending"));
    }

    @PatchMapping("/admin/{id}")
    public synchronized ResponseEntity<?> resolve(
            @PathVariable String id, @RequestBody Decision decision, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        if (decision == null
                || decision.getStatus() == null
                || !Set.of("dismissed", "resolved", "needs_evidence")
                        .contains(decision.getStatus())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Choose Dismiss, Take Down or Request Evidence."));
        }
        String note = Objects.toString(decision.getNote(), "").trim();
        if (note.length() < 10 || note.length() > 1000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Give a decision reason (10-1000 characters)."));
        }
        List<Report> records = read();
        Report item = records.stream().filter(r -> r.getId().equals(id)).findFirst().orElse(null);
        if (item == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"pending".equals(item.getStatus()) && !"needs_evidence".equals(item.getStatus())) {
            return ResponseEntity.status(409).body(Map.of("error", "Report already reviewed."));
        }
        if ("needs_evidence".equals(decision.getStatus())
                && "needs_evidence".equals(item.getStatus())) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Evidence was already requested; await the reporter."));
        }
        if ("resolved".equals(decision.getStatus())) {
            if (item.getResourceId() < 0) {
                if (!links.hide(-item.getResourceId())) {
                    return ResponseEntity.notFound().build();
                }
            } else if (resources.setStatus(item.getResourceId(), "REJECTED").isEmpty()) {
                return ResponseEntity.notFound().build();
            }
        }
        List<Report> updated = new ArrayList<>();
        for (Report r : records) {
            updated.add(
                    r.getId().equals(id)
                            ? new Report(
                                    r.getId(),
                                    r.getResourceId(),
                                    r.getTargetTitle(),
                                    r.getReporterId(),
                                    r.getReportedBy(),
                                    r.getReason(),
                                    r.getDate(),
                                    decision.getStatus())
                            : r);
        }
        write(updated);
        String eventKey = "report-" + id + "-" + now();
        logDecision(id, currentUser(session), decision.getStatus().toUpperCase(Locale.ROOT), note);
        boolean emailSent = false;
        if ("needs_evidence".equals(decision.getStatus())) {
            emailSent =
                    notifyMail.evidenceRequested(
                            item.getReporterId(), id, item.getTargetTitle(), note, eventKey);
        }
        return ResponseEntity.ok(
                Map.of("status", decision.getStatus(), "reportId", id, "emailSent", emailSent));
    }

    /** Restore content previously taken down for this report (admin-only). */
    @PostMapping("/admin/{id}/restore")
    public synchronized ResponseEntity<?> restore(
            @PathVariable String id, @RequestBody Decision input, HttpSession session) {
        if (!admin(session)) {
            return ResponseEntity.status(403).build();
        }
        String note = input == null ? "" : Objects.toString(input.getNote(), "").trim();
        if (note.length() < 10 || note.length() > 1000) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Explain why the resource should be restored (10-1000"
                                        + " characters)."));
        }
        Report report = read().stream().filter(r -> r.getId().equals(id)).findFirst().orElse(null);
        if (report == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"resolved".equals(report.getStatus())) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Only taken-down reports can be restored."));
        }
        if (report.getResourceId() < 0) {
            if (!links.restore(-report.getResourceId())) {
                return ResponseEntity.notFound().build();
            }
        } else {
            if (resources.setStatus(report.getResourceId(), "APPROVED").isEmpty()) {
                return ResponseEntity.notFound().build();
            }
        }
        List<Report> updated = new ArrayList<>();
        for (Report r : read()) {
            updated.add(
                    r.getId().equals(id)
                            ? new Report(
                                    r.getId(),
                                    r.getResourceId(),
                                    r.getTargetTitle(),
                                    r.getReporterId(),
                                    r.getReportedBy(),
                                    r.getReason(),
                                    r.getDate(),
                                    "restored")
                            : r);
        }
        write(updated);
        logDecision(id, currentUser(session), "RESTORED", note);
        return ResponseEntity.ok(Map.of("status", "restored"));
    }
}

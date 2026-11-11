package com.edushare.modules.community;

import com.edushare.modules.user.User;
import com.edushare.modules.user.UserFileRepository;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/study-groups")
public class StudyGroupController {

    private final StudyGroupFileRepository groups;

    private final UserFileRepository users;

    public StudyGroupController(StudyGroupFileRepository groups, UserFileRepository users) {
        this.groups = groups;
        this.users = users;
    }

    public static final class GroupView {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final long id;

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        private final String moduleCode;

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        private final String schedule;

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        private final String description;

        @com.fasterxml.jackson.annotation.JsonProperty("badgeColor")
        private final String badgeColor;

        @com.fasterxml.jackson.annotation.JsonProperty("membersCount")
        private final int membersCount;

        @com.fasterxml.jackson.annotation.JsonProperty("joined")
        private final boolean joined;

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        private final String meetingUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("canManageMeeting")
        private final boolean canManageMeeting;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public GroupView(
                @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode,
                @com.fasterxml.jackson.annotation.JsonProperty("schedule") String schedule,
                @com.fasterxml.jackson.annotation.JsonProperty("description") String description,
                @com.fasterxml.jackson.annotation.JsonProperty("badgeColor") String badgeColor,
                @com.fasterxml.jackson.annotation.JsonProperty("membersCount") int membersCount,
                @com.fasterxml.jackson.annotation.JsonProperty("joined") boolean joined,
                @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl") String meetingUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("canManageMeeting")
                        boolean canManageMeeting) {
            this.id = id;
            this.name = name;
            this.moduleCode = moduleCode;
            this.schedule = schedule;
            this.description = description;
            this.badgeColor = badgeColor;
            this.membersCount = membersCount;
            this.joined = joined;
            this.meetingUrl = meetingUrl;
            this.canManageMeeting = canManageMeeting;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public long getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        public String getName() {
            return name;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        public String getModuleCode() {
            return moduleCode;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        public String getSchedule() {
            return schedule;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        public String getDescription() {
            return description;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("badgeColor")
        public String getBadgeColor() {
            return badgeColor;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("membersCount")
        public int getMembersCount() {
            return membersCount;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("joined")
        public boolean getJoined() {
            return joined;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        public String getMeetingUrl() {
            return meetingUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("canManageMeeting")
        public boolean getCanManageMeeting() {
            return canManageMeeting;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            GroupView value = (GroupView) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(moduleCode, value.moduleCode)
                    && java.util.Objects.equals(schedule, value.schedule)
                    && java.util.Objects.equals(description, value.description)
                    && java.util.Objects.equals(badgeColor, value.badgeColor)
                    && java.util.Objects.equals(membersCount, value.membersCount)
                    && java.util.Objects.equals(joined, value.joined)
                    && java.util.Objects.equals(meetingUrl, value.meetingUrl)
                    && java.util.Objects.equals(canManageMeeting, value.canManageMeeting);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(moduleCode);
            result = 31 * result + java.util.Objects.hashCode(schedule);
            result = 31 * result + java.util.Objects.hashCode(description);
            result = 31 * result + java.util.Objects.hashCode(badgeColor);
            result = 31 * result + java.util.Objects.hashCode(membersCount);
            result = 31 * result + java.util.Objects.hashCode(joined);
            result = 31 * result + java.util.Objects.hashCode(meetingUrl);
            result = 31 * result + java.util.Objects.hashCode(canManageMeeting);
            return result;
        }

        @Override
        public String toString() {
            return "GroupView["
                    + "id="
                    + id
                    + ", name="
                    + name
                    + ", moduleCode="
                    + moduleCode
                    + ", schedule="
                    + schedule
                    + ", description="
                    + description
                    + ", badgeColor="
                    + badgeColor
                    + ", membersCount="
                    + membersCount
                    + ", joined="
                    + joined
                    + ", meetingUrl="
                    + meetingUrl
                    + ", canManageMeeting="
                    + canManageMeeting
                    + "]";
        }
    }

    public static final class PostRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("message")
        private final String message;

        @com.fasterxml.jackson.annotation.JsonProperty("resourceUrl")
        private final String resourceUrl;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public PostRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("message") String message,
                @com.fasterxml.jackson.annotation.JsonProperty("resourceUrl") String resourceUrl) {
            this.message = message;
            this.resourceUrl = resourceUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("message")
        public String getMessage() {
            return message;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("resourceUrl")
        public String getResourceUrl() {
            return resourceUrl;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            PostRequest value = (PostRequest) other;
            return java.util.Objects.equals(message, value.message)
                    && java.util.Objects.equals(resourceUrl, value.resourceUrl);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(message);
            result = 31 * result + java.util.Objects.hashCode(resourceUrl);
            return result;
        }

        @Override
        public String toString() {
            return "PostRequest[" + "message=" + message + ", resourceUrl=" + resourceUrl + "]";
        }
    }

    private Long userId(HttpSession s) {
        Object v = s.getAttribute("userId");
        return v == null ? null : Long.valueOf(v.toString());
    }

    /** An administrator sees all circles, including creator and meeting details. */
    public static final class AdminGroupView {

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        private final long id;

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        private final String moduleCode;

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        private final String schedule;

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        private final String description;

        @com.fasterxml.jackson.annotation.JsonProperty("badgeColor")
        private final String badgeColor;

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        private final String meetingUrl;

        @com.fasterxml.jackson.annotation.JsonProperty("creatorId")
        private final long creatorId;

        @com.fasterxml.jackson.annotation.JsonProperty("creatorName")
        private final String creatorName;

        @com.fasterxml.jackson.annotation.JsonProperty("membersCount")
        private final int membersCount;

        @com.fasterxml.jackson.annotation.JsonProperty("postsCount")
        private final int postsCount;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public AdminGroupView(
                @com.fasterxml.jackson.annotation.JsonProperty("id") long id,
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode,
                @com.fasterxml.jackson.annotation.JsonProperty("schedule") String schedule,
                @com.fasterxml.jackson.annotation.JsonProperty("description") String description,
                @com.fasterxml.jackson.annotation.JsonProperty("badgeColor") String badgeColor,
                @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl") String meetingUrl,
                @com.fasterxml.jackson.annotation.JsonProperty("creatorId") long creatorId,
                @com.fasterxml.jackson.annotation.JsonProperty("creatorName") String creatorName,
                @com.fasterxml.jackson.annotation.JsonProperty("membersCount") int membersCount,
                @com.fasterxml.jackson.annotation.JsonProperty("postsCount") int postsCount) {
            this.id = id;
            this.name = name;
            this.moduleCode = moduleCode;
            this.schedule = schedule;
            this.description = description;
            this.badgeColor = badgeColor;
            this.meetingUrl = meetingUrl;
            this.creatorId = creatorId;
            this.creatorName = creatorName;
            this.membersCount = membersCount;
            this.postsCount = postsCount;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("id")
        public long getId() {
            return id;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        public String getName() {
            return name;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        public String getModuleCode() {
            return moduleCode;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        public String getSchedule() {
            return schedule;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        public String getDescription() {
            return description;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("badgeColor")
        public String getBadgeColor() {
            return badgeColor;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        public String getMeetingUrl() {
            return meetingUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("creatorId")
        public long getCreatorId() {
            return creatorId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("creatorName")
        public String getCreatorName() {
            return creatorName;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("membersCount")
        public int getMembersCount() {
            return membersCount;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("postsCount")
        public int getPostsCount() {
            return postsCount;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            AdminGroupView value = (AdminGroupView) other;
            return java.util.Objects.equals(id, value.id)
                    && java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(moduleCode, value.moduleCode)
                    && java.util.Objects.equals(schedule, value.schedule)
                    && java.util.Objects.equals(description, value.description)
                    && java.util.Objects.equals(badgeColor, value.badgeColor)
                    && java.util.Objects.equals(meetingUrl, value.meetingUrl)
                    && java.util.Objects.equals(creatorId, value.creatorId)
                    && java.util.Objects.equals(creatorName, value.creatorName)
                    && java.util.Objects.equals(membersCount, value.membersCount)
                    && java.util.Objects.equals(postsCount, value.postsCount);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(id);
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(moduleCode);
            result = 31 * result + java.util.Objects.hashCode(schedule);
            result = 31 * result + java.util.Objects.hashCode(description);
            result = 31 * result + java.util.Objects.hashCode(badgeColor);
            result = 31 * result + java.util.Objects.hashCode(meetingUrl);
            result = 31 * result + java.util.Objects.hashCode(creatorId);
            result = 31 * result + java.util.Objects.hashCode(creatorName);
            result = 31 * result + java.util.Objects.hashCode(membersCount);
            result = 31 * result + java.util.Objects.hashCode(postsCount);
            return result;
        }

        @Override
        public String toString() {
            return "AdminGroupView["
                    + "id="
                    + id
                    + ", name="
                    + name
                    + ", moduleCode="
                    + moduleCode
                    + ", schedule="
                    + schedule
                    + ", description="
                    + description
                    + ", badgeColor="
                    + badgeColor
                    + ", meetingUrl="
                    + meetingUrl
                    + ", creatorId="
                    + creatorId
                    + ", creatorName="
                    + creatorName
                    + ", membersCount="
                    + membersCount
                    + ", postsCount="
                    + postsCount
                    + "]";
        }
    }

    private boolean isAdmin(HttpSession session) {
        Long uid = userId(session);
        if (uid == null) {
            return false;
        }
        return users.findById(uid)
                .filter(u -> !u.isSuspended() && "ADMIN".equalsIgnoreCase(u.getRole()))
                .isPresent();
    }

    @GetMapping("/admin")
    public ResponseEntity<?> adminList(HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        List<AdminGroupView> result =
                groups.findAll().stream()
                        .map(
                                g -> {
                                    long creatorId = groups.creatorId(g.getId());
                                    String creator =
                                            users.findById(creatorId)
                                                    .map(User::getName)
                                                    .orElse("Unknown / legacy group");
                                    return new AdminGroupView(
                                            g.getId(),
                                            g.getName(),
                                            g.getModuleCode(),
                                            g.getSchedule(),
                                            g.getDescription(),
                                            g.getBadgeColor(),
                                            groups.meetingUrl(g.getId()),
                                            creatorId,
                                            creator,
                                            groups.members(g.getId()).size(),
                                            groups.posts(g.getId()).size());
                                })
                        .toList();
        return ResponseEntity.ok(result);
    }

    public static final class AdminGroupUpdate {

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        private final String moduleCode;

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        private final String description;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public AdminGroupUpdate(
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode,
                @com.fasterxml.jackson.annotation.JsonProperty("description") String description) {
            this.name = name;
            this.moduleCode = moduleCode;
            this.description = description;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        public String getName() {
            return name;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        public String getModuleCode() {
            return moduleCode;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        public String getDescription() {
            return description;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            AdminGroupUpdate value = (AdminGroupUpdate) other;
            return java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(moduleCode, value.moduleCode)
                    && java.util.Objects.equals(description, value.description);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(moduleCode);
            result = 31 * result + java.util.Objects.hashCode(description);
            return result;
        }

        @Override
        public String toString() {
            return "AdminGroupUpdate["
                    + "name="
                    + name
                    + ", moduleCode="
                    + moduleCode
                    + ", description="
                    + description
                    + "]";
        }
    }

    @PutMapping("/admin/{id}")
    public ResponseEntity<?> updateGroupDetails(
            @PathVariable long id, @RequestBody AdminGroupUpdate req, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        if (groups.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (req == null
                || req.getName() == null
                || req.getModuleCode() == null
                || req.getDescription() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing group details"));
        }
        String name = req.getName().trim(),
                module = req.getModuleCode().trim(),
                description = req.getDescription().trim();
        if (name.length() < 3
                || name.length() > 80
                || module.isEmpty()
                || module.length() > 40
                || description.length() < 10
                || description.length() > 500) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Check group name, subject and description lengths"));
        }
        if (groups.findAll().stream()
                .anyMatch(g -> g.getId() != id && g.getName().equalsIgnoreCase(name))) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "Another study circle already uses that name"));
        }
        if (!groups.updateDetails(id, name, module, description)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("message", "Study circle updated"));
    }

    /** Community moderation: admins can inspect messages without joining groups. */
    @GetMapping("/admin/{id}/posts")
    public ResponseEntity<?> adminPosts(@PathVariable long id, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        if (groups.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(groups.posts(id));
    }

    /** Moderation removes one message, without deleting its circle or other messages. */
    @DeleteMapping("/admin/{id}/posts/{postId}")
    public ResponseEntity<?> removePost(
            @PathVariable long id, @PathVariable long postId, HttpSession session) {
        if (!isAdmin(session)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        if (groups.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!groups.deletePost(id, postId)) {
            return ResponseEntity.status(404).body(Map.of("error", "Message not found"));
        }
        return ResponseEntity.noContent().build();
    }

    public static final class CreateGroupRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        private final String moduleCode;

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        private final String schedule;

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        private final String description;

        @com.fasterxml.jackson.annotation.JsonProperty("badgeColor")
        private final String badgeColor;

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        private final String meetingUrl;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public CreateGroupRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("moduleCode") String moduleCode,
                @com.fasterxml.jackson.annotation.JsonProperty("schedule") String schedule,
                @com.fasterxml.jackson.annotation.JsonProperty("description") String description,
                @com.fasterxml.jackson.annotation.JsonProperty("badgeColor") String badgeColor,
                @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl") String meetingUrl) {
            this.name = name;
            this.moduleCode = moduleCode;
            this.schedule = schedule;
            this.description = description;
            this.badgeColor = badgeColor;
            this.meetingUrl = meetingUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        public String getName() {
            return name;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("moduleCode")
        public String getModuleCode() {
            return moduleCode;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        public String getSchedule() {
            return schedule;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("description")
        public String getDescription() {
            return description;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("badgeColor")
        public String getBadgeColor() {
            return badgeColor;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        public String getMeetingUrl() {
            return meetingUrl;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            CreateGroupRequest value = (CreateGroupRequest) other;
            return java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(moduleCode, value.moduleCode)
                    && java.util.Objects.equals(schedule, value.schedule)
                    && java.util.Objects.equals(description, value.description)
                    && java.util.Objects.equals(badgeColor, value.badgeColor)
                    && java.util.Objects.equals(meetingUrl, value.meetingUrl);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(moduleCode);
            result = 31 * result + java.util.Objects.hashCode(schedule);
            result = 31 * result + java.util.Objects.hashCode(description);
            result = 31 * result + java.util.Objects.hashCode(badgeColor);
            result = 31 * result + java.util.Objects.hashCode(meetingUrl);
            return result;
        }

        @Override
        public String toString() {
            return "CreateGroupRequest["
                    + "name="
                    + name
                    + ", moduleCode="
                    + moduleCode
                    + ", schedule="
                    + schedule
                    + ", description="
                    + description
                    + ", badgeColor="
                    + badgeColor
                    + ", meetingUrl="
                    + meetingUrl
                    + "]";
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateGroupRequest req, HttpSession session) {
        Long uid = userId(session);
        if (uid == null || users.findById(uid).isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        if (req == null
                || req.getName() == null
                || req.getModuleCode() == null
                || req.getDescription() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));
        }
        String name = req.getName().trim();
        String module = req.getModuleCode().trim();
        String description = req.getDescription().trim();
        String schedule =
                req.getSchedule() == null ? "Flexible / Online" : req.getSchedule().trim();
        if (schedule.isEmpty()) {
            schedule = "Flexible / Online";
        }
        if (name.length() < 3
                || name.length() > 80
                || module.isEmpty()
                || module.length() > 40
                || description.length() < 10
                || description.length() > 500
                || schedule.length() > 80) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Check name (3-80), subject (1-40), description (10-500), and"
                                        + " schedule (max 80 characters)"));
        }
        boolean exists =
                groups.findAll().stream().anyMatch(g -> g.getName().equalsIgnoreCase(name));
        if (exists) {
            return ResponseEntity.status(409)
                    .body(Map.of("error", "A study circle with this name already exists"));
        }
        String color =
                req.getBadgeColor() != null
                                && Set.of("orange", "blue", "amber", "navy")
                                        .contains(req.getBadgeColor())
                        ? req.getBadgeColor()
                        : "blue";
        String meetingUrl = req.getMeetingUrl() == null ? "" : req.getMeetingUrl().trim();
        if (!meetingUrl.isEmpty() && !validMeetingUrl(meetingUrl)) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Use an HTTPS Google Meet, Zoom or Microsoft Teams link."));
        }
        StudyGroup group =
                groups.create(name, module, schedule, description, color, meetingUrl, uid);
        return ResponseEntity.status(201).body(view(group, uid));
    }

    public static final class MeetingRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        private final String schedule;

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        private final String meetingUrl;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public MeetingRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("schedule") String schedule,
                @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl") String meetingUrl) {
            this.schedule = schedule;
            this.meetingUrl = meetingUrl;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("schedule")
        public String getSchedule() {
            return schedule;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("meetingUrl")
        public String getMeetingUrl() {
            return meetingUrl;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            MeetingRequest value = (MeetingRequest) other;
            return java.util.Objects.equals(schedule, value.schedule)
                    && java.util.Objects.equals(meetingUrl, value.meetingUrl);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(schedule);
            result = 31 * result + java.util.Objects.hashCode(meetingUrl);
            return result;
        }

        @Override
        public String toString() {
            return "MeetingRequest[" + "schedule=" + schedule + ", meetingUrl=" + meetingUrl + "]";
        }
    }

    /** Group creator or admin can update the shared meeting URL and schedule. */
    @PutMapping("/{id}/meeting")
    public ResponseEntity<?> updateMeeting(
            @PathVariable long id, @RequestBody MeetingRequest req, HttpSession session) {
        Long uid = userId(session);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        User account = users.findById(uid).orElse(null);
        if (account == null) {
            return ResponseEntity.status(401).build();
        }
        if (groups.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (groups.creatorId(id) != uid && !"ADMIN".equalsIgnoreCase(account.getRole())) {
            return ResponseEntity.status(403)
                    .body(
                            Map.of(
                                    "error",
                                    "Only this circle's creator or an administrator can edit its"
                                        + " meeting details."));
        }
        String schedule = req == null || req.getSchedule() == null ? "" : req.getSchedule().trim();
        String url = req == null || req.getMeetingUrl() == null ? "" : req.getMeetingUrl().trim();
        if (schedule.isEmpty()
                || schedule.length() > 80
                || (!url.isEmpty() && !validMeetingUrl(url))) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Enter a schedule and an HTTPS Meet, Zoom or Teams URL."));
        }
        groups.updateMeeting(id, schedule, url);
        return one(id, session);
    }

    private boolean validMeetingUrl(String value) {
        if (value == null
                || value.length() > 500
                || value.contains("|")
                || value.contains("\n")
                || value.contains("\r")) {
            return false;
        }
        try {
            java.net.URI uri = java.net.URI.create(value);
            if (!"https".equalsIgnoreCase(uri.getScheme())
                    || uri.getUserInfo() != null
                    || uri.getHost() == null) {
                return false;
            }
            String h = uri.getHost().toLowerCase(java.util.Locale.ROOT);
            return h.equals("meet.google.com")
                    || h.equals("teams.microsoft.com")
                    || h.equals("teams.live.com")
                    || h.equals("zoom.us")
                    || h.endsWith(".zoom.us")
                    || h.equals("zoom.com")
                    || h.endsWith(".zoom.com");
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public static final class DeleteGroupRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("confirmationName")
        private final String confirmationName;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public DeleteGroupRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("confirmationName")
                        String confirmationName) {
            this.confirmationName = confirmationName;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("confirmationName")
        public String getConfirmationName() {
            return confirmationName;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            DeleteGroupRequest value = (DeleteGroupRequest) other;
            return java.util.Objects.equals(confirmationName, value.confirmationName);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(confirmationName);
            return result;
        }

        @Override
        public String toString() {
            return "DeleteGroupRequest[" + "confirmationName=" + confirmationName + "]";
        }
    }

    /** Only the creator (for new groups) or an administrator can delete a circle. */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCircle(
            @PathVariable long id,
            @RequestBody(required = false) DeleteGroupRequest req,
            HttpSession session) {
        Long uid = userId(session);
        if (uid == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Please sign in."));
        }
        User account = users.findById(uid).orElse(null);
        if (account == null || account.isSuspended()) {
            return ResponseEntity.status(401).body(Map.of("error", "Your account is unavailable."));
        }
        StudyGroup group = groups.findById(id).orElse(null);
        if (group == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Study circle not found."));
        }
        boolean isAdmin = "ADMIN".equalsIgnoreCase(account.getRole());
        if (!isAdmin && groups.creatorId(id) != uid) {
            return ResponseEntity.status(403)
                    .body(
                            Map.of(
                                    "error",
                                    "Only the circle creator or an administrator can delete it."));
        }
        if (req == null
                || req.getConfirmationName() == null
                || !group.getName().equals(req.getConfirmationName().trim())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Enter the exact circle name to confirm deletion."));
        }
        if (!groups.deleteCircle(id)) {
            return ResponseEntity.status(404).body(Map.of("error", "Study circle not found."));
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<GroupView>> all(HttpSession s) {
        Long uid = userId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(groups.findAll().stream().map(g -> view(g, uid)).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupView> one(@PathVariable long id, HttpSession s) {
        Long uid = userId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        return groups.findById(id)
                .map(g -> ResponseEntity.ok(view(g, uid)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<GroupView> join(@PathVariable long id, HttpSession s) {
        Long uid = userId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        if (groups.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        groups.join(id, uid);
        return one(id, s);
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<GroupView> leave(@PathVariable long id, HttpSession s) {
        Long uid = userId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        if (groups.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        groups.leave(id, uid);
        return one(id, s);
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<Map<String, Object>>> members(@PathVariable long id, HttpSession s) {
        if (userId(s) == null) {
            return ResponseEntity.status(401).build();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Long uid : groups.members(id)) {
            users.findById(uid)
                    .ifPresent(
                            u ->
                                    out.add(
                                            Map.of(
                                                    "id",
                                                    u.getId(),
                                                    "name",
                                                    u.getName(),
                                                    "username",
                                                    u.getUsername(),
                                                    "avatar",
                                                    Objects.toString(u.getAvatar(), ""))));
        }
        return ResponseEntity.ok(out);
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<List<GroupPost>> posts(@PathVariable long id, HttpSession s) {
        Long uid = userId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        if (!groups.isMember(id, uid)) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(groups.posts(id));
    }

    @PostMapping("/{id}/posts")
    public ResponseEntity<GroupPost> addPost(
            @PathVariable long id, @RequestBody PostRequest req, HttpSession s) {
        Long uid = userId(s);
        if (uid == null) {
            return ResponseEntity.status(401).build();
        }
        if (!groups.isMember(id, uid)) {
            return ResponseEntity.status(403).build();
        }
        if (req.getMessage() == null || req.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        User u = users.findById(uid).orElse(null);
        String name = u == null ? "EduShare User" : u.getName();
        return ResponseEntity.ok(
                groups.addPost(
                        id,
                        uid,
                        name,
                        req.getMessage().trim(),
                        req.getResourceUrl() == null ? "" : req.getResourceUrl().trim()));
    }

    private GroupView view(StudyGroup g, long uid) {
        return new GroupView(
                g.getId(),
                g.getName(),
                g.getModuleCode(),
                g.getSchedule(),
                g.getDescription(),
                g.getBadgeColor(),
                groups.members(g.getId()).size(),
                groups.isMember(g.getId(), uid),
                groups.isMember(g.getId(), uid) ? groups.meetingUrl(g.getId()) : "",
                groups.creatorId(g.getId()) == uid
                        || users.findById(uid)
                                .map(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                                .orElse(false));
    }
}

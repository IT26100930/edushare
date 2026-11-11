package com.edushare.modules.download;

import com.edushare.modules.user.UserService;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/library")
public class PersonalLibraryController {

    private final PersonalLibraryService library;

    private final UserService users;

    public PersonalLibraryController(PersonalLibraryService library, UserService users) {
        this.library = library;
        this.users = users;
    }

    private long user(HttpSession session) {
        try {
            long id = Long.parseLong(String.valueOf(session.getAttribute("userId")));
            if (users.byId(id).filter(u -> !u.isSuspended()).isPresent()) {
                return id;
            }
        } catch (NumberFormatException ignored) {
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again.");
    }

    @GetMapping
    public Map<String, Object> state(HttpSession s) {
        return library.state(user(s));
    }

    public static final class CollectionRequest {

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        private final String name;

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        private final Long resourceId;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public CollectionRequest(
                @com.fasterxml.jackson.annotation.JsonProperty("name") String name,
                @com.fasterxml.jackson.annotation.JsonProperty("resourceId") Long resourceId) {
            this.name = name;
            this.resourceId = resourceId;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("name")
        public String getName() {
            return name;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("resourceId")
        public Long getResourceId() {
            return resourceId;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            CollectionRequest value = (CollectionRequest) other;
            return java.util.Objects.equals(name, value.name)
                    && java.util.Objects.equals(resourceId, value.resourceId);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(name);
            result = 31 * result + java.util.Objects.hashCode(resourceId);
            return result;
        }

        @Override
        public String toString() {
            return "CollectionRequest[" + "name=" + name + ", resourceId=" + resourceId + "]";
        }
    }

    @PostMapping("/collections")
    public Map<String, String> create(@RequestBody CollectionRequest body, HttpSession session) {
        long id = user(session);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a collection name.");
        }
        String collection = library.createCollection(id, body.getName());
        if (body.getResourceId() != null) {
            try {
                library.collectionItem(id, collection, body.getResourceId(), true);
            } catch (RuntimeException error) {
                library.deleteCollection(id, collection);
                throw error;
            }
        }
        return Map.of("id", collection);
    }

    @PutMapping("/collections/{id}/items/{resource}")
    public ResponseEntity<Void> add(
            @PathVariable String id, @PathVariable long resource, HttpSession s) {
        library.collectionItem(user(s), id, resource, true);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/collections/{id}/items/{resource}")
    public ResponseEntity<Void> remove(
            @PathVariable String id, @PathVariable long resource, HttpSession s) {
        library.collectionItem(user(s), id, resource, false);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/collections/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id, HttpSession s) {
        library.deleteCollection(user(s), id);
        return ResponseEntity.noContent().build();
    }

    public static final class Progress {

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        private final String status;

        @com.fasterxml.jackson.annotation.JsonProperty("seconds")
        private final int seconds;

        @com.fasterxml.jackson.annotation.JsonProperty("automatic")
        private final Boolean automatic;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Progress(
                @com.fasterxml.jackson.annotation.JsonProperty("status") String status,
                @com.fasterxml.jackson.annotation.JsonProperty("seconds") int seconds,
                @com.fasterxml.jackson.annotation.JsonProperty("automatic") Boolean automatic) {
            this.status = status;
            this.seconds = seconds;
            this.automatic = automatic;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("status")
        public String getStatus() {
            return status;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("seconds")
        public int getSeconds() {
            return seconds;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("automatic")
        public Boolean getAutomatic() {
            return automatic;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Progress value = (Progress) other;
            return java.util.Objects.equals(status, value.status)
                    && java.util.Objects.equals(seconds, value.seconds)
                    && java.util.Objects.equals(automatic, value.automatic);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(status);
            result = 31 * result + java.util.Objects.hashCode(seconds);
            result = 31 * result + java.util.Objects.hashCode(automatic);
            return result;
        }

        @Override
        public String toString() {
            return "Progress["
                    + "status="
                    + status
                    + ", seconds="
                    + seconds
                    + ", automatic="
                    + automatic
                    + "]";
        }
    }

    @PutMapping("/progress/{resource}")
    public ResponseEntity<Void> progress(
            @PathVariable long resource, @RequestBody Progress body, HttpSession s) {
        long user = user(s);
        if (body == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a watch status.");
        }
        library.progress(
                user,
                resource,
                body.getStatus(),
                body.getSeconds(),
                Boolean.TRUE.equals(body.getAutomatic()));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/progress/{resource}")
    public ResponseEntity<Void> clear(@PathVariable long resource, HttpSession s) {
        library.clearProgress(user(s), resource);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<?> error(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode())
                .body(
                        Map.of(
                                "error",
                                Objects.toString(error.getReason(), "Could not save changes.")));
    }
}

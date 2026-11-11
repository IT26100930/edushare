package com.edushare.modules.admin;

import com.edushare.modules.download.*;
import com.edushare.modules.resource.*;
import com.edushare.modules.user.*;

import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class ResourceSellingSettingsController {

    private final ResourceSellingRules rules;

    private final ResourceService resources;

    private final LinkFileRepository links;

    private final UserService users;

    public ResourceSellingSettingsController(
            ResourceSellingRules rules,
            ResourceService resources,
            LinkFileRepository links,
            UserService users) {
        this.rules = rules;
        this.resources = resources;
        this.links = links;
        this.users = users;
    }

    private User account(HttpSession s) {
        try {
            return users.byId(Long.parseLong(String.valueOf(s.getAttribute("userId"))))
                    .filter(u -> !u.isSuspended())
                    .orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    @GetMapping("/api/config/resource-selling-limits")
    public Object limits() {
        return rules.limits();
    }

    public static final class Settings {

        @com.fasterxml.jackson.annotation.JsonProperty("minimum")
        private final Integer minimum;

        @com.fasterxml.jackson.annotation.JsonProperty("maximum")
        private final Integer maximum;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Settings(
                @com.fasterxml.jackson.databind.annotation.JsonDeserialize(
                                using = com.edushare.shared.WholeRupeeDeserializer.class)
                        @com.fasterxml.jackson.annotation.JsonProperty("minimum")
                        Integer minimum,
                @com.fasterxml.jackson.databind.annotation.JsonDeserialize(
                                using = com.edushare.shared.WholeRupeeDeserializer.class)
                        @com.fasterxml.jackson.annotation.JsonProperty("maximum")
                        Integer maximum) {
            this.minimum = minimum;
            this.maximum = maximum;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("minimum")
        public Integer getMinimum() {
            return minimum;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("maximum")
        public Integer getMaximum() {
            return maximum;
        }

        @Override
        public boolean equals(Object other) {
            if (this == other) {
                return true;
            }
            if (other == null || getClass() != other.getClass()) {
                return false;
            }
            Settings value = (Settings) other;
            return java.util.Objects.equals(minimum, value.minimum)
                    && java.util.Objects.equals(maximum, value.maximum);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(minimum);
            result = 31 * result + java.util.Objects.hashCode(maximum);
            return result;
        }

        @Override
        public String toString() {
            return "Settings[" + "minimum=" + minimum + ", maximum=" + maximum + "]";
        }
    }

    @PutMapping("/api/config/resource-selling-limits")
    public ResponseEntity<?> save(@RequestBody Settings d, HttpSession s) {
        User u = account(s);
        if (u == null || !"ADMIN".equals(u.getRole())) {
            return ResponseEntity.status(403).build();
        }
        if (d == null || d.getMinimum() == null || d.getMaximum() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Enter both price limits."));
        }
        return ResponseEntity.ok(rules.save(d.getMinimum(), d.getMaximum()));
    }

    @GetMapping("/api/admin/resource-selling-exceptions")
    public ResponseEntity<?> exceptions(HttpSession s) {
        User u = account(s);
        if (u == null || !"ADMIN".equals(u.getRole())) {
            return ResponseEntity.status(403).build();
        }
        List<Map<String, Object>> rows = new ArrayList<>();
        resources.all(null, null, null).stream()
                .filter(r -> "Paid".equals(r.getPriceType()) && rules.outside(r.getPrice()))
                .forEach(
                        r ->
                                rows.add(
                                        Map.of(
                                                "id",
                                                "backend-resource-" + r.getId(),
                                                "title",
                                                r.getTitle(),
                                                "price",
                                                r.getPrice())));
        links.findAllIncludingHidden().stream()
                .filter(r -> "Paid".equals(r.getPriceType()) && rules.outside(r.getPrice()))
                .forEach(
                        r ->
                                rows.add(
                                        Map.of(
                                                "id",
                                                "backend-link-" + r.getId(),
                                                "title",
                                                r.getTitle(),
                                                "price",
                                                r.getPrice())));
        return ResponseEntity.ok(rows);
    }

    public static final class Pricing {

        @com.fasterxml.jackson.annotation.JsonProperty("priceType")
        private final String priceType;

        @com.fasterxml.jackson.annotation.JsonProperty("price")
        private final Integer price;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Pricing(
                @com.fasterxml.jackson.annotation.JsonProperty("priceType") String priceType,
                @com.fasterxml.jackson.databind.annotation.JsonDeserialize(
                                using = com.edushare.shared.WholeRupeeDeserializer.class)
                        @com.fasterxml.jackson.annotation.JsonProperty("price")
                        Integer price) {
            this.priceType = priceType;
            this.price = price;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("priceType")
        public String getPriceType() {
            return priceType;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("price")
        public Integer getPrice() {
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
            Pricing value = (Pricing) other;
            return java.util.Objects.equals(priceType, value.priceType)
                    && java.util.Objects.equals(price, value.price);
        }

        @Override
        public int hashCode() {
            int result = 0;
            result = 31 * result + java.util.Objects.hashCode(priceType);
            result = 31 * result + java.util.Objects.hashCode(price);
            return result;
        }

        @Override
        public String toString() {
            return "Pricing[" + "priceType=" + priceType + ", price=" + price + "]";
        }
    }

    @PutMapping("/api/resources/{id}/pricing")
    public ResponseEntity<?> price(@PathVariable long id, @RequestBody Pricing d, HttpSession s) {
        User u = account(s);
        if (u == null) {
            return ResponseEntity.status(401).build();
        }
        com.edushare.modules.resource.Resource r = resources.byId(id).orElse(null);
        if (r == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"ADMIN".equals(u.getRole()) && !u.getEmail().equalsIgnoreCase(r.getUploaderEmail())) {
            return ResponseEntity.status(403).build();
        }
        rules.validate(d.getPriceType(), d.getPrice());
        if ("PAST_PAPER".equals(r.getResourceType()) && !"Free".equals(d.getPriceType())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Official past papers must remain Free."));
        }
        r.setPriceType(d.getPriceType());
        r.setPrice(d.getPrice());
        return ResponseEntity.ok(resources.create(r));
    }

    @PutMapping("/api/links/{id}/pricing")
    public ResponseEntity<?> videoPrice(
            @PathVariable long id, @RequestBody Pricing d, HttpSession s) {
        User u = account(s);
        if (u == null) {
            return ResponseEntity.status(401).build();
        }
        com.edushare.modules.download.Link r = links.findByIdIncludingHidden(id).orElse(null);
        if (r == null) {
            return ResponseEntity.notFound().build();
        }
        if (!"ADMIN".equals(u.getRole()) && !u.getEmail().equalsIgnoreCase(r.getUploaderEmail())) {
            return ResponseEntity.status(403).build();
        }
        rules.validate(d.getPriceType(), d.getPrice());
        if (!r.isOwnedVideo() || (!"Free".equals(d.getPriceType()) && !r.isHasPreview())) {
            return ResponseEntity.badRequest()
                    .body(
                            Map.of(
                                    "error",
                                    "Paid or Premium access needs an uploaded video and a separate"
                                        + " preview clip."));
        }
        r.setPriceType(d.getPriceType());
        r.setPrice(d.getPrice());
        return ResponseEntity.ok(links.save(r));
    }
}

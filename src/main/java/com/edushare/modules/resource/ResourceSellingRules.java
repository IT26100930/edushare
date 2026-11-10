package com.edushare.modules.resource;

import com.edushare.shared.TextFileStore;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class ResourceSellingRules {

    private final TextFileStore store;

    public ResourceSellingRules(TextFileStore store) {
        this.store = store;
    }

    public static final class Limits {

        @com.fasterxml.jackson.annotation.JsonProperty("minimum")
        private final int minimum;

        @com.fasterxml.jackson.annotation.JsonProperty("maximum")
        private final int maximum;

        @com.fasterxml.jackson.annotation.JsonCreator()
        public Limits(
                @com.fasterxml.jackson.annotation.JsonProperty("minimum") int minimum,
                @com.fasterxml.jackson.annotation.JsonProperty("maximum") int maximum) {
            this.minimum = minimum;
            this.maximum = maximum;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("minimum")
        public int getMinimum() {
            return minimum;
        }

        @com.fasterxml.jackson.annotation.JsonProperty("maximum")
        public int getMaximum() {
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
            Limits value = (Limits) other;
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
            return "Limits[" + "minimum=" + minimum + ", maximum=" + maximum + "]";
        }
    }

    public Limits limits() {
        for (String row : store.read("resource-selling-limits.txt")) {
            try {
                String[] p = row.split("\\|", -1);
                int low = Integer.parseInt(p[0]), high = Integer.parseInt(p[1]);
                if (valid(low, high)) {
                    return new Limits(low, high);
                }
            } catch (RuntimeException ignored) {
            }
        }
        return new Limits(30, 3000);
    }

    private boolean valid(int low, int high) {
        return low >= 1 && high >= low && high <= 1000000;
    }

    public synchronized Limits save(int low, int high) {
        if (!valid(low, high)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Use whole rupee amounts from 1 to 1,000,000. Maximum must be at least"
                        + " minimum.");
        }
        store.write("resource-selling-limits.txt", List.of(low + "|" + high));
        return limits();
    }

    public boolean outside(int price) {
        Limits l = limits();
        return price < l.getMinimum() || price > l.getMaximum();
    }

    public void validate(String type, Integer price) {
        if (!Set.of("Free", "Paid", "Premium").contains(Objects.toString(type, ""))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Choose Free, Paid or Premium.");
        }
        if (price == null || (!"Paid".equals(type) && price != 0)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Free and Premium resources must have a selling price of zero.");
        }
        if ("Paid".equals(type) && outside(price)) {
            Limits l = limits();
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Selling price must be Rs. "
                            + l.getMinimum()
                            + " to Rs. "
                            + l.getMaximum()
                            + ". Refresh pricing limits and try again.");
        }
    }
}

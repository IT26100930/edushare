package com.edushare.modules.admin;

import com.edushare.shared.TextFileStore;
import com.fasterxml.jackson.databind.*;
import java.io.IOException;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Shared policy data for the admin form and server-side write checks. */
public class SellingPolicyStore {
  private static final String FILE = "selling-policy.txt";
  private static final List<String> TYPES =
      List.of(
          "Own notes/summary",
          "Answers or explanations for a past paper",
          "Past paper (official)",
          "Official lecture slides / textbook / e-book",
          "Video link",
          "Article link");
  private final TextFileStore store;
  private final ObjectMapper json = new ObjectMapper();

  public SellingPolicyStore(TextFileStore store) {
    this.store = store;
  }

  private JsonNode defaults() {
    Map<String, Object> prices = new LinkedHashMap<>();
    for (int i = 0; i < TYPES.size(); i++)
      prices.put(TYPES.get(i), i < 2 ? List.of("Free", "Premium", "Paid") : List.of("Free"));
    return json.valueToTree(
        Map.of(
            "allowedPricingByResourceType",
            prices,
            "keywordFlags",
            List.of(
                "Examination",
                "Faculty",
                "Confidential",
                "All rights reserved",
                "Time allowed",
                "University of Colombo",
                "SLIIT",
                "University of Moratuwa",
                "NIBM",
                "IIT"),
            "holdPeriodDays",
            14,
            "sellerEligibility",
            Map.of("requireVerifiedEmail", true, "minAccountAgeDays", 14, "minFreeUploads", 3)));
  }

  private boolean integer(JsonNode value, int max) {
    return value != null
        && value.isIntegralNumber()
        && value.canConvertToInt()
        && value.intValue() >= 0
        && value.intValue() <= max;
  }

  public boolean valid(JsonNode value) {
    if (value == null || !value.isObject() || value.size() != 4) return false;
    JsonNode prices = value.path("allowedPricingByResourceType"),
        words = value.path("keywordFlags"),
        seller = value.path("sellerEligibility");
    if (!prices.isObject() || prices.size() != TYPES.size()) return false;
    for (String type : TYPES) {
      JsonNode options = prices.path(type);
      if (!options.isArray() || options.size() < 1 || options.size() > 3) return false;
      Set<String> seen = new HashSet<>();
      for (JsonNode option : options)
        if (!option.isTextual()
            || !Set.of("Free", "Premium", "Paid").contains(option.textValue())
            || !seen.add(option.textValue())) return false;
    }
    if (!words.isArray() || words.size() > 100) return false;
    Set<String> seen = new HashSet<>();
    for (JsonNode word : words)
      if (!word.isTextual()
          || word.textValue().isBlank()
          || word.textValue().length() > 150
          || !seen.add(word.textValue().trim().toLowerCase(Locale.ROOT))) return false;
    return integer(value.get("holdPeriodDays"), 3650)
        && seller.isObject()
        && seller.size() == 3
        && seller.path("requireVerifiedEmail").isBoolean()
        && integer(seller.get("minAccountAgeDays"), 3650)
        && integer(seller.get("minFreeUploads"), 100000);
  }

  public JsonNode read() throws IOException {
    List<String> rows = store.read(FILE);
    if (rows.isEmpty()) return defaults();
    JsonNode value = json.readTree(String.join("\n", rows));
    if (!valid(value)) throw new IOException("Invalid saved policy");
    return value;
  }

  public void save(JsonNode value) throws IOException {
    if (!valid(value)) throw new IllegalArgumentException("Invalid selling policy");
    synchronized (store) {
      store.write(FILE, List.of(json.writeValueAsString(value)));
    }
  }

  public void validatePricing(
      String contentType, String priceType, String title, String description) {
    JsonNode value;
    try {
      value = read();
    } catch (Exception error) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE,
          "Saved selling rules could not be loaded. Please contact an administrator.");
    }
    boolean allowed = false;
    for (JsonNode price : value.path("allowedPricingByResourceType").path(contentType))
      if (price.asText().equals(priceType)) allowed = true;
    if (!allowed)
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST,
          "The saved selling rules do not permit this price model for "
              + contentType
              + ". Refresh the form and choose an allowed option.");
    if ("Paid".equals(priceType)) {
      String text =
          (Objects.toString(title, "") + " " + Objects.toString(description, ""))
              .toLowerCase(Locale.ROOT);
      for (JsonNode word : value.path("keywordFlags"))
        if (text.contains(word.asText().trim().toLowerCase(Locale.ROOT)))
          throw new ResponseStatusException(
              HttpStatus.BAD_REQUEST,
              "A restricted keyword was found. Choose Free and submit for administrator review.");
    }
  }

  public String documentType(String javaType, String selected) {
    String inferred;
    switch (Objects.toString(javaType, "LECTURE_NOTE").toUpperCase(Locale.ROOT)) {
      case "EBOOK":
        inferred = TYPES.get(3);
        break;
      case "PAST_PAPER":
        inferred = TYPES.get(2);
        break;
      default:
        inferred = TYPES.get(0);
        break;
    }
    if (selected == null || selected.isBlank()) return inferred;
    if (selected.equals(inferred)
        || (inferred.equals(TYPES.get(0)) && selected.equals(TYPES.get(1)))) return selected;
    throw new ResponseStatusException(
        HttpStatus.BAD_REQUEST, "Content type does not match the document type.");
  }

  public String storedDocumentType(long id, String javaType) {
    for (String row : store.read("resource-content-types.txt")) {
      String[] fields = row.split("\\|", -1);
      if (fields.length == 2 && fields[0].equals(Long.toString(id)))
        return documentType(javaType, fields[1]);
    }
    return documentType(javaType, null);
  }

  public void rememberDocumentType(long id, String label) {
    synchronized (store) {
      List<String> rows = store.read("resource-content-types.txt");
      rows.removeIf(row -> row.startsWith(id + "|"));
      rows.add(id + "|" + label);
      store.write("resource-content-types.txt", rows);
    }
  }
}

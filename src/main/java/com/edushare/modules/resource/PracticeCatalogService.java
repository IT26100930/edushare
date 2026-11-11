package com.edushare.modules.resource;

import com.edushare.modules.admin.AcademicModule;
import com.edushare.modules.admin.AcademicModuleFileRepository;
import com.edushare.modules.user.*;
import com.edushare.shared.TextFileStore;

import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.time.Instant;
import java.util.*;

/** Additive, administrator-invoked practice library. Never creates accounts or runs at startup. */
@Service
public class PracticeCatalogService {

    private final TextFileStore store;

    private final ResourceService resources;

    private final UserService users;

    private final AcademicModuleFileRepository modules;

    public PracticeCatalogService(
            TextFileStore store,
            ResourceService resources,
            UserService users,
            AcademicModuleFileRepository modules) {
        this.store = store;
        this.resources = resources;
        this.users = users;
        this.modules = modules;
    }

    private List<AcademicModule> subjects() {
        return modules.findAll().stream().filter(AcademicModule::isActive).toList();
    }

    private List<User> uploaders() {
        List<User> results = new ArrayList<>();
        for (User item : users.all()) {
            if (!(!item.isSuspended() && "STUDENT".equals(item.getRole()))) {
                continue;
            }
            results.add(item);
        }
        return Collections.unmodifiableList(results);
    }

    private String marker(AcademicModule module, int tier) {
        return "edushare-practice-v1-" + module.getId() + "-" + tier;
    }

    public Map<String, Object> preview() {
        java.util.List<com.edushare.modules.resource.Resource> existing =
                resources.all(null, null, null);
        int missing = 0;
        for (var m : subjects()) {
            for (int tier = 0; tier < 4; tier++) {
                String tag = marker(m, tier);
                if (existing.stream()
                        .noneMatch(r -> Arrays.asList(r.getTags().split(",")).contains(tag))) {
                    missing++;
                }
            }
        }
        return Map.of(
                "modules",
                subjects().stream()
                        .map(
                                m ->
                                        Map.of(
                                                "code",
                                                m.getCode(),
                                                "name",
                                                m.getName(),
                                                "category",
                                                m.getFacultySubject()))
                        .toList(),
                "uploaders",
                uploaders().stream()
                        .map(u -> Map.of("id", u.getId(), "username", u.getUsername()))
                        .toList(),
                "toAdd",
                missing);
    }

    public synchronized Map<String, Object> add(int lowerPrice, int higherPrice, long adminId)
            throws IOException {
        java.util.List<com.edushare.modules.user.User> owners = uploaders();
        if (owners.isEmpty()) {
            throw new IllegalArgumentException(
                    "Register an active student account first; practice import never creates"
                        + " users.");
        }
        Path backup =
                store.getDataDirectory()
                        .resolve("catalog-backups")
                        .resolve(
                                Instant.now().toString().replace(':', '-')
                                        + "-"
                                        + UUID.randomUUID());
        Files.createDirectories(backup);
        for (String name :
                List.of(
                        "resources.txt",
                        "links.txt",
                        "users.txt",
                        "modules.txt",
                        "categories.txt",
                        "plan_prices.txt")) {
            Path from = store.getDataDirectory().resolve(name);
            if (Files.isRegularFile(from)) {
                Files.copy(from, backup.resolve(name));
            }
        }
        Files.createDirectories(store.getUploadsDirectory());
        int added = 0, skipped = 0, index = 0;
        for (var module : subjects()) {
            for (int tier = 0; tier < 4; tier++) {
                String tag = marker(module, tier);
                if (resources.all(null, null, null).stream()
                        .anyMatch(r -> Arrays.asList(r.getTags().split(",")).contains(tag))) {
                    skipped++;
                    continue;
                }
                User owner = owners.get(index++ % owners.size());
                String kind;
                switch (tier) {
                    case 0:
                        kind = "Core notes";
                        break;
                    case 1:
                        kind = "Practice questions";
                        break;
                    case 2:
                        kind = "Worked examples";
                        break;
                    default:
                        kind = "Revision challenge";
                        break;
                }
                String title = module.getName() + " - " + kind + " (practice)";
                String file =
                        "edushare-practice-"
                                + module.getId()
                                + "-"
                                + tier
                                + "-"
                                + UUID.randomUUID()
                                + ".pdf";
                Path pdf = store.getUploadsDirectory().resolve(file);
                writePdf(pdf, title, module, tier);
                Resource resource = new LectureNote();
                resource.setTitle(title);
                resource.setModuleCode(module.getCode());
                resource.setCategory(module.getFacultySubject());
                resource.setUploaderEmail(owner.getEmail());
                resource.setFileName(file);
                resource.setFilePath(file);
                resource.setStatus("APPROVED");
                resource.setPriceType(tier == 0 ? "Free" : tier == 1 ? "Premium" : "Paid");
                resource.setPrice(tier < 2 ? 0 : tier == 2 ? lowerPrice : higherPrice);
                resource.setPages(2);
                resource.setDescription(
                        "Original EduShare practice material imported by an administrator and"
                            + " assigned to @"
                                + owner.getUsername()
                                + ". Includes core ideas, exercises and answer guidance. Not an"
                                + " official university paper.");
                resource.setAcademicYear("Year 1");
                resource.setSemester("All");
                resource.setTags(tag + ",practice,revision");
                resource.setFileSize(
                        String.format(Locale.ROOT, "%.1f KB", Files.size(pdf) / 1024.0));
                resources.create(resource);
                added++;
            }
        }
        java.util.List<java.lang.String> audit = store.read("catalog-practice-imports.txt");
        audit.add(Instant.now() + "|" + adminId + "|" + added + "|" + skipped);
        store.write("catalog-practice-imports.txt", audit);
        return Map.of(
                "added",
                added,
                "skipped",
                skipped,
                "message",
                "Practice PDFs added without replacing existing accounts or resources.");
    }

    private List<String> lesson(String category) {
        switch (category.toLowerCase(Locale.ROOT)) {
            case "programming":
                return List.of(
                        "A class defines state and behaviour; an object is an instance of a class.",
                        "Encapsulation keeps fields private and exposes controlled methods.",
                        "Inheritance reuses a parent contract; composition combines owned objects.",
                        "Overriding supplies subtype behaviour; overloading uses different"
                            + " parameters.",
                        "Exercise: Design Account and StudentAccount with a deposit method.",
                        "Answer guide: Reject negative deposits and update balance through a"
                            + " method.");
            case "cybersecurity":
                return List.of(
                        "Confidentiality limits who can read data; integrity protects correctness.",
                        "Availability means authorised users can reach the service when needed.",
                        "Authentication identifies an account; authorisation checks permitted"
                            + " actions.",
                        "Hash passwords with an appropriate password-hashing scheme and salt.",
                        "Exercise: A student can open an admin endpoint by changing the URL. Why?",
                        "Answer guide: Server-side authorisation is missing; hiding a button is"
                            + " insufficient.");
            case "databases":
                return List.of(
                        "A primary key identifies a row; a foreign key references another table.",
                        "Normalisation reduces avoidable duplication and update anomalies.",
                        "A JOIN combines related rows using an explicit matching condition.",
                        "Transactions group changes; rollback prevents partial updates.",
                        "Exercise: Design User, Resource and Bookmark tables with their keys.",
                        "Answer guide: Bookmark references User and Resource; make their pair"
                            + " unique.");
            case "networking":
                return List.of(
                        "IP addresses identify network interfaces; ports identify transport"
                            + " endpoints.",
                        "A subnet mask separates the network prefix from the host portion.",
                        "TCP provides an ordered byte stream; UDP provides independent datagrams.",
                        "DNS maps names to records; routing chooses a path between networks.",
                        "Exercise: Explain the role of DNS, TCP and HTTP when opening a web page.",
                        "Answer guide: Resolve the name, establish transport, then exchange HTTP"
                            + " messages.");
            case "ai & machine learning":
                return List.of(
                        "Supervised learning fits labelled examples; unsupervised learning finds"
                            + " structure.",
                        "Keep training, validation and test data separate to assess"
                            + " generalisation.",
                        "Overfitting learns noise; regularisation and better validation can reduce"
                            + " it.",
                        "Precision measures correctness of positive predictions; recall measures"
                            + " coverage.",
                        "Exercise: Why can high accuracy be misleading with rare positive cases?",
                        "Answer guide: Predicting the majority class may score highly while missing"
                            + " positives.");
            case "mathematics":
                return List.of(
                        "A set contains distinct elements; a relation is a set of ordered pairs.",
                        "A graph contains vertices and edges; a path connects a sequence of"
                            + " vertices.",
                        "In an unweighted graph, breadth-first search finds shortest path lengths.",
                        "A tree is connected and acyclic; a rooted tree defines parent relations.",
                        "Exercise: Find vertex depth using shortest path length from the root.",
                        "Answer guide: The root has depth zero; each edge on the path adds one.");
            case "software engineering":
                return List.of(
                        "Functional requirements describe behaviour; quality requirements constrain"
                            + " it.",
                        "Separate controllers, services and persistence so each has one clear"
                            + " purpose.",
                        "An API contract defines methods, inputs, status codes and response"
                            + " fields.",
                        "Version control records changes; small commits make reviews easier.",
                        "Exercise: Describe registration through controller, service and"
                            + " repository.",
                        "Answer guide: Validate input, enforce account rules, persist once, return"
                            + " a result.");
            case "web development":
                return List.of(
                        "HTML structures content; CSS controls presentation; JavaScript adds"
                            + " behaviour.",
                        "HTTP methods express actions; use GET for retrieval and POST for"
                            + " creation.",
                        "Client-side routing needs a server fallback when users refresh a deep"
                            + " link.",
                        "Validate on the server and escape untrusted content when rendering it.",
                        "Exercise: Explain why a React page works by clicking but fails on"
                            + " refresh.",
                        "Answer guide: The server needs to return the app entry page for valid UI"
                            + " routes.");
            default:
                return List.of(
                        "Identify the key terms in this module and define them in your own words.",
                        "Connect each definition to a practical example from a small application.",
                        "Separate assumptions, inputs, processing steps and expected outputs.",
                        "Test normal inputs, boundary values and invalid inputs.",
                        "Exercise: Write one scenario and explain each decision in its solution.",
                        "Answer guide: State assumptions clearly and justify each step with a"
                            + " concept.");
        }
    }

    private void writePdf(Path path, String title, AcademicModule module, int tier)
            throws IOException {
        try (PDDocument pdf = new PDDocument()) {
            for (int pageNumber = 0; pageNumber < 2; pageNumber++) {
                PDPage page = new PDPage();
                pdf.addPage(page);
                try (PDPageContentStream out = new PDPageContentStream(pdf, page)) {
                    out.beginText();
                    out.setFont(PDType1Font.HELVETICA, 11);
                    out.setLeading(20);
                    out.newLineAtOffset(45, 740);
                    List<String> lines = new ArrayList<>();
                    lines.add("EDUSHARE PRACTICE LIBRARY");
                    lines.add(title);
                    lines.add(module.getCode() + " / " + module.getFacultySubject());
                    lines.add("Original practice notes. Not an official university assessment.");
                    lines.add("");
                    if (pageNumber == 0) {
                        lines.addAll(lesson(module.getFacultySubject()));
                    } else {
                        lines.add("Review and application tasks");
                        lines.add("1. Explain each core concept without reading the notes.");
                        lines.add(
                                "2. Create a small example with clear input and expected output.");
                        lines.add("3. Compare two approaches and describe a limitation of each.");
                        lines.add("4. Add a boundary case and an invalid input to your example.");
                        lines.add(
                                "5. Use the answer guidance on page 1 to check your explanation.");
                        lines.add("");
                        lines.add(
                                "Level: "
                                        + (tier == 0
                                                ? "Foundations"
                                                : tier == 1
                                                        ? "Guided practice"
                                                        : tier == 2
                                                                ? "Applied examples"
                                                                : "Independent revision"));
                        lines.add(
                                "Marking guide: correct concepts, justified steps and clear"
                                    + " examples.");
                        lines.add(
                                "Publisher: EduShare Practice Library. Uploader is the assigned"
                                    + " account.");
                    }
                    for (String line : lines) {
                        for (String part : wrap(line, 82)) {
                            out.showText(part.replaceAll("[^\\x20-\\x7E]", "?"));
                            out.newLine();
                        }
                    }
                    out.endText();
                }
            }
            pdf.save(path.toFile());
        }
    }

    private List<String> wrap(String text, int width) {
        List<String> lines = new ArrayList<>();
        while (text.length() > width) {
            int at = text.lastIndexOf(' ', width);
            if (at < 1) {
                at = width;
            }
            lines.add(text.substring(0, at));
            text = text.substring(at).stripLeading();
        }
        lines.add(text);
        return lines;
    }
}

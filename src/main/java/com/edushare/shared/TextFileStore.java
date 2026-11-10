package com.edushare.shared;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;

@Component
public class TextFileStore {

    private final Path dataDir;

    public TextFileStore(@Value("${edushare.data-dir:data}") String dir) {
        Path configured = Paths.get(dir);
        if (!configured.isAbsolute() && "data".equals(dir)) {
            // The archive contains project/data. IntelliJ may start from the ZIP's
            // outer folder, project/, or a different folder entirely.
            // Resolve existing account storage before choosing a data directory.
            Path cwd = Paths.get("").toAbsolutePath().normalize();
            List<Path> candidates = new ArrayList<>();
            Path cursor = cwd;
            for (int depth = 0; depth < 7 && cursor != null; depth++, cursor = cursor.getParent()) {
                candidates.add(cursor.resolve("data"));
                candidates.add(cursor.resolve("project").resolve("data"));
                candidates.add(
                        cursor.resolve("EduShare-English-UI-Language-Save-Fixed")
                                .resolve("project")
                                .resolve("data"));
            }
            // When IntelliJ uses a detached working directory, target/classes
            // remains adjacent to the actual source project directory.
            try {
                Path classLocation =
                        Paths.get(
                                        TextFileStore.class
                                                .getProtectionDomain()
                                                .getCodeSource()
                                                .getLocation()
                                                .toURI())
                                .toAbsolutePath()
                                .normalize();
                Path codeCursor = classLocation;
                for (int depth = 0;
                        depth < 7 && codeCursor != null;
                        depth++, codeCursor = codeCursor.getParent()) {
                    candidates.add(codeCursor.resolve("data"));
                }
            } catch (Exception ignored) {
            }
            // Prefer data next to the running compiled project's pom.xml.
            // Other ZIPs in parent folders may contain stale users.txt copies.
            Path compiledProject = null;
            try {
                Path classLocation =
                        Paths.get(
                                        TextFileStore.class
                                                .getProtectionDomain()
                                                .getCodeSource()
                                                .getLocation()
                                                .toURI())
                                .toAbsolutePath()
                                .normalize();
                Path cursor2 = classLocation;
                for (int i = 0; i < 7 && cursor2 != null; i++, cursor2 = cursor2.getParent()) {
                    if (Files.isRegularFile(cursor2.resolve("pom.xml"))) {
                        compiledProject = cursor2;
                        break;
                    }
                }
            } catch (Exception ignored) {
            }
            Path preferred = compiledProject == null ? null : compiledProject.resolve("data");
            if (preferred != null) {
                candidates.add(0, preferred);
            }
            Optional<Path> existing =
                    candidates.stream()
                            .map(p -> p.toAbsolutePath().normalize())
                            .distinct()
                            .filter(p -> Files.isRegularFile(p.resolve("users.txt")))
                            .findFirst();
            if (existing.isPresent()) {
                configured = existing.get();
            } else {
                // Prefer data alongside the actual Maven project, never create
                // an accidental data folder at the outer archive directory.
                Optional<Path> project =
                        candidates.stream()
                                .map(Path::getParent)
                                .filter(Objects::nonNull)
                                .filter(p -> Files.isRegularFile(p.resolve("pom.xml")))
                                .findFirst();
                configured = project.map(p -> p.resolve("data")).orElse(cwd.resolve("data"));
            }
        }
        this.dataDir = configured.toAbsolutePath().normalize();
        System.out.println("[EduShare] ACTIVE DATA DIRECTORY: " + this.dataDir);
        System.out.println("[EduShare] User accounts file: " + this.dataDir.resolve("users.txt"));
        if (!Files.exists(this.dataDir.resolve("users.txt"))) {
            System.err.println(
                    "[EduShare] WARNING: No users.txt in the ACTIVE DATA DIRECTORY. "
                            + "If your admin exists elsewhere, set edushare.data-dir "
                            + "to the correct absolute path; do NOT overwrite account data.");
        }
        try {
            Files.createDirectories(dataDir);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public Path getDataDirectory() {
        return dataDir;
    }

    public Path getUploadsDirectory() {
        return dataDir.resolve("uploads");
    }

    public synchronized boolean exists(String file) {
        return Files.exists(dataDir.resolve(file));
    }

    public synchronized List<String> read(String file) {
        Path p = dataDir.resolve(file);
        if (!Files.exists(p)) {
            return new ArrayList<>();
        }
        try {
            return new ArrayList<>(Files.readAllLines(p, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new RuntimeException("Cannot read " + file, e);
        }
    }

    /** Replace one data file atomically, so partial writes never become visible. */
    public synchronized void write(String file, List<String> lines) {
        Path destination = dataDir.resolve(file).toAbsolutePath().normalize();
        if (!destination.getParent().equals(dataDir.toAbsolutePath().normalize())) {
            throw new IllegalArgumentException("Invalid data file name");
        }
        Path temporary = null;
        try {
            Files.createDirectories(dataDir);
            temporary = Files.createTempFile(dataDir, ".edushare-", ".tmp");
            Files.write(
                    temporary,
                    lines,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.WRITE,
                    StandardOpenOption.TRUNCATE_EXISTING);
            try {
                Files.move(
                        temporary,
                        destination,
                        StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE);
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(temporary, destination, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException e) {
            throw new RuntimeException("Cannot safely write " + file, e);
        } finally {
            if (temporary != null) {
                try {
                    Files.deleteIfExists(temporary);
                } catch (IOException ignored) {
                }
            }
        }
    }

    public long nextId(List<String> lines) {
        return lines.stream()
                        .filter(s -> !s.isBlank())
                        .map(s -> s.split("\\|", -1)[0])
                        .mapToLong(
                                v -> {
                                    try {
                                        return Long.parseLong(v);
                                    } catch (Exception e) {
                                        return 0;
                                    }
                                })
                        .max()
                        .orElse(0)
                + 1;
    }

    public static String clean(String v) {
        return v == null ? "" : v.replace("|", "/").replace("\n", " ").replace("\r", " ");
    }

    public static boolean yes(String v) {
        return "true".equalsIgnoreCase(v);
    }
}

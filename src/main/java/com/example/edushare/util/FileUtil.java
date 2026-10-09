package com.example.edushare.util;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Small helper for the pipe-delimited .txt "database" files stored in the data/ folder.
 * Special characters inside a field are escaped so every record always fits on one line.
 */
public final class FileUtil {

    public static final String DATA_DIR = "data";
    private static final String SEP = "|";

    private FileUtil() {
    }

    public static Path path(String fileName) {
        return Paths.get(DATA_DIR, fileName);
    }

    public static synchronized List<String> readLines(String fileName) {
        Path p = path(fileName);
        try {
            if (Files.notExists(p)) {
                Files.createDirectories(p.getParent());
                Files.createFile(p);
            }
            List<String> out = new ArrayList<>();
            for (String line : Files.readAllLines(p, StandardCharsets.UTF_8)) {
                if (!line.isBlank() && !line.startsWith("#")) {
                    out.add(line);
                }
            }
            return out;
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot read " + p, e);
        }
    }

    public static synchronized void writeLines(String fileName, List<String> lines) {
        Path p = path(fileName);
        try {
            Files.createDirectories(p.getParent());
            Files.write(p, lines, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot write " + p, e);
        }
    }

    /** Joins fields into one record line (each field is escaped). */
    public static String join(Object... fields) {
        List<String> parts = new ArrayList<>();
        for (Object f : fields) {
            parts.add(encode(f == null ? "" : String.valueOf(f)));
        }
        return String.join(SEP, parts);
    }

    /** Splits one record line back into decoded fields. */
    public static String[] split(String line) {
        String[] raw = line.split("\\|", -1);
        for (int i = 0; i < raw.length; i++) {
            raw[i] = decode(raw[i]);
        }
        return raw;
    }

    public static String get(String[] fields, int index) {
        return index < fields.length ? fields[index] : "";
    }

    public static int parseInt(String s, int fallback) {
        try {
            return Integer.parseInt(s.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    public static double parseDouble(String s, double fallback) {
        try {
            return Double.parseDouble(s.trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    public static String newId(String prefix) {
        return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private static String encode(String s) {
        StringBuilder b = new StringBuilder();
        for (char c : s.toCharArray()) {
            switch (c) {
                case '\\' -> b.append("\\\\");
                case '|' -> b.append("\\p");
                case '\n' -> b.append("\\n");
                case '\r' -> {
                }
                default -> b.append(c);
            }
        }
        return b.toString();
    }

    private static String decode(String s) {
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\\' && i + 1 < s.length()) {
                char n = s.charAt(++i);
                if (n == 'n') {
                    b.append('\n');
                } else if (n == 'p') {
                    b.append('|');
                } else {
                    b.append(n);
                }
            } else {
                b.append(c);
            }
        }
        return b.toString();
    }
}

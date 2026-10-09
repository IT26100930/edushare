package com.example.edushare.util;

/** Colour helpers used for category chips and avatars. */
public final class ColorUtil {

    private static final String[] PALETTE = {
            "#4D96FF", "#2EC4B6", "#9B5DE5", "#FF9F1C", "#FF595E", "#FFD23F", "#6BCB77"
    };

    private ColorUtil() {
    }

    public static String fromText(String text) {
        if (text == null || text.isEmpty()) {
            return PALETTE[0];
        }
        return PALETTE[Math.abs(text.hashCode()) % PALETTE.length];
    }

    public static boolean isHex(String c) {
        return c != null && c.matches("^#[0-9a-fA-F]{6}$");
    }

    public static String safe(String color, String fallbackSeed) {
        return isHex(color) ? color : fromText(fallbackSeed);
    }

    public static String initials(String name) {
        if (name == null || name.isBlank()) {
            return "?";
        }
        String[] parts = name.trim().split("\\s+");
        String first = parts[0].substring(0, 1);
        String second = parts.length > 1 ? parts[parts.length - 1].substring(0, 1) : "";
        return (first + second).toUpperCase();
    }
}

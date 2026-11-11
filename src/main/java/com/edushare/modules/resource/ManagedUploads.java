package com.edushare.modules.resource;

import com.edushare.shared.TextFileStore;
import java.io.IOException;
import java.nio.file.*;

/** Resolve only a managed upload inside the active data directory, including legacy records. */
public final class ManagedUploads {
  private ManagedUploads() {}

  public static Path resolve(TextFileStore store, String stored) {
    Path root = store.getUploadsDirectory().toAbsolutePath().normalize();
    if (stored == null || stored.isBlank()) return root.resolve(".missing-upload");
    String portable = stored.replace('\\', '/');
    for (String part : portable.split("/")) {
      if (part.equals("..") || part.indexOf('\0') >= 0) return root.resolve(".missing-upload");
    }
    int separator = portable.lastIndexOf('/');
    String name = portable.substring(separator + 1);
    // Recognize a bare filename, uploads/file, data/uploads/file, or an older managed absolute
    // path.
    if (separator >= 0
        && !portable.substring(0, separator).endsWith("/uploads")
        && !portable.substring(0, separator).equals("uploads"))
      return root.resolve(".missing-upload");
    if (name.isBlank() || name.equals(".") || name.equals("..") || name.contains(":"))
      return root.resolve(".missing-upload");
    Path candidate = root.resolve(name).normalize();
    if (!candidate.startsWith(root)) return root.resolve(".missing-upload");
    try {
      if (Files.exists(candidate) && !candidate.toRealPath().startsWith(root.toRealPath()))
        return root.resolve(".missing-upload");
    } catch (IOException error) {
      return root.resolve(".missing-upload");
    }
    return candidate;
  }
}

package com.edushare.modules.resource;

import com.edushare.modules.user.User;
import com.edushare.shared.TextFileStore;
import java.util.Locale;

/** The same full-document entitlement rule is used for delivery and download history. */
public final class ResourceAccess {
  private ResourceAccess() {}

  public static boolean canRead(Resource resource, User user, TextFileStore store) {
    if (user == null || user.isSuspended()) return false;
    boolean owner = user.getEmail().equalsIgnoreCase(resource.getUploaderEmail());
    boolean admin = "ADMIN".equals(user.getRole());
    if (!"APPROVED".equalsIgnoreCase(resource.getStatus()) && !owner && !admin) return false;
    if (owner || admin || "Free".equalsIgnoreCase(resource.getPriceType())) return true;
    if ("Premium".equalsIgnoreCase(resource.getPriceType())) return user.isPremium();
    return "Paid".equalsIgnoreCase(resource.getPriceType())
        && store
            .read("demo_resource_unlocks.txt")
            .contains(user.getEmail().toLowerCase(Locale.ROOT) + "|" + resource.getId());
  }
}

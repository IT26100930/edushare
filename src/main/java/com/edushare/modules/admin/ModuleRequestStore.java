package com.edushare.modules.admin;

import com.edushare.shared.TextFileStore;
import java.util.*;

public class ModuleRequestStore {
  private static final String FILE = "module-requests.txt";
  private final TextFileStore store;

  public ModuleRequestStore(TextFileStore store) {
    this.store = store;
  }

  public List<ModuleRequest> all() {
    List<ModuleRequest> results = new ArrayList<>();
    for (String line : store.read(FILE)) {
      String[] p = line.split("\\|", -1);
      try {
        if (p.length == 11)
          results.add(
              new ModuleRequest(
                  Long.parseLong(p[0]),
                  Long.parseLong(p[1]),
                  p[2],
                  p[3],
                  p[4],
                  p[5],
                  p[6],
                  p[7],
                  p[8],
                  p[9],
                  Long.parseLong(p[10])));
      } catch (NumberFormatException invalid) {
        /* Preserve but ignore malformed legacy rows. */
      }
    }
    return results;
  }

  public long nextId() {
    return store.nextId(store.read(FILE));
  }

  public void save(ModuleRequest request) {
    List<String> rows = store.read(FILE);
    rows.removeIf(row -> row.startsWith(request.getId() + "|"));
    rows.add(
        request.getId()
            + "|"
            + request.getRequestedBy()
            + "|"
            + TextFileStore.clean(request.getCode())
            + "|"
            + TextFileStore.clean(request.getName())
            + "|"
            + TextFileStore.clean(request.getFacultySubject())
            + "|"
            + TextFileStore.clean(request.getReason())
            + "|"
            + request.getStatus()
            + "|"
            + TextFileStore.clean(request.getAdminNote())
            + "|"
            + request.getCreatedAt()
            + "|"
            + request.getResolvedAt()
            + "|"
            + request.getModuleId());
    store.write(FILE, rows);
  }
}

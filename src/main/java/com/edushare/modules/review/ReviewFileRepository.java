package com.edushare.modules.review;

import com.edushare.shared.TextFileStore;
import java.util.*;
import org.springframework.stereotype.Repository;

@Repository
public class ReviewFileRepository {

  private static final String FILE = "reviews.txt";

  private final TextFileStore store;

  public ReviewFileRepository(TextFileStore s) {
    store = s;
    // No example records are created on startup.
  }

  public List<Review> findAll() {
    List<Review> results = new ArrayList<>();
    for (String item : store.read(FILE)) {
      if (!(!item.isBlank())) {
        continue;
      }
      results.add(this.from(item));
    }
    return Collections.unmodifiableList(results);
  }

  public Review save(Review r) {
    synchronized (store) {
      List<Review> a = new ArrayList<>(findAll());
      if (r.getId() == 0) {
        r.setId(
            Math.max(
                store.nextId(store.read(FILE)),
                store.nextId(store.read("review-id-sequence.txt"))));
        store.write("review-id-sequence.txt", List.of(Long.toString(r.getId())));
      }
      {
        java.util.Iterator<Review> iterator = a.iterator();
        while (iterator.hasNext()) {
          Review x = iterator.next();
          if (x.getId() == r.getId()) {
            iterator.remove();
          }
        }
      }
      a.add(r);
      {
        List<String> lines = new ArrayList<>();
        for (Review item : a) {
          lines.add(this.line(item));
        }
        store.write(FILE, lines);
      }
      return r;
    }
  }

  public boolean delete(long id) {
    synchronized (store) {
      List<Review> a = new ArrayList<>(findAll());
      boolean ok = false;
      {
        java.util.Iterator<Review> iterator = a.iterator();
        while (iterator.hasNext()) {
          Review x = iterator.next();
          if (x.getId() == id) {
            iterator.remove();
            ok = true;
          }
        }
      }
      if (ok) {
        long maximum =
            Math.max(
                id,
                Math.max(
                    store.nextId(store.read(FILE)) - 1,
                    store.nextId(store.read("review-id-sequence.txt")) - 1));
        store.write("review-id-sequence.txt", List.of(Long.toString(maximum)));
        {
          List<String> lines = new ArrayList<>();
          for (Review item : a) {
            lines.add(this.line(item));
          }
          store.write(FILE, lines);
        }
      }
      return ok;
    }
  }

  private String line(Review r) {
    return r.getId()
        + "|"
        + r.getReviewType()
        + "|"
        + r.getResourceId()
        + "|"
        + r.getUserId()
        + "|"
        + r.getRating()
        + "|"
        + TextFileStore.clean(r.getComment());
  }

  private Review from(String l) {
    String[] p = l.split("\\|", -1);
    return "VERIFIED".equals(p[1])
        ? new VerifiedReview(
            Long.parseLong(p[0]),
            Long.parseLong(p[2]),
            Long.parseLong(p[3]),
            Integer.parseInt(p[4]),
            p[5])
        : new PublicReview(
            Long.parseLong(p[0]),
            Long.parseLong(p[2]),
            Long.parseLong(p[3]),
            Integer.parseInt(p[4]),
            p[5]);
  }
}

package com.example.edushare.repository;

import com.example.edushare.model.Subscription;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class SubscriptionFileRepository {

    private static final String FILE = "subscriptions.txt";

    public synchronized List<Subscription> findAll() {
        List<Subscription> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                list.add(Subscription.fromFields(FileUtil.split(line)));
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public Subscription findById(String id) {
        return findAll().stream().filter(s -> s.getId().equals(id)).findFirst().orElse(null);
    }

    public synchronized void save(Subscription subscription) {
        List<Subscription> all = findAll();
        boolean replaced = false;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getId().equals(subscription.getId())) {
                all.set(i, subscription);
                replaced = true;
            }
        }
        if (!replaced) {
            all.add(subscription);
        }
        FileUtil.writeLines(FILE, all.stream().map(Subscription::toLine).toList());
    }
}

package com.example.edushare.repository;

import com.example.edushare.model.Admin;
import com.example.edushare.model.Student;
import com.example.edushare.model.User;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
public class UserFileRepository {

    private static final String FILE = "users.txt";

    public synchronized List<User> findAll() {
        List<User> list = new ArrayList<>();
        for (String line : FileUtil.readLines(FILE)) {
            try {
                String[] f = FileUtil.split(line);
                String role = FileUtil.get(f, 1);
                if ("ADMIN".equals(role)) {
                    list.add(new Admin(f[0], f[2], f[3], f[4], FileUtil.get(f, 5)));
                } else {
                    list.add(new Student(f[0], f[2], f[3], f[4], FileUtil.get(f, 5),
                            FileUtil.get(f, 6), FileUtil.get(f, 7)));
                }
            } catch (RuntimeException ignored) {
                // skip malformed line
            }
        }
        return list;
    }

    public User findById(String id) {
        return findAll().stream().filter(u -> u.getId().equals(id)).findFirst().orElse(null);
    }

    public User findByEmail(String email) {
        return findAll().stream().filter(u -> u.getEmail().equalsIgnoreCase(email)).findFirst().orElse(null);
    }

    public synchronized void save(User user) {
        List<User> all = findAll();
        boolean replaced = false;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getId().equals(user.getId())) {
                all.set(i, user);
                replaced = true;
            }
        }
        if (!replaced) {
            all.add(user);
        }
        FileUtil.writeLines(FILE, all.stream().map(User::toLine).toList());
    }

    public synchronized void delete(String id) {
        List<User> all = findAll();
        all.removeIf(u -> u.getId().equals(id));
        FileUtil.writeLines(FILE, all.stream().map(User::toLine).toList());
    }
}

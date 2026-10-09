package com.example.edushare.service;

import com.example.edushare.model.Student;
import com.example.edushare.model.User;
import com.example.edushare.repository.UserFileRepository;
import com.example.edushare.util.FileUtil;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class UserService {

    public static final String SESSION_KEY = "userId";

    private final UserFileRepository repo;

    public UserService(UserFileRepository repo) {
        this.repo = repo;
    }

    public List<User> findAll() {
        return repo.findAll().stream().sorted(Comparator.comparing(User::getJoinedDate).reversed()).toList();
    }

    public User findById(String id) {
        return id == null ? null : repo.findById(id);
    }

    /** The logged-in user of this HTTP session, or null. */
    public User current(HttpSession session) {
        Object id = session.getAttribute(SESSION_KEY);
        return id == null ? null : repo.findById(id.toString());
    }

    public User register(String name, String email, String password) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required.");
        }
        if (email == null || !email.contains("@") || email.length() < 5) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }
        if (password == null || password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }
        if (repo.findByEmail(email.trim()) != null) {
            throw new IllegalArgumentException("That email is already registered.");
        }
        Student s = new Student(FileUtil.newId("u"), name.trim(), email.trim().toLowerCase(),
                hash(password), LocalDate.now().toString(), "FREE", "");
        repo.save(s);
        return s;
    }

    /** Returns the user when the credentials match, otherwise null. */
    public User login(String email, String password) {
        if (email == null || password == null) {
            return null;
        }
        User u = repo.findByEmail(email.trim());
        return u != null && u.getPasswordHash().equals(hash(password)) ? u : null;
    }

    public void updateName(User user, String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name cannot be empty.");
        }
        user.setName(name.trim());
        repo.save(user);
    }

    public void changePassword(User user, String oldPassword, String newPassword) {
        if (!user.getPasswordHash().equals(hash(oldPassword == null ? "" : oldPassword))) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters.");
        }
        user.setPasswordHash(hash(newPassword));
        repo.save(user);
    }

    public void upgrade(String userId, String until) {
        User u = repo.findById(userId);
        if (u instanceof Student s) {
            s.setMembership("PREMIUM");
            s.setPremiumUntil(until);
            repo.save(s);
        }
    }

    public void downgrade(String userId) {
        User u = repo.findById(userId);
        if (u instanceof Student s) {
            s.setMembership("FREE");
            s.setPremiumUntil("");
            repo.save(s);
        }
    }

    public void delete(String id) {
        repo.delete(id);
    }

    public static String hash(String text) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}

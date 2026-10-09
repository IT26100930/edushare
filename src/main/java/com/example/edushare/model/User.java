package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

/** Abstract base class for every account in EduShare (Student, Admin). */
public abstract class User {

    private String id;
    private String name;
    private String email;
    private String passwordHash;
    private String joinedDate;

    protected User() {
    }

    protected User(String id, String name, String email, String passwordHash, String joinedDate) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.joinedDate = joinedDate;
    }

    public abstract String getRole();

    /** Text shown under the user's name, e.g. FREE MEMBER / EDUSHARE PREMIUM / ADMIN. */
    public abstract String getBadge();

    public abstract boolean isPremium();

    public abstract String getMembership();

    public abstract String getPremiumUntil();

    public boolean isAdmin() {
        return "ADMIN".equals(getRole());
    }

    public String toLine() {
        return FileUtil.join(id, getRole(), name, email, passwordHash, joinedDate, getMembership(), getPremiumUntil());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getJoinedDate() { return joinedDate; }
    public void setJoinedDate(String joinedDate) { this.joinedDate = joinedDate; }
}

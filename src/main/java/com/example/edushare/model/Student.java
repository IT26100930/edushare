package com.example.edushare.model;

import java.time.LocalDate;

/** A normal member. Membership is FREE or PREMIUM (premium expires on premiumUntil). */
public class Student extends User {

    private String membership = "FREE";
    private String premiumUntil = "";

    public Student() {
    }

    public Student(String id, String name, String email, String passwordHash, String joinedDate,
                   String membership, String premiumUntil) {
        super(id, name, email, passwordHash, joinedDate);
        this.membership = membership == null || membership.isBlank() ? "FREE" : membership;
        this.premiumUntil = premiumUntil == null ? "" : premiumUntil;
    }

    @Override
    public String getRole() {
        return "STUDENT";
    }

    @Override
    public boolean isPremium() {
        if (!"PREMIUM".equals(membership)) {
            return false;
        }
        if (premiumUntil == null || premiumUntil.isBlank()) {
            return true;
        }
        try {
            return !LocalDate.parse(premiumUntil).isBefore(LocalDate.now());
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String getBadge() {
        return isPremium() ? "EDUSHARE PREMIUM" : "FREE MEMBER";
    }

    @Override
    public String getMembership() { return membership; }

    @Override
    public String getPremiumUntil() { return premiumUntil; }

    public void setMembership(String membership) { this.membership = membership; }
    public void setPremiumUntil(String premiumUntil) { this.premiumUntil = premiumUntil; }
}

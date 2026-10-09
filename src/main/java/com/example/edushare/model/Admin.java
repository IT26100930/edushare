package com.example.edushare.model;

/** Administrator account: manages users, resources and subscriptions. */
public class Admin extends User {

    public Admin() {
    }

    public Admin(String id, String name, String email, String passwordHash, String joinedDate) {
        super(id, name, email, passwordHash, joinedDate);
    }

    @Override
    public String getRole() { return "ADMIN"; }

    @Override
    public String getBadge() { return "ADMIN"; }

    @Override
    public boolean isPremium() { return true; }

    @Override
    public String getMembership() { return ""; }

    @Override
    public String getPremiumUntil() { return ""; }
}

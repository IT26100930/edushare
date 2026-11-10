package com.edushare.modules.user;

public class Admin extends User {

    public Admin() {
        setRole("ADMIN");
    }

    public Admin(long id, String name, String username, String email, String password) {
        super(id, name, username, email, password, "ADMIN", true);
    }

    @Override
    public String getProfileType() {
        return "Administrator";
    }
}

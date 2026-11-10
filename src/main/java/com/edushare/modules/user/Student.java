package com.edushare.modules.user;

public class Student extends User {

    public Student() {
        setRole("STUDENT");
    }

    public Student(
            long id, String name, String username, String email, String password, boolean premium) {
        super(id, name, username, email, password, "STUDENT", premium);
    }

    @Override
    public String getProfileType() {
        return isPremium() ? "Premium Student" : "Student";
    }
}

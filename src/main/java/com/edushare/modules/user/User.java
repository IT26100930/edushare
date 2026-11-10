package com.edushare.modules.user;

public class User {

    protected long id;

    private String name, username, email, password, role, avatar;

    private boolean premium;

    private boolean verified;

    private boolean suspended;

    // Null on partial updates means keep the saved preference.
    private String language;

    private Boolean showEmail;

    private Boolean isPublic;

    private java.util.List<String> interests;

    private java.util.Map<String, Boolean> notifications;

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean value) {
        isPublic = value;
    }

    public boolean publicProfileEnabled() {
        return !Boolean.FALSE.equals(isPublic);
    }

    public java.util.List<String> getInterests() {
        return interests;
    }

    public void setInterests(java.util.List<String> value) {
        interests = value;
    }

    public java.util.Map<String, Boolean> getNotifications() {
        return notifications;
    }

    public void setNotifications(java.util.Map<String, Boolean> value) {
        notifications = value;
    }

    public Boolean getShowEmail() {
        return showEmail;
    }

    public void setShowEmail(Boolean value) {
        showEmail = value;
    }

    public boolean emailVisibleToMembers() {
        return Boolean.TRUE.equals(showEmail);
    }

    private String bio = "",
            university = "",
            degree = "",
            batch = "",
            coverPattern = "",
            githubUrl = "",
            linkedinUrl = "";

    public User() {}

    public User(
            long id,
            String name,
            String username,
            String email,
            String password,
            String role,
            boolean premium) {
        this(id, name, username, email, password, role, premium, "");
    }

    public User(
            long id,
            String name,
            String username,
            String email,
            String password,
            String role,
            boolean premium,
            String avatar) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.premium = premium;
        this.avatar = avatar;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String value) {
        this.language = value;
    }

    public String getProfileType() {
        return role;
    }

    public long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String v) {
        name = v;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String v) {
        username = v;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String v) {
        email = v;
    }

    @com.fasterxml.jackson.annotation.JsonProperty(
            access = com.fasterxml.jackson.annotation.JsonProperty.Access.WRITE_ONLY)
    public String getPassword() {
        return password;
    }

    public void setPassword(String v) {
        password = v;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String v) {
        role = v;
    }

    public boolean isSuspended() {
        return suspended;
    }

    public void setSuspended(boolean v) {
        suspended = v;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean v) {
        verified = v;
    }

    public boolean isPremium() {
        return premium;
    }

    public void setPremium(boolean v) {
        premium = v;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String v) {
        avatar = v;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String v) {
        bio = v;
    }

    public String getUniversity() {
        return university;
    }

    public void setUniversity(String v) {
        university = v;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String v) {
        degree = v;
    }

    public String getBatch() {
        return batch;
    }

    public void setBatch(String v) {
        batch = v;
    }

    public String getCoverPattern() {
        return coverPattern;
    }

    public void setCoverPattern(String v) {
        coverPattern = v;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String v) {
        githubUrl = v;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String v) {
        linkedinUrl = v;
    }
}

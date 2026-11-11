package com.edushare.modules.request;

import com.edushare.modules.user.User;
import com.fasterxml.jackson.annotation.JsonIgnore;

public class ResourceRequest {

    private long id;

    private String title;

    private String message;

    private String status = "OPEN";

    private long requestedById;

    private String moduleCode = "";

    private String resourceType = "Notes";

    private String academicYear = "";

    private String neededBy = "";

    private String createdAt = "";

    private transient User requestedBy;

    // Aggregation: User exists independently of this request.
    public ResourceRequest() {}

    public ResourceRequest(
            long id, String title, String message, String status, long requestedById) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.status = status;
        this.requestedById = requestedById;
    }

    public long getId() {
        return id;
    }

    public void setId(long v) {
        id = v;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String v) {
        title = v;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String v) {
        message = v;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String v) {
        status = v;
    }

    public long getRequestedById() {
        return requestedById;
    }

    public void setRequestedById(long v) {
        requestedById = v;
    }

    // Do not serialize the complete User record (including hashed credentials) to request viewers.
    @JsonIgnore
    public User getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(User v) {
        requestedBy = v;
        if (v != null) {
            requestedById = v.getId();
        }
    }

    public String getModuleCode() {
        return moduleCode;
    }

    public void setModuleCode(String s) {
        moduleCode = s;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String s) {
        resourceType = s;
    }

    public String getAcademicYear() {
        return academicYear;
    }

    public void setAcademicYear(String s) {
        academicYear = s;
    }

    public String getNeededBy() {
        return neededBy;
    }

    public void setNeededBy(String s) {
        neededBy = s;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String s) {
        createdAt = s;
    }
}

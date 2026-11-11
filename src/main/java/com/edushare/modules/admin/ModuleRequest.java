package com.edushare.modules.admin;

/** A student's catalog suggestion, not a resource request or a published module. */
public class ModuleRequest {
  private final long id, requestedBy;
  private final String code, name, facultySubject, reason, createdAt;
  private String status, adminNote, resolvedAt;
  private long moduleId;

  public ModuleRequest(
      long id,
      long requestedBy,
      String code,
      String name,
      String subject,
      String reason,
      String status,
      String note,
      String created,
      String resolved,
      long moduleId) {
    this.id = id;
    this.requestedBy = requestedBy;
    this.code = code;
    this.name = name;
    facultySubject = subject;
    this.reason = reason;
    this.status = status;
    adminNote = note;
    createdAt = created;
    resolvedAt = resolved;
    this.moduleId = moduleId;
  }

  public long getId() {
    return id;
  }

  public long getRequestedBy() {
    return requestedBy;
  }

  public String getCode() {
    return code;
  }

  public String getName() {
    return name;
  }

  public String getFacultySubject() {
    return facultySubject;
  }

  public String getReason() {
    return reason;
  }

  public String getStatus() {
    return status;
  }

  public String getAdminNote() {
    return adminNote;
  }

  public String getCreatedAt() {
    return createdAt;
  }

  public String getResolvedAt() {
    return resolvedAt;
  }

  public long getModuleId() {
    return moduleId;
  }

  public void decide(String status, String note, String time, long moduleId) {
    this.status = status;
    adminNote = note;
    resolvedAt = time;
    this.moduleId = moduleId;
  }
}

package com.example.edushare.model;

import com.example.edushare.util.FileUtil;

public class Subscription {

    private String id;
    private String userId;
    private String userName;
    private String plan;
    private int amount;
    private String startDate;
    private String endDate;
    private String status;

    public Subscription() {
    }

    public static Subscription fromFields(String[] f) {
        Subscription s = new Subscription();
        s.id = FileUtil.get(f, 0);
        s.userId = FileUtil.get(f, 1);
        s.userName = FileUtil.get(f, 2);
        s.plan = FileUtil.get(f, 3);
        s.amount = FileUtil.parseInt(FileUtil.get(f, 4), 0);
        s.startDate = FileUtil.get(f, 5);
        s.endDate = FileUtil.get(f, 6);
        s.status = FileUtil.get(f, 7);
        return s;
    }

    public String toLine() {
        return FileUtil.join(id, userId, userName, plan, amount, startDate, endDate, status);
    }

    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    public String getPlanLabel() {
        return "YEARLY".equals(plan) ? "Yearly" : "Monthly";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}

package com.example.edushare.model;

public class PastPaper extends Resource {

    private String module = "";
    private String year = "";

    @Override public String getType() { return "PAST_PAPER"; }
    @Override public String getTypeLabel() { return "PAST PAPER"; }
    @Override public String getExtraALabel() { return "Module"; }
    @Override public String getExtraBLabel() { return "Year"; }
    @Override public String getExtraA() { return module; }
    @Override public String getExtraB() { return year; }
    @Override public void setExtraA(String value) { this.module = value; }
    @Override public void setExtraB(String value) { this.year = value; }
}

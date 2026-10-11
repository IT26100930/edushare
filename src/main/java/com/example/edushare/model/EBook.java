package com.example.edushare.model;

public class EBook extends Resource {

    private String author = "";
    private String pages = "";

    @Override public String getType() { return "EBOOK"; }
    @Override public String getTypeLabel() { return "E-BOOK"; }
    @Override public String getExtraALabel() { return "Author"; }
    @Override public String getExtraBLabel() { return "Pages"; }
    @Override public String getExtraA() { return author; }
    @Override public String getExtraB() { return pages; }
    @Override public void setExtraA(String value) { this.author = value; }
    @Override public void setExtraB(String value) { this.pages = value; }
}

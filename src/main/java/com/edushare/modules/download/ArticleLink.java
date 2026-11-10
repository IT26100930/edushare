package com.edushare.modules.download;

public class ArticleLink extends Link {

    public ArticleLink() {}

    public ArticleLink(long id, String t, String u) {
        super(id, t, u);
    }

    @Override
    public String getLinkType() {
        return "ARTICLE";
    }
}

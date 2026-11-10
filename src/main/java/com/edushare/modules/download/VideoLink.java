package com.edushare.modules.download;

public class VideoLink extends Link {

    public VideoLink() {}

    public VideoLink(long id, String t, String u) {
        super(id, t, u);
    }

    @Override
    public String getLinkType() {
        return "VIDEO";
    }
}

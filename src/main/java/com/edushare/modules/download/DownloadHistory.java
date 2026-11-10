package com.edushare.modules.download;

import java.util.*;

public class DownloadHistory {

    private final long userId;

    private final List<DownloadRecord> records = new ArrayList<>();

    public DownloadHistory(long userId) {
        this.userId = userId;
    }

    public void addDownload(long resourceId) {
        records.add(new DownloadRecord(resourceId));
    }

    public long getUserId() {
        return userId;
    }

    public List<DownloadRecord> getRecords() {
        return List.copyOf(records);
    }
}

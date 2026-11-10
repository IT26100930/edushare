package com.edushare.modules.download;

import java.time.LocalDateTime;

public class DownloadRecord {

    private final long resourceId;

    private final LocalDateTime downloadedAt;

    public DownloadRecord(long resourceId) {
        this.resourceId = resourceId;
        this.downloadedAt = LocalDateTime.now();
    }

    public long getResourceId() {
        return resourceId;
    }

    public LocalDateTime getDownloadedAt() {
        return downloadedAt;
    }
}

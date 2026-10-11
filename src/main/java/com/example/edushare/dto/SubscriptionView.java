package com.example.edushare.dto;

import com.example.edushare.model.Subscription;

public class SubscriptionView {

    private final Subscription subscription;
    private final long daysLeft;

    public SubscriptionView(Subscription subscription, long daysLeft) {
        this.subscription = subscription;
        this.daysLeft = daysLeft;
    }

    public Subscription getSubscription() { return subscription; }
    public long getDaysLeft() { return daysLeft; }
}

package com.example.edushare.service;

import com.example.edushare.model.Resource;
import com.example.edushare.model.User;
import org.springframework.stereotype.Service;


@Service
public class MembershipService {

    public static final int MONTHLY_PRICE = 499;
    public static final int YEARLY_PRICE = 4999;


    public boolean canAccess(User user, Resource resource) {
        if (!resource.isPremium()) {
            return true;
        }
        if (user == null) {
            return false;
        }
        return user.isPremium() || user.getId().equals(resource.getUploaderId());
    }

    public String badge(User user) {
        return user == null ? "GUEST" : user.getBadge();
    }


    public String watermark(User user) {
        if (user == null) {
            return "EDUSHARE • GUEST";
        }
        String status;
        if (user.isAdmin()) {
            status = "ADMIN";
        } else if (user.isPremium()) {
            status = "PREMIUM MEMBER";
        } else {
            status = "FREE MEMBER";
        }
        return "EDUSHARE • " + user.getName().toUpperCase() + " • " + status;
    }
}

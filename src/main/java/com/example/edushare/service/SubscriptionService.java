package com.example.edushare.service;

import com.example.edushare.dto.SubscriptionView;
import com.example.edushare.model.Subscription;
import com.example.edushare.model.User;
import com.example.edushare.repository.SubscriptionFileRepository;
import com.example.edushare.util.FileUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;

@Service
public class SubscriptionService {

    private final SubscriptionFileRepository repo;
    private final UserService userService;

    public SubscriptionService(SubscriptionFileRepository repo, UserService userService) {
        this.repo = repo;
        this.userService = userService;
    }

    public static int priceFor(String plan) {
        return "YEARLY".equals(plan) ? MembershipService.YEARLY_PRICE : MembershipService.MONTHLY_PRICE;
    }

    public static String normalise(String plan) {
        return "YEARLY".equalsIgnoreCase(plan) ? "YEARLY" : "MONTHLY";
    }


    public Subscription subscribe(User user, String plan) {
        String p = normalise(plan);
        for (Subscription old : repo.findAll()) {
            if (old.getUserId().equals(user.getId()) && old.isActive()) {
                old.setStatus("REPLACED");
                repo.save(old);
            }
        }
        LocalDate start = LocalDate.now();
        LocalDate end = "YEARLY".equals(p) ? start.plusYears(1) : start.plusMonths(1);
        Subscription s = new Subscription();
        s.setId(FileUtil.newId("s"));
        s.setUserId(user.getId());
        s.setUserName(user.getName());
        s.setPlan(p);
        s.setAmount(priceFor(p));
        s.setStartDate(start.toString());
        s.setEndDate(end.toString());
        s.setStatus("ACTIVE");
        repo.save(s);
        userService.upgrade(user.getId(), end.toString());
        return s;
    }

    public Subscription findById(String id) {
        return id == null ? null : repo.findById(id);
    }

    public Subscription findActiveFor(String userId) {
        return historyFor(userId).stream().filter(Subscription::isActive).findFirst().orElse(null);
    }

    public List<Subscription> historyFor(String userId) {
        return repo.findAll().stream()
                .filter(s -> s.getUserId().equals(userId))
                .sorted(Comparator.comparing(Subscription::getStartDate).reversed())
                .toList();
    }

    public void cancel(String userId) {
        for (Subscription s : repo.findAll()) {
            if (s.getUserId().equals(userId) && s.isActive()) {
                s.setStatus("CANCELLED");
                repo.save(s);
            }
        }
        userService.downgrade(userId);
    }

    public List<SubscriptionView> allViews() {
        return repo.findAll().stream()
                .sorted(Comparator.comparing(Subscription::getStartDate).reversed())
                .map(s -> new SubscriptionView(s, daysLeft(s)))
                .toList();
    }

    public long totalRevenue() {
        return repo.findAll().stream()
                .filter(s -> !"CANCELLED".equals(s.getStatus()))
                .mapToLong(Subscription::getAmount).sum();
    }

    private long daysLeft(Subscription s) {
        try {
            return Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), LocalDate.parse(s.getEndDate())));
        } catch (Exception e) {
            return 0;
        }
    }
}

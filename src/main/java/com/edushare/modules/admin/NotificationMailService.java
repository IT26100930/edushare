package com.edushare.modules.admin;

import com.edushare.modules.user.User;
import com.edushare.modules.user.UserService;
import com.edushare.shared.TextFileStore;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

/**
 * Mail delivery is opt-in for announcements. All successful deliveries are idempotent. Each
 * recipient receives an individual message; other addresses are never exposed.
 */
@Service
public class NotificationMailService {

    private final TextFileStore store;

    private final UserService users;

    private final JavaMailSender mail;

    @Value("${edushare.mail.from:}")
    private String from;

    @Value("${edushare.public-url:http://localhost:8080}")
    private String publicUrl;

    public NotificationMailService(TextFileStore store, UserService users, JavaMailSender mail) {
        this.store = store;
        this.users = users;
        this.mail = mail;
    }

    private String encode(String s) {
        return Base64.getEncoder()
                .encodeToString((s == null ? "" : s).getBytes(StandardCharsets.UTF_8));
    }

    private boolean configured() {
        return from != null && !from.isBlank();
    }

    private boolean safeEmail(String address) {
        return address != null
                && address.length() <= 254
                && address.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    }

    private boolean sendTo(String recipient, String subject, String body) {
        if (!configured() || !safeEmail(recipient)) {
            return false;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(from);
            msg.setTo(recipient);
            msg.setSubject(subject);
            msg.setText(body);
            mail.send(msg);
            return true;
        } catch (Exception exception) {
            // SMTP errors must not expose passwords or account tokens.
            System.err.println(
                    "[EduShare] Notification email failed for one recipient: "
                            + exception.getClass().getSimpleName());
            return false;
        }
    }

    private void delivery(String kind, String key, long userId, boolean success) {
        synchronized (store) {
            List<String> lines = store.read("notification-email-deliveries.txt");
            lines.add(
                    String.join(
                            "|",
                            kind,
                            encode(key),
                            String.valueOf(userId),
                            success ? "SENT" : "FAILED",
                            Instant.now().toString()));
            store.write("notification-email-deliveries.txt", lines);
        }
    }

    private boolean alreadySent(String kind, String key, long userId) {
        String token = encode(key);
        return store.read("notification-email-deliveries.txt").stream()
                .anyMatch(
                        row -> {
                            String[] p = row.split("\\|", -1);
                            return p.length >= 4
                                    && kind.equals(p[0])
                                    && token.equals(p[1])
                                    && Long.toString(userId).equals(p[2])
                                    && "SENT".equals(p[3]);
                        });
    }

    /**
     * One email per verified active account, filtered by audience. Called from authenticated admin
     * action only.
     */
    public synchronized Map<String, Integer> broadcast(
            String announcementId, String title, String message, String audience) {
        int sent = 0, failed = 0, skipped = 0;
        for (User user : users.all()) {
            if (user.isSuspended()
                    || !user.isVerified()
                    || !safeEmail(user.getEmail())
                    || ("premium".equals(audience) && !user.isPremium())
                    || "tutors".equals(audience)) {
                skipped++;
                continue;
            }
            if (alreadySent("ANNOUNCEMENT", announcementId, user.getId())) {
                skipped++;
                continue;
            }
            boolean ok =
                    sendTo(
                            user.getEmail(),
                            "EduShare: " + title,
                            "Hello "
                                    + user.getName()
                                    + ",\n\n"
                                    + message
                                    + "\n\nOpen EduShare: "
                                    + publicUrl
                                    + "\n\n-- EduShare Management");
            delivery("ANNOUNCEMENT", announcementId, user.getId(), ok);
            if (ok) {
                sent++;
            } else {
                failed++;
            }
        }
        return Map.of("sent", sent, "failed", failed, "skipped", skipped);
    }

    /**
     * This is a delivery attempt, not a guarantee of inbox delivery. In-app notification is
     * independent.
     */
    public boolean evidenceRequested(
            long reporterId, String reportId, String title, String adminReason, String eventKey) {
        java.util.Optional<com.edushare.modules.user.User> user = users.byId(reporterId);
        if (user.isEmpty() || user.get().isSuspended()) {
            return false;
        }
        if (alreadySent("EVIDENCE", eventKey, reporterId)) {
            return true;
        }
        boolean ok =
                sendTo(
                        user.get().getEmail(),
                        "EduShare: More evidence requested for your report",
                        "Hello "
                                + user.get().getName()
                                + ",\n\n"
                                + "An administrator has requested additional evidence for your"
                                + " report on: "
                                + title
                                + "\n\nAdministrator's note: "
                                + adminReason
                                + "\n\nOpen My Reports: "
                                + publicUrl
                                + "/my-reports?report="
                                + reportId
                                + "\n\nSign in to provide the evidence.\n\n-- EduShare Management");
        delivery("EVIDENCE", eventKey, reporterId, ok);
        return ok;
    }
}

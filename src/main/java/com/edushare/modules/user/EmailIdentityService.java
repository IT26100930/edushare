package com.edushare.modules.user;

import com.edushare.shared.TextFileStore;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.*;

/**
 * Email-based, expiring, one-use tokens. Existing accounts are grandfathered; every newly
 * registered account gets a pending EMAIL_VERIFY record.
 */
@Service
public class EmailIdentityService {

    private static final String FILE = "email-identity-tokens.txt";

    private static final Logger LOG = LoggerFactory.getLogger(EmailIdentityService.class);

    private static final SecureRandom RANDOM = new SecureRandom();

    private final TextFileStore store;

    private final UserFileRepository users;

    private final JavaMailSender mail;

    @Value("${edushare.mail.from:}")
    private String from;

    @Value("${edushare.public-url:http://localhost:8080}")
    private String publicUrl;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public EmailIdentityService(
            TextFileStore store, UserFileRepository users, JavaMailSender mail) {
        this.store = store;
        this.users = users;
        this.mail = mail;
    }

    public boolean configured() {
        return !mailHost.isBlank()
                && !mailUsername.isBlank()
                && !from.isBlank()
                && hasMailPassword();
    }

    private boolean hasMailPassword() {
        if (!(mail instanceof JavaMailSenderImpl)) {
            return false;
        }
        JavaMailSenderImpl sender = (JavaMailSenderImpl) mail;
        return sender.getPassword() != null && !sender.getPassword().isBlank();
    }

    /** Safe diagnostics: never log or return passwords, SMTP transcript or reset tokens. */
    public Map<String, Object> smtpStatus() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("hostSet", !mailHost.isBlank());
        report.put("usernameSet", !mailUsername.isBlank());
        report.put("fromSet", !from.isBlank());
        report.put("passwordSet", hasMailPassword());
        report.put("configured", configured());
        return report;
    }

    private static String smtpErrorCode(Throwable error) {
        for (Throwable t = error; t != null; t = t.getCause()) {
            String type = t.getClass().getSimpleName().toLowerCase(Locale.ROOT);
            String message = Objects.toString(t.getMessage(), "").toLowerCase(Locale.ROOT);
            if (t instanceof MailAuthenticationException
                    || type.contains("authenticationfailed")
                    || message.contains("535 5.7.8")
                    || message.contains("username and password not accepted")) {
                return "AUTH_REJECTED";
            }
            if (type.contains("unknownhost") || message.contains("unknown host")) {
                return "HOST_UNREACHABLE";
            }
            if (type.contains("ssl") || type.contains("tls") || message.contains("starttls")) {
                return "TLS_FAILED";
            }
            if (type.contains("sockettimeout")
                    || type.contains("connectexception")
                    || type.contains("mailconnect")) {
                return "CONNECTION_FAILED";
            }
        }
        return "SMTP_FAILED";
    }

    private static String smtpHint(String code) {
        switch (code) {
            case "AUTH_REJECTED":
                return "Gmail rejected the login: verify the sender address and use a Google App"
                           + " Password, not the normal Gmail password.";
            case "HOST_UNREACHABLE":
                return "SMTP hostname could not be resolved. Check SMTP_HOST and internet access.";
            case "TLS_FAILED":
                return "SMTP TLS negotiation failed. Use Gmail smtp.gmail.com port 587 with"
                           + " STARTTLS.";
            case "CONNECTION_FAILED":
                return "SMTP connection failed or timed out. Check firewall and port 587.";
            default:
                return "SMTP failed. Check IntelliJ Run Configuration SMTP variables, App Password"
                           + " and sender address.";
        }
    }

    public Map<String, Object> diagnoseSmtpConnection() {
        Map<String, Object> report = new LinkedHashMap<>(smtpStatus());
        if (!configured()) {
            report.put("connection", "NOT_CONFIGURED");
            report.put(
                    "hint",
                    "Set SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD and SMTP_FROM in IntelliJ, then"
                        + " restart Spring Boot.");
            return report;
        }
        if (!(mail instanceof JavaMailSenderImpl)) {
            report.put("connection", "SENDER_UNAVAILABLE");
            return report;
        }
        try {
            // Tests authentication/TLS without sending any email.
            JavaMailSenderImpl sender = (JavaMailSenderImpl) mail;
            sender.testConnection();
            report.put("connection", "AUTHENTICATED");
            report.put("hint", "SMTP login works. Try sending a registration email now.");
        } catch (Exception e) {
            String code = smtpErrorCode(e);
            LOG.warn(
                    "EduShare SMTP connection test failed: {} (no credentials or token logged)",
                    code);
            report.put("connection", code);
            report.put("hint", smtpHint(code));
        }
        return report;
    }

    private static String hash(String s) {
        try {
            byte[] bytes =
                    MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static String freshToken() {
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
    }

    private static String escape(String value) {
        return java.net.URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private void email(String target, String subject, String body) {
        if (!configured()) {
            throw new IllegalStateException(
                    "Email delivery is temporarily unavailable. Please contact the administrator.");
        }
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(from);
        msg.setTo(target);
        msg.setSubject(subject);
        msg.setText(body);
        try {
            mail.send(msg);
        } catch (RuntimeException e) {
            String code = smtpErrorCode(e);
            LOG.warn(
                    "EduShare outgoing email failed: {} (no recipient, password or token logged)",
                    code);
            throw e;
        }
    }

    public synchronized void sendVerification(User user) {
        if (!configured()) {
            throw new IllegalStateException("Email delivery is not configured.");
        }
        String token = freshToken();
        String row =
                user.getId()
                        + "|VERIFY|"
                        + hash(token)
                        + "|"
                        + (System.currentTimeMillis() + 24 * 60 * 60 * 1000L)
                        + "|pending";
        List<String> lines = new ArrayList<>(store.read(FILE));
        lines.removeIf(line -> line.startsWith(user.getId() + "|VERIFY|"));
        lines.add(row);
        store.write(FILE, lines);
        String link = publicUrl.replaceAll("/+$", "") + "/verify-email?token=" + escape(token);
        try {
            email(
                    user.getEmail(),
                    "Verify your EduShare email",
                    "Hello "
                            + user.getName()
                            + ",\n\nVerify your email within 24 hours:\n"
                            + link
                            + "\n\nIf you did not register, ignore this message.");
        } catch (RuntimeException ex) {
            lines.remove(row);
            store.write(FILE, lines);
            throw new IllegalStateException(
                    "Could not send the verification email. Please try again later.", ex);
        }
    }

    /** New email stays pending until its owner opens a single-use link. */
    public synchronized void sendEmailChange(long userId, String targetEmail) {
        if (!configured()) {
            throw new IllegalStateException("SMTP is not configured.");
        }
        if (targetEmail == null
                || targetEmail.length() > 254
                || !targetEmail.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Enter a valid email address.");
        }
        String normalized = targetEmail.trim().toLowerCase(Locale.ROOT);
        User account =
                users.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("Account not found."));
        if (normalized.equalsIgnoreCase(account.getEmail())) {
            throw new IllegalArgumentException("That is already your registered email.");
        }
        if (users.findByEmail(normalized).isPresent()) {
            throw new IllegalArgumentException("That email is already registered.");
        }
        String token = freshToken();
        String encoded =
                Base64.getUrlEncoder()
                        .withoutPadding()
                        .encodeToString(normalized.getBytes(StandardCharsets.UTF_8));
        String row =
                userId
                        + "|EMAIL_CHANGE|"
                        + hash(token)
                        + "|"
                        + (System.currentTimeMillis() + 30 * 60 * 1000L)
                        + "|pending|"
                        + encoded;
        List<String> rows = new ArrayList<>(store.read(FILE));
        rows.removeIf(line -> line.startsWith(userId + "|EMAIL_CHANGE|"));
        rows.add(row);
        store.write(FILE, rows);
        String link = publicUrl.replaceAll("/+$", "") + "/verify-email?token=" + escape(token);
        try {
            email(
                    normalized,
                    "Confirm your new EduShare email",
                    "Verify your new email within 30 minutes:\n"
                            + link
                            + "\n\nIf you did not request this change, ignore this message.");
        } catch (RuntimeException ex) {
            rows.remove(row);
            store.write(FILE, rows);
            throw new IllegalStateException("Email delivery failed.", ex);
        }
    }

    public synchronized boolean verifyEmail(String token) {
        if (token == null || token.length() < 30 || token.length() > 150) {
            return false;
        }
        String tokenHash = hash(token);
        List<String> lines = new ArrayList<>(store.read(FILE));
        for (int i = 0; i < lines.size(); i++) {
            String[] parts = lines.get(i).split("\\|", -1);
            if (parts.length < 5
                    || !("VERIFY".equals(parts[1]) || "EMAIL_CHANGE".equals(parts[1]))
                    || !"pending".equals(parts[4])) {
                continue;
            }
            if (!MessageDigest.isEqual(
                    parts[2].getBytes(StandardCharsets.UTF_8),
                    tokenHash.getBytes(StandardCharsets.UTF_8))) {
                continue;
            }
            if (Long.parseLong(parts[3]) < System.currentTimeMillis()) {
                return false;
            }
            if ("EMAIL_CHANGE".equals(parts[1])) {
                if (parts.length != 6) {
                    return false;
                }
                try {
                    long userId = Long.parseLong(parts[0]);
                    String newEmail =
                            new String(
                                    Base64.getUrlDecoder().decode(parts[5]),
                                    StandardCharsets.UTF_8);
                    User account = users.findById(userId).orElse(null);
                    if (account == null || account.isSuspended()) {
                        return false;
                    }
                    if (users.findByEmail(newEmail).filter(u -> u.getId() != userId).isPresent()) {
                        return false;
                    }
                    account.setEmail(newEmail);
                    users.save(account);
                } catch (IllegalArgumentException e) {
                    return false;
                }
            }
            lines.set(
                    i,
                    parts[0]
                            + "|"
                            + parts[1]
                            + "|"
                            + parts[2]
                            + "|"
                            + parts[3]
                            + "|used"
                            + (parts.length == 6 ? "|" + parts[5] : ""));
            store.write(FILE, lines);
            return true;
        }
        return false;
    }

    /**
     * Verify the one-time token and return the sign-in route for the VERIFIED account. Never trust
     * a role or redirect destination submitted by the browser.
     */
    public synchronized String verifyEmailSignInPath(String token) {
        if (token == null || token.length() < 30 || token.length() > 150) {
            return null;
        }
        String tokenHash = hash(token);
        for (String line : store.read(FILE)) {
            String[] parts = line.split("\\|", -1);
            if (parts.length < 5
                    || !("VERIFY".equals(parts[1]) || "EMAIL_CHANGE".equals(parts[1]))
                    || !"pending".equals(parts[4])) {
                continue;
            }
            if (!MessageDigest.isEqual(
                    parts[2].getBytes(StandardCharsets.UTF_8),
                    tokenHash.getBytes(StandardCharsets.UTF_8))) {
                continue;
            }
            final long id;
            try {
                id = Long.parseLong(parts[0]);
            } catch (NumberFormatException ex) {
                return null;
            }
            User account = users.findById(id).orElse(null);
            if (account == null || account.isSuspended()) {
                return null;
            }
            if (!verifyEmail(token)) {
                return null;
            }
            return "ADMIN".equalsIgnoreCase(account.getRole()) ? "/admin/login" : "/login";
        }
        return null;
    }

    public synchronized boolean canLogIn(User user) {
        return store.read(FILE).stream()
                .noneMatch(
                        line -> {
                            String[] p = line.split("\\|", -1);
                            return p.length >= 5
                                    && p[0].equals(Long.toString(user.getId()))
                                    && "VERIFY".equals(p[1])
                                    && "pending".equals(p[4]);
                        });
    }

    /** Always returns a generic result to avoid revealing account existence. */
    public synchronized void sendPasswordReset(String emailAddress) {
        if (!configured()) {
            throw new IllegalStateException("Email delivery is not configured.");
        }
        if (emailAddress == null || emailAddress.length() > 254) {
            return;
        }
        Optional<User> match = users.findByEmail(emailAddress.trim().toLowerCase(Locale.ROOT));
        if (match.isEmpty() || match.get().isSuspended() || !canLogIn(match.get())) {
            return;
        }
        User user = match.get();
        String token = freshToken();
        List<String> lines = new ArrayList<>(store.read(FILE));
        lines.removeIf(line -> line.startsWith(user.getId() + "|RESET|"));
        String row =
                user.getId()
                        + "|RESET|"
                        + hash(token)
                        + "|"
                        + (System.currentTimeMillis() + 30 * 60 * 1000L)
                        + "|pending";
        lines.add(row);
        store.write(FILE, lines);
        String link = publicUrl.replaceAll("/+$", "") + "/email-reset?token=" + escape(token);
        try {
            email(
                    user.getEmail(),
                    "Reset your EduShare password",
                    "Hello "
                            + user.getName()
                            + ",\n\n"
                            + "Reset your password using this one-time link (expires in 30"
                            + " minutes):\n"
                            + link
                            + "\n\nIf you did not request a reset, ignore this email.");
        } catch (RuntimeException ex) {
            lines.remove(row);
            store.write(FILE, lines);
            throw new IllegalStateException(
                    "Email could not be sent. Contact the administrator.", ex);
        }
    }

    public synchronized boolean useResetToken(
            String token, String newPassword, UserService userService) {
        if (token == null
                || token.length() < 30
                || token.length() > 150
                || newPassword == null
                || newPassword.length() < 8
                || newPassword.length() > 128
                || newPassword.chars().noneMatch(Character::isLetter)
                || newPassword.chars().noneMatch(Character::isDigit)) {
            return false;
        }
        String candidate = hash(token);
        List<String> lines = new ArrayList<>(store.read(FILE));
        for (int i = 0; i < lines.size(); i++) {
            String[] row = lines.get(i).split("\\|", -1);
            if (row.length < 5 || !"RESET".equals(row[1]) || !"pending".equals(row[4])) {
                continue;
            }
            if (!MessageDigest.isEqual(
                    candidate.getBytes(StandardCharsets.UTF_8),
                    row[2].getBytes(StandardCharsets.UTF_8))) {
                continue;
            }
            if (Long.parseLong(row[3]) < System.currentTimeMillis()) {
                return false;
            }
            long userId = Long.parseLong(row[0]);
            User user = users.findById(userId).orElse(null);
            if (user == null || user.isSuspended()) {
                return false;
            }
            if ("ADMIN".equalsIgnoreCase(user.getRole())) {
                userService.resetAdministratorPassword(userId, newPassword);
            } else {
                userService.resetStudentPasswordByAdmin(userId, newPassword);
            }
            lines.set(i, row[0] + "|RESET|" + row[2] + "|" + row[3] + "|used");
            store.write(FILE, lines);
            return true;
        }
        return false;
    }
}

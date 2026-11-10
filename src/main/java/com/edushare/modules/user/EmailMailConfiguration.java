package com.edushare.modules.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class EmailMailConfiguration {

    @Bean
    public JavaMailSender eduShareMailSender(
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.port:587}") int port,
            @Value("${spring.mail.username:}") String username,
            @Value("${spring.mail.password:}") String password) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost(host.trim());
        sender.setPort(port);
        sender.setUsername(username.trim());
        sender.setPassword(password.replace(" ", "").trim());
        String envPassword = System.getenv("SMTP_PASSWORD");
        String configuredPassword = sender.getPassword();
        System.out.println(
                "[SMTP CHECK] Environment password present: "
                        + (envPassword != null && !envPassword.isEmpty()));
        System.out.println(
                "[SMTP CHECK] Raw password length: "
                        + (envPassword == null ? 0 : envPassword.length()));
        System.out.println(
                "[SMTP CHECK] Normalized password length: "
                        + (configuredPassword == null ? 0 : configuredPassword.length()));
        System.out.println(
                "[SMTP CHECK] Password contains whitespace: "
                        + (envPassword != null && envPassword.matches("(?s).*\\s.*")));
        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        // Explicit SMTP authentication mechanisms
        props.put("mail.smtp.auth.mechanisms", "LOGIN PLAIN");
        // Gmail STARTTLS
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        // Connection timeouts
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        // Temporary SMTP configuration checks
        System.out.println("[SMTP CHECK] Host: " + sender.getHost());
        System.out.println("[SMTP CHECK] Port: " + sender.getPort());
        System.out.println("[SMTP CHECK] Username: " + sender.getUsername());
        System.out.println(
                "[SMTP CHECK] Password length: "
                        + (sender.getPassword() == null ? 0 : sender.getPassword().length()));
        return sender;
    }
}

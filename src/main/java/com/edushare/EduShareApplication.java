package com.edushare;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class EduShareApplication {

    public static void main(String[] args) {
        SpringApplication.run(EduShareApplication.class, args);
        System.out.println("EduShare started: http://localhost:8080");
    }
}

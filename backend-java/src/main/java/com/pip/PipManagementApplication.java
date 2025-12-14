package com.pip;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PipManagementApplication {
    public static void main(String[] args) {
        SpringApplication.run(PipManagementApplication.class, args);
    }
}


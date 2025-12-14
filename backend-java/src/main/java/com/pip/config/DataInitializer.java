package com.pip.config;

import com.pip.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {
    @Autowired
    private UserService userService;

    @Override
    public void run(String... args) {
        try {
            userService.initializeDefaultUsers();
            System.out.println("Default users initialized successfully");
        } catch (Exception e) {
            System.err.println("Error initializing default users: " + e.getMessage());
        }
    }
}


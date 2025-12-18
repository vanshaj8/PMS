package com.pip.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility class to generate BCrypt password hashes
 * Run this main method to generate hashes for passwords
 */
public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Generate hashes for common passwords
        System.out.println("Password: password123");
        System.out.println("Hash: " + encoder.encode("password123"));
        System.out.println();
        
        System.out.println("Password: admin123");
        System.out.println("Hash: " + encoder.encode("admin123"));
        System.out.println();
        
        System.out.println("Password: manager123");
        System.out.println("Hash: " + encoder.encode("manager123"));
        System.out.println();
    }
}

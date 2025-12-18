package com.pip;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordTest {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // The hash stored in database
        String storedHash = "$2a$10$yYaFkmCHQ.JXXQpxb7ON6.9ZmZWtVik69B/ZgtB9sCESgPIDHzI1u";
        String password = "password123";
        
        boolean matches = encoder.matches(password, storedHash);
        System.out.println("Password: " + password);
        System.out.println("Stored Hash: " + storedHash);
        System.out.println("Matches: " + matches);
        
        if (!matches) {
            System.out.println("\nGenerating new hash for password123:");
            String newHash = encoder.encode(password);
            System.out.println("New Hash: " + newHash);
            System.out.println("New hash matches: " + encoder.matches(password, newHash));
        }
    }
}

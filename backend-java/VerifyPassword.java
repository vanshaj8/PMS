import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class VerifyPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String storedHash = "$2a$10$miYAN4S0CvlvMGRkiK9dpOYF/xHtSwGXdRJ3vBQjQx/2ClWnJtHN.";
        String password = "password123";
        
        boolean matches = encoder.matches(password, storedHash);
        System.out.println("Testing password: " + password);
        System.out.println("Against hash: " + storedHash);
        System.out.println("Result: " + (matches ? "✅ MATCHES" : "❌ DOES NOT MATCH"));
        
        if (!matches) {
            System.out.println("\nGenerating a NEW hash that WILL work:");
            String newHash = encoder.encode(password);
            System.out.println("New Hash: " + newHash);
            System.out.println("Verifying new hash: " + encoder.matches(password, newHash));
        }
    }
}

# Eclipse IDE Setup Guide

This guide will help you import and run the PIP Management Backend project in Eclipse IDE.

## Prerequisites

1. **Eclipse IDE for Enterprise Java and Web Developers** (or Eclipse IDE for Java Developers)
   - Download from: https://www.eclipse.org/downloads/
   - Version: 2023-12 or later recommended

2. **Java Development Kit (JDK) 17**
   - Ensure JDK 17 is installed on your system
   - Eclipse should detect it automatically

3. **Maven Integration**
   - Eclipse comes with Maven support (m2e plugin)
   - If not available, install "Maven Integration for Eclipse" from Eclipse Marketplace

## Importing the Project into Eclipse

### Method 1: Import Existing Maven Project (Recommended)

1. **Open Eclipse IDE**

2. **File → Import**
   - Select: `Maven → Existing Maven Projects`
   - Click **Next**

3. **Select Project Root**
   - Browse to: `/Users/vanshajsharma/PIP/backend-java`
   - Eclipse should detect the `pom.xml` file
   - Click **Next**

4. **Review Maven Projects**
   - Ensure `pip-management-backend` is checked
   - Click **Finish**

5. **Wait for Maven Build**
   - Eclipse will automatically download dependencies
   - This may take a few minutes on first import
   - Check the Progress view for status

### Method 2: Import as General Project

1. **File → Import**
   - Select: `General → Existing Projects into Workspace`
   - Click **Next**

2. **Select Root Directory**
   - Browse to: `/Users/vanshajsharma/PIP/backend-java`
   - Ensure the project is checked
   - Click **Finish**

3. **Convert to Maven Project**
   - Right-click on the project
   - Select: `Configure → Convert to Maven Project`
   - Eclipse will generate Maven configuration

## Configuring the Project

### 1. Set Java Build Path

1. Right-click on the project → **Properties**
2. Navigate to **Java Build Path**
3. Ensure:
   - **Source** tab: `src/main/java` and `src/test/java` are included
   - **Libraries** tab: Maven Dependencies should be listed
   - **JRE** is set to JavaSE-17

### 2. Configure Java Compiler

1. Right-click on the project → **Properties**
2. Navigate to **Java Compiler**
3. Set:
   - **Compiler compliance level**: 17
   - **Generated .class files compatibility**: 17
   - **Source compatibility**: 17

### 3. Enable Annotation Processing (for Lombok)

1. Right-click on the project → **Properties**
2. Navigate to **Java Compiler → Annotation Processing**
3. Check: **Enable annotation processing**
4. Click **Apply and Close**

### 4. Install Lombok Plugin (Required)

Lombok requires a plugin in Eclipse:

1. **Help → Eclipse Marketplace**
2. Search for: `Lombok`
3. Install: **Lombok** by Project Lombok
4. Restart Eclipse when prompted
5. After restart, Eclipse will automatically configure Lombok

## Running the Application

### Method 1: Run as Spring Boot App

1. **Locate the main class**
   - Navigate to: `src/main/java/com/pip/PipManagementApplication.java`

2. **Run the application**
   - Right-click on `PipManagementApplication.java`
   - Select: **Run As → Java Application**
   - Or use the Run button (▶️) in the toolbar

### Method 2: Run as Spring Boot App (with Spring Boot Tools)

If you have Spring Tools installed:

1. Right-click on the project
2. Select: **Run As → Spring Boot App**

### Method 3: Run via Maven

1. Right-click on `pom.xml`
2. Select: **Run As → Maven build...**
3. Enter goal: `spring-boot:run`
4. Click **Run**

## Verifying the Setup

1. **Check Console Output**
   - After running, you should see:
     ```
     Started PipManagementApplication in X.XXX seconds
     ```

2. **Test the Application**
   - Open browser: http://localhost:3001
   - Check health endpoint: http://localhost:3001/health

3. **Check for Errors**
   - View → Problems (to see any compilation errors)
   - Ensure all Maven dependencies are resolved

## Troubleshooting

### Maven Dependencies Not Downloading

1. **Update Maven Project**
   - Right-click project → **Maven → Update Project...**
   - Check: **Force Update of Snapshots/Releases**
   - Click **OK**

2. **Check Maven Settings**
   - Window → Preferences → Maven
   - Ensure "Download repository index updates on startup" is enabled

### Lombok Not Working

1. **Verify Lombok Installation**
   - Help → About Eclipse IDE → Installation Details
   - Check if Lombok plugin is installed

2. **Manual Lombok Installation**
   - Download: https://projectlombok.org/download
   - Run: `java -jar lombok.jar`
   - Select your Eclipse installation directory

### Java Version Issues

1. **Check Installed JREs**
   - Window → Preferences → Java → Installed JREs
   - Ensure JDK 17 is added and set as default

2. **Set Project JRE**
   - Right-click project → Properties → Java Build Path → Libraries
   - Remove old JRE, add JavaSE-17

### Build Errors

1. **Clean and Rebuild**
   - Project → Clean...
   - Select your project
   - Click **Clean**

2. **Refresh Maven Project**
   - Right-click project → Maven → Update Project...

## Project Structure in Eclipse

```
pip-management-backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/pip/
│   │   │       ├── PipManagementApplication.java (Main class)
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── model/
│   │   │       ├── repository/
│   │   │       ├── security/
│   │   │       └── service/
│   │   └── resources/
│   │       └── application.yml
│   └── test/
│       └── java/
├── target/ (generated)
├── pom.xml
└── .project (Eclipse project file)
```

## Additional Eclipse Plugins (Optional)

- **Spring Tools 4**: Enhanced Spring Boot support
  - Help → Eclipse Marketplace → Search "Spring Tools 4"

- **Eclipse Web Developer Tools**: For REST API testing
  - Help → Eclipse Marketplace → Search "Web Developer Tools"

## Next Steps

1. Set up your database (H2 is configured by default)
2. Configure application properties in `application.yml`
3. Start developing your features!

## Support

If you encounter issues:
1. Check the Problems view in Eclipse
2. Review the Console output
3. Verify all prerequisites are installed
4. Try Project → Clean and rebuild

---

**Happy Coding! 🚀**

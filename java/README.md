# Java Backend Utilities

This directory contains Java utilities for the Hospital Management System.

## Overview

The Java utilities provide backend functionality that complements the Next.js frontend application. Currently includes:

### PatientIdValidator

A utility class for validating and formatting hospital patient IDs.

**Features:**
- Validates patient ID format (P + 9 digits, e.g., P123456789)
- Formats numeric IDs into standard patient ID format
- Extracts numeric values from patient IDs
- Comprehensive error handling and validation

**Usage Examples:**

```java
// Validate a patient ID
boolean isValid = PatientIdValidator.isValidPatientId("P123456789"); // true

// Format a numeric ID
String patientId = PatientIdValidator.formatPatientId(42); // "P000000042"

// Extract numeric part
long numericId = PatientIdValidator.extractNumericId("P000000042"); // 42
```

## Building and Testing

### Prerequisites
- Java 8 or higher
- Basic Unix/Linux environment (for build script)

### Build Commands

```bash
# Build and test everything
./java/build.sh

# Manual compilation
javac -d java/build/classes java/src/main/java/com/hospital/utils/*.java
javac -cp java/build/classes -d java/build/test-classes java/src/test/java/com/hospital/utils/*.java

# Run tests manually
java -cp java/build/classes:java/build/test-classes com.hospital.utils.PatientIdValidatorTest
```

## Project Structure

```
java/
├── src/
│   ├── main/java/com/hospital/utils/
│   │   └── PatientIdValidator.java
│   └── test/java/com/hospital/utils/
│       └── PatientIdValidatorTest.java
├── build.sh
└── README.md
```

## Integration with Frontend

The Java utilities can be integrated with the Next.js frontend through:
- REST API endpoints
- Microservices architecture
- Server-side validation
- Batch processing jobs

## Future Extensions

Potential additions to the Java backend utilities:
- Appointment scheduling validation
- Medical record processing
- Insurance claim validation
- Patient data encryption/decryption
- Database connection utilities
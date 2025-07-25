# Java Backend Utilities

Simple Java utility for the Hospital Management System.

## PatientIdValidator

Basic patient ID validation utility.

**Usage:**
```java
// Check if patient ID is valid
boolean isValid = PatientIdValidator.isValid("P123"); // true
boolean isValid = PatientIdValidator.isValid("A123"); // false
```

## Building

```bash
javac java/src/main/java/com/hospital/utils/*.java
java com.hospital.utils.PatientIdValidatorTest
```
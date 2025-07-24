package com.hospital.utils;

/**
 * Utility class for validating hospital patient IDs.
 * 
 * This class provides functionality to validate patient ID formats
 * commonly used in hospital management systems. Patient IDs should
 * follow a specific format to ensure data integrity and consistency.
 * 
 * @author Hospital Management System
 * @version 1.0
 */
public class PatientIdValidator {
    
    /**
     * Validates a patient ID based on hospital standards.
     * 
     * A valid patient ID must:
     * - Be exactly 10 characters long
     * - Start with 'P' (for Patient)
     * - Be followed by exactly 9 digits
     * - Example: P123456789
     * 
     * @param patientId the patient ID string to validate
     * @return true if the patient ID is valid, false otherwise
     * @throws IllegalArgumentException if patientId is null
     */
    public static boolean isValidPatientId(String patientId) {
        // Check for null input
        if (patientId == null) {
            throw new IllegalArgumentException("Patient ID cannot be null");
        }
        
        // Check length - must be exactly 10 characters
        if (patientId.length() != 10) {
            return false;
        }
        
        // Check if first character is 'P'
        if (patientId.charAt(0) != 'P') {
            return false;
        }
        
        // Check if remaining 9 characters are all digits
        String numericPart = patientId.substring(1);
        
        for (int i = 0; i < numericPart.length(); i++) {
            char c = numericPart.charAt(i);
            if (c < '0' || c > '9') {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Generates a formatted patient ID from a numeric ID.
     * 
     * This method takes a numeric patient identifier and formats it
     * according to hospital standards by adding the 'P' prefix and
     * padding with leading zeros if necessary.
     * 
     * @param numericId the numeric patient ID (1-999999999)
     * @return formatted patient ID string (e.g., P000000001)
     * @throws IllegalArgumentException if numericId is out of valid range
     */
    public static String formatPatientId(long numericId) {
        // Validate input range
        if (numericId < 1 || numericId > 999999999) {
            throw new IllegalArgumentException(
                "Numeric ID must be between 1 and 999999999"
            );
        }
        
        // Format with leading zeros to ensure 9 digits
        return String.format("P%09d", numericId);
    }
    
    /**
     * Extracts the numeric part from a valid patient ID.
     * 
     * @param patientId the patient ID to extract from
     * @return the numeric part as a long
     * @throws IllegalArgumentException if patient ID is invalid
     */
    public static long extractNumericId(String patientId) {
        if (!isValidPatientId(patientId)) {
            throw new IllegalArgumentException("Invalid patient ID format");
        }
        
        String numericPart = patientId.substring(1);
        return Long.parseLong(numericPart);
    }
}
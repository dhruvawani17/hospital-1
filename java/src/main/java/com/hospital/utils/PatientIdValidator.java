package com.hospital.utils;

// Simple utility for basic patient ID validation
public class PatientIdValidator {
    
    // Basic validation: starts with 'P' and has digits after
    public static boolean isValid(String id) {
        if (id == null || id.length() < 2) {
            return false;
        }
        return id.startsWith("P") && id.substring(1).matches("\\d+");
    }
}
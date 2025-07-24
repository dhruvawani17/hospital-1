package com.hospital.utils;

// Simple test for PatientIdValidator
public class PatientIdValidatorTest {
    
    public static void main(String[] args) {
        System.out.println("Testing basic patient ID validation...");
        
        // Test valid IDs
        assert PatientIdValidator.isValid("P123") == true : "P123 should be valid";
        assert PatientIdValidator.isValid("P456789") == true : "P456789 should be valid";
        
        // Test invalid IDs
        assert PatientIdValidator.isValid("A123") == false : "A123 should be invalid";
        assert PatientIdValidator.isValid("P") == false : "P should be invalid";
        assert PatientIdValidator.isValid(null) == false : "null should be invalid";
        assert PatientIdValidator.isValid("123") == false : "123 should be invalid";
        
        System.out.println("All tests passed!");
    }
}
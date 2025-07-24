package com.hospital.utils;

/**
 * Simple test class for PatientIdValidator.
 * 
 * This class provides basic testing functionality for the PatientIdValidator
 * utility class without requiring external testing frameworks.
 */
public class PatientIdValidatorTest {
    
    private static int testsPassed = 0;
    private static int testsTotal = 0;
    
    /**
     * Main method to run all tests.
     */
    public static void main(String[] args) {
        System.out.println("Running PatientIdValidator tests...\n");
        
        testValidPatientIds();
        testInvalidPatientIds();
        testNullInput();
        testFormatPatientId();
        testExtractNumericId();
        testFormatPatientIdEdgeCases();
        
        System.out.println("\n" + "=".repeat(50));
        System.out.println("Tests completed: " + testsPassed + "/" + testsTotal);
        
        if (testsPassed == testsTotal) {
            System.out.println("All tests PASSED! ✓");
            System.exit(0);
        } else {
            System.out.println("Some tests FAILED! ✗");
            System.exit(1);
        }
    }
    
    private static void testValidPatientIds() {
        System.out.println("Testing valid patient IDs:");
        
        assertTrue(PatientIdValidator.isValidPatientId("P123456789"), "P123456789");
        assertTrue(PatientIdValidator.isValidPatientId("P000000001"), "P000000001");
        assertTrue(PatientIdValidator.isValidPatientId("P999999999"), "P999999999");
        assertTrue(PatientIdValidator.isValidPatientId("P000000000"), "P000000000");
        
        System.out.println();
    }
    
    private static void testInvalidPatientIds() {
        System.out.println("Testing invalid patient IDs:");
        
        assertFalse(PatientIdValidator.isValidPatientId("P12345678"), "Too short");
        assertFalse(PatientIdValidator.isValidPatientId("P1234567890"), "Too long");
        assertFalse(PatientIdValidator.isValidPatientId("A123456789"), "Wrong prefix");
        assertFalse(PatientIdValidator.isValidPatientId("P12345678A"), "Contains letter");
        assertFalse(PatientIdValidator.isValidPatientId("p123456789"), "Lowercase prefix");
        assertFalse(PatientIdValidator.isValidPatientId(""), "Empty string");
        assertFalse(PatientIdValidator.isValidPatientId("123456789"), "No prefix");
        
        System.out.println();
    }
    
    private static void testNullInput() {
        System.out.println("Testing null input:");
        
        try {
            PatientIdValidator.isValidPatientId(null);
            fail("Should throw IllegalArgumentException for null input");
        } catch (IllegalArgumentException e) {
            pass("Correctly throws exception for null input");
        }
        
        System.out.println();
    }
    
    private static void testFormatPatientId() {
        System.out.println("Testing formatPatientId:");
        
        assertEquals(PatientIdValidator.formatPatientId(1), "P000000001", "Format ID 1");
        assertEquals(PatientIdValidator.formatPatientId(123456789), "P123456789", "Format ID 123456789");
        assertEquals(PatientIdValidator.formatPatientId(42), "P000000042", "Format ID 42");
        
        System.out.println();
    }
    
    private static void testExtractNumericId() {
        System.out.println("Testing extractNumericId:");
        
        assertEquals(PatientIdValidator.extractNumericId("P000000001"), 1L, "Extract from P000000001");
        assertEquals(PatientIdValidator.extractNumericId("P123456789"), 123456789L, "Extract from P123456789");
        assertEquals(PatientIdValidator.extractNumericId("P000000042"), 42L, "Extract from P000000042");
        
        System.out.println();
    }
    
    private static void testFormatPatientIdEdgeCases() {
        System.out.println("Testing formatPatientId edge cases:");
        
        try {
            PatientIdValidator.formatPatientId(0);
            fail("Should throw exception for ID 0");
        } catch (IllegalArgumentException e) {
            pass("Correctly throws exception for ID 0");
        }
        
        try {
            PatientIdValidator.formatPatientId(1000000000L);
            fail("Should throw exception for ID > 999999999");
        } catch (IllegalArgumentException e) {
            pass("Correctly throws exception for ID > 999999999");
        }
        
        System.out.println();
    }
    
    // Helper methods for testing
    private static void assertTrue(boolean condition, String description) {
        testsTotal++;
        if (condition) {
            System.out.println("  ✓ " + description);
            testsPassed++;
        } else {
            System.out.println("  ✗ " + description + " (expected true, got false)");
        }
    }
    
    private static void assertFalse(boolean condition, String description) {
        testsTotal++;
        if (!condition) {
            System.out.println("  ✓ " + description);
            testsPassed++;
        } else {
            System.out.println("  ✗ " + description + " (expected false, got true)");
        }
    }
    
    private static void assertEquals(String actual, String expected, String description) {
        testsTotal++;
        if (expected.equals(actual)) {
            System.out.println("  ✓ " + description);
            testsPassed++;
        } else {
            System.out.println("  ✗ " + description + " (expected '" + expected + "', got '" + actual + "')");
        }
    }
    
    private static void assertEquals(long actual, long expected, String description) {
        testsTotal++;
        if (expected == actual) {
            System.out.println("  ✓ " + description);
            testsPassed++;
        } else {
            System.out.println("  ✗ " + description + " (expected " + expected + ", got " + actual + ")");
        }
    }
    
    private static void pass(String description) {
        testsTotal++;
        testsPassed++;
        System.out.println("  ✓ " + description);
    }
    
    private static void fail(String description) {
        testsTotal++;
        System.out.println("  ✗ " + description);
    }
}
#!/bin/bash

# Simple build script for Java utilities
# This script compiles and tests the Java code in the java/ directory

echo "Building Java utilities for Hospital Management System..."

# Set up directories
JAVA_DIR="java"
SRC_DIR="$JAVA_DIR/src/main/java"
TEST_DIR="$JAVA_DIR/src/test/java"
BUILD_DIR="$JAVA_DIR/build"
CLASSES_DIR="$BUILD_DIR/classes"
TEST_CLASSES_DIR="$BUILD_DIR/test-classes"

# Create build directories
mkdir -p "$CLASSES_DIR"
mkdir -p "$TEST_CLASSES_DIR"

# Compile main classes
echo "Compiling main classes..."
javac -d "$CLASSES_DIR" "$SRC_DIR/com/hospital/utils"/*.java

if [ $? -eq 0 ]; then
    echo "✓ Main classes compiled successfully"
else
    echo "✗ Main classes compilation failed"
    exit 1
fi

# Compile test classes
echo "Compiling test classes..."
javac -cp "$CLASSES_DIR" -d "$TEST_CLASSES_DIR" "$TEST_DIR/com/hospital/utils"/*.java

if [ $? -eq 0 ]; then
    echo "✓ Test classes compiled successfully"
else
    echo "✗ Test classes compilation failed"
    exit 1
fi

# Run tests
echo "Running tests..."
java -cp "$CLASSES_DIR:$TEST_CLASSES_DIR" com.hospital.utils.PatientIdValidatorTest

if [ $? -eq 0 ]; then
    echo "✓ All tests passed"
else
    echo "✗ Some tests failed"
    exit 1
fi

echo "Java build completed successfully!"
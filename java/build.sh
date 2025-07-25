#!/bin/bash

# Simple build script for Java utilities
echo "Building Java utilities..."

mkdir -p java/build/classes java/build/test-classes

# Compile
javac -d java/build/classes java/src/main/java/com/hospital/utils/*.java
javac -cp java/build/classes -d java/build/test-classes java/src/test/java/com/hospital/utils/*.java

# Test
java -enableassertions -cp java/build/classes:java/build/test-classes com.hospital.utils.PatientIdValidatorTest

echo "Done!"
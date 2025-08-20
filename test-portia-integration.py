#!/usr/bin/env python3
"""
Test script for Portia SDK integration with medical reports analysis.
This script tests the basic functionality of Portia for medical text analysis.
"""

import os
import sys
import json
from datetime import datetime

# Set environment variable for OpenAI API key (using hardcoded key from config)
os.environ['OPENAI_API_KEY'] = 'AIzaSyBBS18I7nOqVBvrmalSZzl0oo0YGxqGLlQ'

try:
    import portia
    print("✅ Portia SDK imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Portia SDK: {e}")
    print("Please ensure you have installed portia-sdk-python:")
    print("pip install portia-sdk-python")
    sys.exit(1)

def test_basic_functionality():
    """Test basic Portia functionality"""
    print("\n🧪 Testing basic Portia functionality...")
    
    try:
        # Test with a simple math problem using CLI
        import subprocess
        result = subprocess.run([
            'C:/Users/DHRUV/Documents/GitHub/hospital-1/.venv/Scripts/portia-cli.exe', 
            'run', 
            'add 1 + 2'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(f"✅ Basic test result: {result.stdout.strip()}")
            return True
        else:
            print(f"❌ Basic test failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Basic test failed: {e}")
        return False

def test_medical_analysis():
    """Test medical report analysis formatting"""
    print("\n🏥 Testing medical analysis formatting...")
    
    try:
        # Sample medical report context
        medical_context = """
        Patient: John Doe, Age: 45
        Test Date: 2025-01-15
        
        LABORATORY RESULTS:
        - Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)
        - White Blood Cell Count: 7,200/μL (Normal: 4,500-11,000)
        - Glucose (Fasting): 95 mg/dL (Normal: 70-100)
        - Cholesterol Total: 220 mg/dL (Normal: <200)
        - LDL Cholesterol: 145 mg/dL (Normal: <100)
        - HDL Cholesterol: 38 mg/dL (Normal: >40 for men)
        
        CLINICAL NOTES:
        Patient presents with slightly elevated cholesterol levels.
        Regular monitoring recommended.
        """
        
        # Enhanced medical analysis prompt
        prompt = f"""
        Analyze the following medical report and provide a comprehensive, well-structured analysis:
        
        Medical Report:
        {medical_context}
        
        Please provide analysis in the following structured format:
        
        ## EXECUTIVE SUMMARY
        [Brief overview of key findings]
        
        ## KEY FINDINGS
        [Detailed findings with explanations]
        
        ## MEDICAL TERMINOLOGY EXPLAINED
        [Explanation of complex medical terms found]
        
        ## RECOMMENDATIONS
        [Next steps and recommendations]
        
        ## IMPORTANT NOTES
        [Any warnings, disclaimers, or important considerations]
        
        Format the response with clear headings, bullet points, and structured information.
        """
        
        # Test with CLI
        import subprocess
        result = subprocess.run([
            'C:/Users/DHRUV/Documents/GitHub/hospital-1/.venv/Scripts/portia-cli.exe', 
            'run', 
            prompt
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print("✅ Medical analysis completed successfully")
            print("\n📋 Analysis Result:")
            print("=" * 50)
            print(result.stdout.strip())
            print("=" * 50)
            return True
        else:
            print(f"❌ Medical analysis test failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Medical analysis test failed: {e}")
        return False

def generate_test_report():
    """Generate a test report of the Portia integration"""
    print("\n📊 Generating test report...")
    
    timestamp = datetime.now().isoformat()
    
    report = {
        "timestamp": timestamp,
        "portia_integration_test": {
            "status": "completed",
            "tests": []
        }
    }
    
    # Run tests
    basic_test = test_basic_functionality()
    medical_test = test_medical_analysis()
    
    report["portia_integration_test"]["tests"] = [
        {
            "name": "Basic Functionality Test",
            "status": "passed" if basic_test else "failed",
            "description": "Test basic Portia SDK operations"
        },
        {
            "name": "Medical Analysis Test", 
            "status": "passed" if medical_test else "failed",
            "description": "Test enhanced medical report analysis formatting"
        }
    ]
    
    # Overall status
    all_passed = basic_test and medical_test
    report["portia_integration_test"]["overall_status"] = "passed" if all_passed else "failed"
    
    # Save report
    report_file = "portia_test_report.json"
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"✅ Test report saved to: {report_file}")
    
    if all_passed:
        print("🎉 All tests passed! Portia integration is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the configuration.")
    
    return all_passed

if __name__ == "__main__":
    print("🚀 Starting Portia SDK Integration Test")
    print("=" * 50)
    
    success = generate_test_report()
    
    if success:
        print("\n✅ Portia integration test completed successfully!")
        print("You can now use enhanced medical report analysis in your application.")
    else:
        print("\n❌ Portia integration test failed.")
        print("Please check your environment and API key configuration.")
    
    sys.exit(0 if success else 1)

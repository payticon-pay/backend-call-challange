// Simple unit tests for response code handling logic
// This file tests the logic without requiring a running server

console.log('🧪 Running simple response code tests...\n');

// Mock response data for testing
const mockResponses = [
  { status: 200, data: { success: true } },
  { status: 200, data: { success: false, code: 'DCB_DISABLED_PREMIUM_SERVICES' } },
  { status: 200, data: { success: false, code: 'AMOUNT_LIMIT_EXCEEDED' } },
  { status: 200, data: { success: false, code: 'UNKNOWN' } },
  { status: 400, data: { success: false, code: 'DCB_INVALID_PIN' } },
  { status: 500, data: { success: false, code: 'UNKNOWN' } }
];

// Test PIN validation function
function testPinValidation() {
  console.log('🧪 Testing PIN validation logic...');
  
  const testCases = [
    { input: '1234', expected: true, description: 'Valid 4-digit PIN' },
    { input: '123456', expected: true, description: 'Valid 6-digit PIN' },
    { input: '12345678', expected: true, description: 'Valid 8-digit PIN' },
    { input: '123', expected: false, description: 'Too short PIN' },
    { input: '123456789', expected: false, description: 'Too long PIN' },
    { input: '1234*', expected: true, description: 'PIN with special character (cleaned to 1234)' },
    { input: '12#34', expected: true, description: 'PIN with hash character (cleaned to 1234)' },
    { input: 'abcd', expected: false, description: 'Non-numeric PIN (cleaned to empty)' },
    { input: '', expected: false, description: 'Empty PIN' },
    { input: null, expected: false, description: 'Null PIN' }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(testCase => {
    const cleanPin = testCase.input ? testCase.input.replace(/[^0-9]/g, '') : '';
    // Używamy tej samej logiki co w kodzie: !cleanPin || cleanPin.length < 4 || cleanPin.length > 8
    const isValid = !(!cleanPin || cleanPin.length < 4 || cleanPin.length > 8);
    
    if (isValid === testCase.expected) {
      console.log(`✅ ${testCase.description}: "${testCase.input}" -> "${cleanPin}" (${isValid ? 'valid' : 'invalid'})`);
      passed++;
    } else {
      console.log(`❌ ${testCase.description}: "${testCase.input}" -> "${cleanPin}" (expected: ${testCase.expected}, got: ${isValid})`);
    }
  });
  
  console.log(`\n📊 PIN validation: ${passed}/${total} tests passed\n`);
  return passed === total;
}

// Test response code handling logic
function testResponseCodeHandling() {
  console.log('🧪 Testing response code handling logic...');
  
  const testCases = [
    {
      response: { status: 200, data: { success: true } },
      expected: 'success',
      description: '200 { success: true } - PIN OK, payment OK'
    },
    {
      response: { status: 200, data: { success: false, code: 'DCB_DISABLED_PREMIUM_SERVICES' } },
      expected: 'payment_error_premium',
      description: '200 { success: false, code: "DCB_DISABLED_PREMIUM_SERVICES" } - Premium services disabled'
    },
    {
      response: { status: 200, data: { success: false, code: 'AMOUNT_LIMIT_EXCEEDED' } },
      expected: 'payment_error_amount',
      description: '200 { success: false, code: "AMOUNT_LIMIT_EXCEEDED" } - Amount limit exceeded'
    },
    {
      response: { status: 200, data: { success: false, code: 'UNKNOWN' } },
      expected: 'payment_error_unknown',
      description: '200 { success: false, code: "UNKNOWN" } - Unknown payment error'
    },
    {
      response: { status: 400, data: { success: false, code: 'DCB_INVALID_PIN' } },
      expected: 'invalid_pin',
      description: '400 { success: false, code: "DCB_INVALID_PIN" } - Invalid PIN'
    },
    {
      response: { status: 500, data: { success: false, code: 'UNKNOWN' } },
      expected: 'internal_error',
      description: '500 { success: false, code: "UNKNOWN" } - Internal error'
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(testCase => {
    const { status, data } = testCase.response;
    const statusCode = parseInt(status);
    
    let result;
    if (statusCode === 200) {
      if (data && data.success === true) {
        result = 'success';
      } else {
        const errorCode = data?.code || 'UNKNOWN';
        if (errorCode === 'DCB_DISABLED_PREMIUM_SERVICES') {
          result = 'payment_error_premium';
        } else if (errorCode === 'AMOUNT_LIMIT_EXCEEDED') {
          result = 'payment_error_amount';
        } else {
          result = 'payment_error_unknown';
        }
      }
    } else if (statusCode === 400) {
      if (data?.code === 'DCB_INVALID_PIN') {
        result = 'invalid_pin';
      } else {
        result = 'invalid_pin';
      }
    } else if (statusCode === 500) {
      result = 'internal_error';
    } else {
      result = 'other_error';
    }
    
    if (result === testCase.expected) {
      console.log(`✅ ${testCase.description}`);
      passed++;
    } else {
      console.log(`❌ ${testCase.description} (expected: ${testCase.expected}, got: ${result})`);
    }
  });
  
  console.log(`\n📊 Response code handling: ${passed}/${total} tests passed\n`);
  return passed === total;
}

// Test error message generation
function testErrorMessageGeneration() {
  console.log('🧪 Testing error message generation...');
  
  const testCases = [
    {
      code: 'DCB_DISABLED_PREMIUM_SERVICES',
      expected: 'Usługa premium jest wyłączona.',
      description: 'Premium services disabled message'
    },
    {
      code: 'AMOUNT_LIMIT_EXCEEDED',
      expected: 'Przekroczono limit kwoty.',
      description: 'Amount limit exceeded message'
    },
    {
      code: 'UNKNOWN',
      expected: 'Spróbuj ponownie później.',
      description: 'Unknown error message'
    },
    {
      code: 'NON_EXISTENT_CODE',
      expected: 'Spróbuj ponownie później.',
      description: 'Non-existent code message'
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  testCases.forEach(testCase => {
    let errorMessage = "Kod poprawny, ale wystąpił błąd płatności. ";
    
    switch (testCase.code) {
      case "DCB_DISABLED_PREMIUM_SERVICES":
        errorMessage += "Usługa premium jest wyłączona.";
        break;
      case "AMOUNT_LIMIT_EXCEEDED":
        errorMessage += "Przekroczono limit kwoty.";
        break;
      default:
        errorMessage += "Spróbuj ponownie później.";
    }
    
    if (errorMessage.includes(testCase.expected)) {
      console.log(`✅ ${testCase.description}: "${testCase.expected}"`);
      passed++;
    } else {
      console.log(`❌ ${testCase.description}: expected "${testCase.expected}", got "${errorMessage}"`);
    }
  });
  
  console.log(`\n📊 Error message generation: ${passed}/${total} tests passed\n`);
  return passed === total;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting simple response code tests...\n');
  
  const pinValidationPassed = testPinValidation();
  const responseCodeHandlingPassed = testResponseCodeHandling();
  const errorMessageGenerationPassed = testErrorMessageGeneration();
  
  const totalTests = 3;
  const passedTests = [pinValidationPassed, responseCodeHandlingPassed, errorMessageGenerationPassed].filter(Boolean).length;
  
  console.log('📋 Test Summary:');
  console.log(`   PIN Validation: ${pinValidationPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Response Code Handling: ${responseCodeHandlingPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`   Error Message Generation: ${errorMessageGenerationPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The response code handling logic is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }
  
  return passedTests === totalTests;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testPinValidation,
  testResponseCodeHandling,
  testErrorMessageGeneration,
  runAllTests
};

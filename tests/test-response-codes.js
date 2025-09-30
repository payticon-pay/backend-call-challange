import axios from 'axios';
import { spawn } from 'child_process';

const API_KEY = process.env.API_KEY || 'test-key';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PHONE = '+48123456789';

// Mock server responses for testing
const mockResponses = {
  success: { status: 200, data: { success: true } },
  paymentErrorPremium: { status: 200, data: { success: false, code: 'DCB_DISABLED_PREMIUM_SERVICES' } },
  paymentErrorAmount: { status: 200, data: { success: false, code: 'AMOUNT_LIMIT_EXCEEDED' } },
  paymentErrorUnknown: { status: 200, data: { success: false, code: 'UNKNOWN' } },
  invalidPin: { status: 400, data: { success: false, code: 'DCB_INVALID_PIN' } },
  internalError: { status: 500, data: { success: false, code: 'UNKNOWN' } }
};

let serverProcess;
let sessionId;

// Helper function to start mock server
function startMockServer() {
  return new Promise((resolve) => {
    // Simple mock server that responds based on query parameter
    const mockServer = require('http').createServer((req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const testCase = url.searchParams.get('test');
      
      let response;
      switch (testCase) {
        case 'success':
          response = mockResponses.success;
          break;
        case 'paymentErrorPremium':
          response = mockResponses.paymentErrorPremium;
          break;
        case 'paymentErrorAmount':
          response = mockResponses.paymentErrorAmount;
          break;
        case 'paymentErrorUnknown':
          response = mockResponses.paymentErrorUnknown;
          break;
        case 'invalidPin':
          response = mockResponses.invalidPin;
          break;
        case 'internalError':
          response = mockResponses.internalError;
          break;
        default:
          response = mockResponses.success;
      }
      
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response.data));
    });
    
    mockServer.listen(3001, () => {
      console.log('Mock server started on port 3001');
      resolve(mockServer);
    });
  });
}

// Helper function to create session
async function createSession(testCase) {
  const mockUrl = `http://localhost:3001?test=${testCase}`;
  
  try {
    const response = await axios.post(`${BASE_URL}/session`, {
      phone: PHONE,
      url: mockUrl,
      secret: 'test-secret'
    }, {
      headers: { 'x-api-key': API_KEY }
    });
    
    sessionId = response.data.id;
    console.log(`✅ Session created for test case: ${testCase}`);
    return sessionId;
  } catch (error) {
    console.error(`❌ Failed to create session for test case: ${testCase}`, error.response?.data || error.message);
    throw error;
  }
}

// Helper function to simulate voice call and PIN input
async function simulateVoiceCall(pin) {
  try {
    // Simulate voice call
    const voiceResponse = await axios.post(`${BASE_URL}/voice`, 
      `From=${encodeURIComponent(PHONE)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    if (voiceResponse.status !== 200) {
      throw new Error(`Voice call failed with status: ${voiceResponse.status}`);
    }
    
    console.log('✅ Voice call initiated successfully');
    
    // Simulate PIN input
    const verifyResponse = await axios.post(`${BASE_URL}/verify`,
      `From=${encodeURIComponent(PHONE)}&Digits=${pin}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    
    if (verifyResponse.status !== 200) {
      throw new Error(`PIN verification failed with status: ${verifyResponse.status}`);
    }
    
    console.log('✅ PIN verification completed');
    return verifyResponse.data;
  } catch (error) {
    console.error(`❌ Voice call simulation failed:`, error.response?.data || error.message);
    throw error;
  }
}

// Test cases
async function testSuccessCase() {
  console.log('\n🧪 Testing SUCCESS case (200 { success: true })');
  
  try {
    await createSession('success');
    const response = await simulateVoiceCall('1234');
    
    // Check if response contains success message
    if (response.includes('Kod poprawny. Trwa finalizacja transakcji.')) {
      console.log('✅ Success case passed - correct success message');
    } else {
      console.log('❌ Success case failed - wrong message');
    }
  } catch (error) {
    console.log('❌ Success case failed:', error.message);
  }
}

async function testPaymentErrorPremium() {
  console.log('\n🧪 Testing PAYMENT ERROR PREMIUM case (200 { success: false, code: "DCB_DISABLED_PREMIUM_SERVICES" })');
  
  try {
    await createSession('paymentErrorPremium');
    const response = await simulateVoiceCall('1234');
    
    // Check if response contains premium error message
    if (response.includes('Usługa premium jest wyłączona.')) {
      console.log('✅ Payment error premium case passed - correct error message');
    } else {
      console.log('❌ Payment error premium case failed - wrong message');
    }
  } catch (error) {
    console.log('❌ Payment error premium case failed:', error.message);
  }
}

async function testPaymentErrorAmount() {
  console.log('\n🧪 Testing PAYMENT ERROR AMOUNT case (200 { success: false, code: "AMOUNT_LIMIT_EXCEEDED" })');
  
  try {
    await createSession('paymentErrorAmount');
    const response = await simulateVoiceCall('1234');
    
    // Check if response contains amount limit error message
    if (response.includes('Przekroczono limit kwoty.')) {
      console.log('✅ Payment error amount case passed - correct error message');
    } else {
      console.log('❌ Payment error amount case failed - wrong message');
    }
  } catch (error) {
    console.log('❌ Payment error amount case failed:', error.message);
  }
}

async function testPaymentErrorUnknown() {
  console.log('\n🧪 Testing PAYMENT ERROR UNKNOWN case (200 { success: false, code: "UNKNOWN" })');
  
  try {
    await createSession('paymentErrorUnknown');
    const response = await simulateVoiceCall('1234');
    
    // Check if response contains generic error message
    if (response.includes('Spróbuj ponownie później.')) {
      console.log('✅ Payment error unknown case passed - correct generic message');
    } else {
      console.log('❌ Payment error unknown case failed - wrong message');
    }
  } catch (error) {
    console.log('❌ Payment error unknown case failed:', error.message);
  }
}

async function testInvalidPin() {
  console.log('\n🧪 Testing INVALID PIN case (400 { success: false, code: "DCB_INVALID_PIN" })');
  
  try {
    await createSession('invalidPin');
    const response = await simulateVoiceCall('1234');
    
    // Check if response contains invalid PIN message
    if (response.includes('Kod niepoprawny. Wpisz kod z SMS-a.')) {
      console.log('✅ Invalid PIN case passed - correct error message');
    } else {
      console.log('❌ Invalid PIN case failed - wrong message');
    }
  } catch (error) {
    console.log('❌ Invalid PIN case failed:', error.message);
  }
}

async function testInternalError() {
  console.log('\n🧪 Testing INTERNAL ERROR case (500 { success: false, code: "UNKNOWN" })');
  
  try {
    await createSession('internalError');
    const response = await simulateVoiceCall('1234');
    
    // Check if response contains internal error message
    if (response.includes('Wystąpił błąd wewnętrzny. Spróbuj ponownie później.')) {
      console.log('✅ Internal error case passed - correct error message');
    } else {
      console.log('❌ Internal error case failed - wrong message');
    }
  } catch (error) {
    console.log('❌ Internal error case failed:', error.message);
  }
}

// Test PIN validation with special characters
async function testPinValidation() {
  console.log('\n🧪 Testing PIN validation with special characters');
  
  try {
    await createSession('success');
    
    // Test PIN with special characters
    const response = await simulateVoiceCall('1234*');
    
    // Check if response contains validation error message
    if (response.includes('Kod PIN musi zawierać od 4 do 8 cyfr.')) {
      console.log('✅ PIN validation passed - special characters rejected');
    } else {
      console.log('❌ PIN validation failed - special characters not rejected');
    }
  } catch (error) {
    console.log('❌ PIN validation test failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting response code tests...');
  
  let mockServer;
  try {
    // Start mock server
    mockServer = await startMockServer();
    
    // Wait a bit for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run all tests
    await testSuccessCase();
    await testPaymentErrorPremium();
    await testPaymentErrorAmount();
    await testPaymentErrorUnknown();
    await testInvalidPin();
    await testInternalError();
    await testPinValidation();
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  } finally {
    // Cleanup
    if (mockServer) {
      mockServer.close();
      console.log('🔒 Mock server closed');
    }
    
    // Exit process
    process.exit(0);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  testSuccessCase,
  testPaymentErrorPremium,
  testPaymentErrorAmount,
  testPaymentErrorUnknown,
  testInvalidPin,
  testInternalError,
  testPinValidation,
  runAllTests
};

// Integration test for response code handling
// This test requires a running server and tests actual HTTP responses

import axios from 'axios';

const API_KEY = process.env.API_KEY || 'test-key';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PHONE = '+48123456789';

// Test configuration
const testCases = [
  {
    name: 'SUCCESS_CASE',
    mockResponse: { success: true },
    expectedMessage: 'Kod poprawny. Trwa finalizacja transakcji.',
    description: '200 { success: true } - PIN OK, payment OK'
  },
  {
    name: 'PAYMENT_ERROR_PREMIUM',
    mockResponse: { success: false, code: 'DCB_DISABLED_PREMIUM_SERVICES' },
    expectedMessage: 'Usługa premium jest wyłączona.',
    description: '200 { success: false, code: "DCB_DISABLED_PREMIUM_SERVICES" }'
  },
  {
    name: 'PAYMENT_ERROR_AMOUNT',
    mockResponse: { success: false, code: 'AMOUNT_LIMIT_EXCEEDED' },
    expectedMessage: 'Przekroczono limit kwoty.',
    description: '200 { success: false, code: "AMOUNT_LIMIT_EXCEEDED" }'
  },
  {
    name: 'PAYMENT_ERROR_UNKNOWN',
    mockResponse: { success: false, code: 'UNKNOWN' },
    expectedMessage: 'Spróbuj ponownie później.',
    description: '200 { success: false, code: "UNKNOWN" }'
  },
  {
    name: 'INVALID_PIN',
    mockResponse: { success: false, code: 'DCB_INVALID_PIN' },
    expectedMessage: 'Kod niepoprawny. Wpisz kod z SMS-a.',
    description: '400 { success: false, code: "DCB_INVALID_PIN" }'
  },
  {
    name: 'INTERNAL_ERROR',
    mockResponse: { success: false, code: 'UNKNOWN' },
    expectedMessage: 'Wystąpił błąd wewnętrzny. Spróbuj ponownie później.',
    description: '500 { success: false, code: "UNKNOWN" }'
  }
];

// Mock server that responds with different status codes and data
class MockServer {
  constructor() {
    this.server = null;
    this.port = 3001;
  }

  start() {
    return new Promise((resolve) => {
      const http = require('http');
      
      this.server = http.createServer((req, res) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const testCase = url.searchParams.get('test');
        
        let response;
        let statusCode = 200;
        
        switch (testCase) {
          case 'SUCCESS_CASE':
            response = { success: true };
            statusCode = 200;
            break;
          case 'PAYMENT_ERROR_PREMIUM':
            response = { success: false, code: 'DCB_DISABLED_PREMIUM_SERVICES' };
            statusCode = 200;
            break;
          case 'PAYMENT_ERROR_AMOUNT':
            response = { success: false, code: 'AMOUNT_LIMIT_EXCEEDED' };
            statusCode = 200;
            break;
          case 'PAYMENT_ERROR_UNKNOWN':
            response = { success: false, code: 'UNKNOWN' };
            statusCode = 200;
            break;
          case 'INVALID_PIN':
            response = { success: false, code: 'DCB_INVALID_PIN' };
            statusCode = 400;
            break;
          case 'INTERNAL_ERROR':
            response = { success: false, code: 'UNKNOWN' };
            statusCode = 500;
            break;
          default:
            response = { success: true };
            statusCode = 200;
        }
        
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      });
      
      this.server.listen(this.port, () => {
        console.log(`🔧 Mock server started on port ${this.port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      console.log('🔒 Mock server stopped');
    }
  }
}

// Test runner
class IntegrationTestRunner {
  constructor() {
    this.mockServer = new MockServer();
    this.results = [];
  }

  async setup() {
    console.log('🚀 Setting up integration tests...');
    await this.mockServer.start();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for server to be ready
  }

  async cleanup() {
    this.mockServer.stop();
  }

  async createSession(testCase) {
    const mockUrl = `http://localhost:${this.mockServer.port}?test=${testCase.name}`;
    
    try {
      const response = await axios.post(`${BASE_URL}/session`, {
        phone: PHONE,
        url: mockUrl,
        secret: 'test-secret'
      }, {
        headers: { 'x-api-key': API_KEY }
      });
      
      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to create session: ${error.response?.data || error.message}`);
    }
  }

  async simulateVoiceCall(pin) {
    try {
      // Simulate voice call
      const voiceResponse = await axios.post(`${BASE_URL}/voice`, 
        `From=${encodeURIComponent(PHONE)}`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      if (voiceResponse.status !== 200) {
        throw new Error(`Voice call failed with status: ${voiceResponse.status}`);
      }
      
      // Simulate PIN input
      const verifyResponse = await axios.post(`${BASE_URL}/verify`,
        `From=${encodeURIComponent(PHONE)}&SpeechResult=${pin}&Confidence=0.9`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      if (verifyResponse.status !== 200) {
        throw new Error(`PIN verification failed with status: ${verifyResponse.status}`);
      }
      
      return verifyResponse.data;
    } catch (error) {
      throw new Error(`Voice call simulation failed: ${error.response?.data || error.message}`);
    }
  }

  async runTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.description}`);
    
    try {
      const sessionId = await this.createSession(testCase);
      console.log(`   ✅ Session created: ${sessionId}`);
      
      const response = await this.simulateVoiceCall('1234');
      console.log(`   ✅ Voice call completed`);
      
      // Check if response contains expected message
      if (response.includes(testCase.expectedMessage)) {
        console.log(`   ✅ Test PASSED - Found expected message: "${testCase.expectedMessage}"`);
        this.results.push({ testCase: testCase.name, status: 'PASSED', message: 'Found expected message' });
        return true;
      } else {
        console.log(`   ❌ Test FAILED - Expected: "${testCase.expectedMessage}"`);
        console.log(`   📝 Actual response: ${response.substring(0, 200)}...`);
        this.results.push({ testCase: testCase.name, status: 'FAILED', message: 'Wrong message' });
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Test FAILED - Error: ${error.message}`);
      this.results.push({ testCase: testCase.name, status: 'FAILED', message: error.message });
      return false;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting integration tests...\n');
    
    try {
      await this.setup();
      
      let passed = 0;
      let total = testCases.length;
      
      for (const testCase of testCases) {
        const success = await this.runTest(testCase);
        if (success) passed++;
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      this.printResults(passed, total);
      
    } catch (error) {
      console.error('❌ Integration test suite failed:', error.message);
    } finally {
      await this.cleanup();
    }
  }

  printResults(passed, total) {
    console.log('\n📋 Integration Test Results:');
    console.log('=' .repeat(50));
    
    this.results.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.testCase}: ${result.message}`);
    });
    
    console.log('\n📊 Summary:');
    console.log(`   Total tests: ${total}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${total - passed}`);
    console.log(`   Success rate: ${Math.round((passed / total) * 100)}%`);
    
    if (passed === total) {
      console.log('\n🎉 All integration tests passed!');
    } else {
      console.log('\n⚠️  Some integration tests failed.');
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new IntegrationTestRunner();
  runner.runAllTests();
}

export { IntegrationTestRunner, MockServer };

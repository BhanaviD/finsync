// Test script for FinSync API
// Run with: node test-api.js

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing FinSync API...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Explain in Kannada (Primary)
    console.log('2️⃣ Testing Kannada explanation (Primary)...');
    const kannadaResponse1 = await axios.post(`${API_URL}/api/explain-vernacular`, {
      textQuery: 'What is a credit score?',
      userLanguage: 'kn'
    });
    console.log('✅ Kannada response:', kannadaResponse1.data.analogy);
    console.log('');

    // Test 3: Explain another concept in Kannada
    console.log('3️⃣ Testing Kannada explanation (Compound Interest)...');
    const kannadaResponse2 = await axios.post(`${API_URL}/api/explain-vernacular`, {
      textQuery: 'What is compound interest?',
      userLanguage: 'kn'
    });
    console.log('✅ Kannada response:', kannadaResponse2.data.analogy);
    console.log('');

    // Test 4: Explain in Hindi (for comparison)
    console.log('4️⃣ Testing Hindi explanation (for comparison)...');
    const hindiResponse = await axios.post(`${API_URL}/api/explain-vernacular`, {
      textQuery: 'What is mutual fund?',
      userLanguage: 'hi'
    });
    console.log('✅ Hindi response:', hindiResponse.data.analogy);
    console.log('');

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testAPI();


#!/bin/bash

# Testy curl dla produkcyjnego URL
# https://paycadoo-call-challange.prod.kubeticon.com/

# Konfiguracja
PROD_URL="https://paycadoo-call-challange.prod.kubeticon.com"
API_KEY="dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh"
PHONE="+48663366883"
TEST_CALLBACK="https://krs.requestcatcher.com/test"

# PIN-y do testowania
CORRECT_PIN="1234"
WRONG_PIN="4321"

echo "🧪 Testing production application: $PROD_URL"
echo "=================================================="
echo "📱 Test phone: $PHONE"
echo "✅ Correct PIN: $CORRECT_PIN"
echo "❌ Wrong PIN: $WRONG_PIN"
echo ""

# Test 1: Health check
echo -e "\n1️⃣ Testing health endpoint..."
curl -s -w "HTTP Status: %{http_code}\n" \
  "$PROD_URL/health"

# Test 2: Create session
echo -e "\n2️⃣ Creating session..."
SESSION_RESPONSE=$(curl -s -X POST "$PROD_URL/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"phone\": \"$PHONE\",
    \"url\": \"$TEST_CALLBACK\",
    \"secret\": \"test-secret-prod\"
  }")

echo "Session response: $SESSION_RESPONSE"

# Extract session ID
SESSION_ID=$(echo $SESSION_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Session ID: $SESSION_ID"

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to create session"
  exit 1
fi

# Test 3: Check sessions endpoint
echo -e "\n3️⃣ Checking sessions endpoint..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -H "x-api-key: $API_KEY" \
  "$PROD_URL/sessions"

# Test 4: Test voice endpoint
echo -e "\n4️⃣ Testing voice endpoint..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -X POST "$PROD_URL/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=$(echo $PHONE | sed 's/+/%2B/g')"

# Test 5: Test verify endpoint with CORRECT PIN (1234)
echo -e "\n5️⃣ Testing verify endpoint with CORRECT PIN ($CORRECT_PIN)..."
CORRECT_RESPONSE=$(curl -s -w "HTTP Status: %{http_code}" \
  -X POST "$PROD_URL/verify" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=$(echo $PHONE | sed 's/+/%2B/g')&Digits=$CORRECT_PIN")

echo "Response: $CORRECT_RESPONSE"

# Test 6: Test verify endpoint with WRONG PIN (4321)
echo -e "\n6️⃣ Testing verify endpoint with WRONG PIN ($WRONG_PIN)..."
WRONG_RESPONSE=$(curl -s -w "HTTP Status: %{http_code}" \
  -X POST "$PROD_URL/verify" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=$(echo $PHONE | sed 's/+/%2B/g')&Digits=$WRONG_PIN")

echo "Response: $WRONG_RESPONSE"

# Test 7: Test timeout endpoint
echo -e "\n7️⃣ Testing timeout endpoint..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -X POST "$PROD_URL/timeout" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=$(echo $PHONE | sed 's/+/%2B/g')"

# Test 8: Test with invalid API key
echo -e "\n8️⃣ Testing with invalid API key..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -X POST "$PROD_URL/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d "{
    \"phone\": \"$PHONE\",
    \"url\": \"$TEST_CALLBACK\",
    \"secret\": \"test-secret-prod\"
  }"

# Test 9: Test with missing fields
echo -e "\n9️⃣ Testing with missing fields..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -X POST "$PROD_URL/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"phone\": \"$PHONE\"
  }"

# Test 10: Test with invalid phone format
echo -e "\n🔟 Testing with invalid phone format..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -X POST "$PROD_URL/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"phone\": \"123\",
    \"url\": \"$TEST_CALLBACK\",
    \"secret\": \"test-secret-prod\"
  }"

# Test 11: Test with invalid URL
echo -e "\n1️⃣1️⃣ Testing with invalid URL..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -X POST "$PROD_URL/session" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d "{
    \"phone\": \"$PHONE\",
    \"url\": \"invalid-url\",
    \"secret\": \"test-secret-prod\"
  }"

# Test 12: Final sessions check
echo -e "\n1️⃣2️⃣ Final sessions check..."
curl -s -w "HTTP Status: %{http_code}\n" \
  -H "x-api-key: $API_KEY" \
  "$PROD_URL/sessions"

echo -e "\n🎯 Production testing completed!"
echo "=================================================="
echo "📋 Test summary:"
echo "• Health check"
echo "• Session creation"
echo "• Sessions listing"
echo "• Voice endpoint"
echo "• Verify endpoint with CORRECT PIN ($CORRECT_PIN)"
echo "• Verify endpoint with WRONG PIN ($WRONG_PIN)"
echo "• Timeout endpoint"
echo "• Invalid API key"
echo "• Missing fields validation"
echo "• Invalid phone format validation"
echo "• Invalid URL validation"
echo "• Final sessions check"
echo ""
echo "🔑 PIN Test Results:"
echo "✅ Correct PIN ($CORRECT_PIN): Should return success or retry"
echo "❌ Wrong PIN ($WRONG_PIN): Should return error message"

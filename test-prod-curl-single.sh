#!/bin/bash

# Pojedyncze testy curl dla produkcyjnego URL
# https://paycadoo-call-challange.prod.kubeticon.com/

# Konfiguracja
PROD_URL="https://paycadoo-call-challange.prod.kubeticon.com"
API_KEY="dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh"
PHONE="+48663366883"
TEST_CALLBACK="https://krs.requestcatcher.com/test"

# PIN-y do testowania
CORRECT_PIN="1234"
WRONG_PIN="4321"

echo "🧪 Single curl tests for production: $PROD_URL"
echo "=================================================="
echo "📱 Test phone: $PHONE"
echo "✅ Correct PIN: $CORRECT_PIN"
echo "❌ Wrong PIN: $WRONG_PIN"
echo ""
echo "Copy and paste these commands to test individually:"
echo ""

echo "# 1️⃣ Health check"
echo "curl -v $PROD_URL/health"
echo ""

echo "# 2️⃣ Create session"
echo "curl -v -X POST $PROD_URL/session \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"x-api-key: $API_KEY\" \\"
echo "  -d '{\"phone\": \"$PHONE\", \"url\": \"$TEST_CALLBACK\", \"secret\": \"test-secret-prod\"}'"
echo ""

echo "# 3️⃣ List sessions"
echo "curl -v -H \"x-api-key: $API_KEY\" $PROD_URL/sessions"
echo ""

echo "# 4️⃣ Test voice endpoint"
echo "curl -v -X POST $PROD_URL/voice \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"From=%2B48663366883\""
echo ""

echo "# 5️⃣ Test verify with CORRECT PIN ($CORRECT_PIN) - should succeed"
echo "curl -v -X POST $PROD_URL/verify \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"From=%2B48663366883&SpeechResult=$CORRECT_PIN&Confidence=0.9\""
echo ""

echo "# 6️⃣ Test verify with WRONG PIN ($WRONG_PIN) - should fail"
echo "curl -v -X POST $PROD_URL/verify \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"From=%2B48663366883&SpeechResult=$WRONG_PIN&Confidence=0.9\""
echo ""

echo "# 7️⃣ Test timeout endpoint"
echo "curl -v -X POST $PROD_URL/timeout \\"
echo "  -H \"Content-Type: application/x-www-form-urlencoded\" \\"
echo "  -d \"From=%2B48663366883\""
echo ""

echo "# 8️⃣ Test with invalid API key"
echo "curl -v -X POST $PROD_URL/session \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"x-api-key: invalid-key\" \\"
echo "  -d '{\"phone\": \"$PHONE\", \"url\": \"$TEST_CALLBACK\", \"secret\": \"test-secret-prod\"}'"
echo ""

echo "# 9️⃣ Test with missing fields"
echo "curl -v -X POST $PROD_URL/session \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"x-api-key: $API_KEY\" \\"
echo "  -d '{\"phone\": \"$PHONE\"}'"
echo ""

echo "# 🔟 Test with invalid phone format"
echo "curl -v -X POST $PROD_URL/session \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"x-api-key: $API_KEY\" \\"
echo "  -d '{\"phone\": \"123\", \"url\": \"$TEST_CALLBACK\", \"secret\": \"test-secret-prod\"}'"
echo ""

echo "# 1️⃣1️⃣ Test with invalid URL"
echo "curl -v -X POST $PROD_URL/session \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"x-api-key: $API_KEY\" \\"
echo "  -d '{\"phone\": \"$PHONE\", \"url\": \"invalid-url\", \"secret\": \"test-secret-prod\"}'"
echo ""

echo "=================================================="
echo "🔑 PIN Test Summary:"
echo "✅ Correct PIN ($CORRECT_PIN): Should return success or retry message"
echo "❌ Wrong PIN ($WRONG_PIN): Should return error message and retry prompt"
echo ""
echo "💡 Tips:"
echo "• Use -v flag for verbose output"
echo "• Use -s flag for silent mode (no progress bar)"
echo "• Use -w \"HTTP Status: %{http_code}\" to see status codes"
echo "• Check response headers and body for debugging"
echo "• Monitor logs in k9s while testing"
echo "• Compare responses between correct and wrong PINs"

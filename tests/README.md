# 🧪 Testy - Backend Call Challenge

Ten folder zawiera wszystkie pliki testowe dla aplikacji Backend Call Challenge.

## 📁 Struktura plików testowych

### 🔧 **Testy funkcjonalności:**
- **`test-improved.js`** - Główne testy funkcjonalności aplikacji
- **`test-integration.js`** - Testy integracyjne różnych endpointów
- **`test-local.js`** - Testy lokalne (localhost)
- **`test-variable-pin.js`** - Testy różnych długości PIN-ów
- **`test-timeout.js`** - Testy timeout-ów i limitów czasowych
- **`test-stability.js`** - Testy stabilności i wydajności
- **`test-real-timeout.js`** - Testy rzeczywistych timeout-ów

### 🚨 **Testy błędów i kodów odpowiedzi:**
- **`test-response-codes.js`** - Testy wszystkich kodów błędów
- **`test-response-codes-simple.js`** - Uproszczone testy kodów błędów

### 🐚 **Skrypty bash (produkcja):**
- **`test-prod-curl.sh`** - Testy produkcji z curl (wszystkie scenariusze)
- **`test-prod-curl-single.sh`** - Testy produkcji z curl (pojedyncze)

### 📝 **Pliki pomocnicze:**
- **`test.js`** - Podstawowy plik testowy

## 🚀 **Uruchamianie testów**

### **Testy lokalne:**
```bash
cd tests
node test-local.js
node test-improved.js
node test-integration.js
```

### **Testy produkcji:**
```bash
cd tests
./test-prod-curl.sh
./test-prod-curl-single.sh
```

### **Testy specyficzne:**
```bash
cd tests
node test-timeout.js
node test-variable-pin.js
node test-stability.js
```

## 📋 **Wymagania**

- Node.js 16+
- Dostęp do internetu (dla testów produkcji)
- Poprawnie skonfigurowane zmienne środowiskowe

## 🔧 **Konfiguracja**

Przed uruchomieniem testów upewnij się, że:
1. Serwer jest uruchomiony (`node index.js`)
2. Zmienna `API_KEY` jest ustawiona
3. Masz dostęp do endpointów testowych

## 📊 **Wyniki testów**

Wszystkie testy wyświetlają:
- ✅ **PASSED** - test przeszedł pomyślnie
- ❌ **FAILED** - test nie przeszedł
- 📝 **Szczegółowe logi** - informacje o wykonanych operacjach

## 🆘 **Rozwiązywanie problemów**

Jeśli testy nie przechodzą:
1. Sprawdź czy serwer jest uruchomiony
2. Sprawdź logi serwera
3. Sprawdź konfigurację zmiennych środowiskowych
4. Sprawdź połączenie z internetem (dla testów produkcji)


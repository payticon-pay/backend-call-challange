# Testy dla systemu weryfikacji PIN-a

Ten dokument opisuje różne typy testów dostępne w systemie oraz instrukcje ich uruchamiania.

## 🧪 Typy testów

### 1. Testy jednostkowe (Unit Tests)
**Plik:** `test-response-codes-simple.js`
**Opis:** Testuje logikę obsługi kodów odpowiedzi bez wymagania uruchomionego serwera
**Uruchomienie:**
```bash
node test-response-codes-simple.js
```

**Co testuje:**
- ✅ Walidacja PIN-a (długość, znaki specjalne)
- ✅ Obsługa różnych kodów odpowiedzi HTTP
- ✅ Generowanie komunikatów błędów

### 2. Testy integracyjne (Integration Tests)
**Plik:** `test-integration.js`
**Opis:** Testuje pełną integrację z serwerem HTTP, wymaga uruchomionego serwera
**Uruchomienie:**
```bash
# Najpierw uruchom serwer
node index.js

# W nowym terminalu uruchom testy
node test-integration.js
```

**Co testuje:**
- ✅ End-to-end testy wszystkich scenariuszy
- ✅ Rzeczywiste odpowiedzi HTTP
- ✅ Symulacja połączeń głosowych

### 3. Testy z mock serverem (Mock Server Tests)
**Plik:** `test-response-codes.js`
**Opis:** Pełne testy z własnym serwerem mock, najdokładniejsze
**Uruchomienie:**
```bash
node test-response-codes.js
```

## 🚀 Scenariusze testowe

### Scenariusz 1: Sukces
- **Status:** 200
- **Odpowiedź:** `{ success: true }`
- **Oczekiwany rezultat:** "Kod poprawny. Trwa finalizacja transakcji."
- **Akcja:** Sesja zostaje zweryfikowana i usunięta

### Scenariusz 2: Błąd płatności - Premium wyłączone
- **Status:** 200
- **Odpowiedź:** `{ success: false, code: "DCB_DISABLED_PREMIUM_SERVICES" }`
- **Oczekiwany rezultat:** "Kod poprawny, ale wystąpił błąd płatności. Usługa premium jest wyłączona."
- **Akcja:** Sesja zostaje usunięta

### Scenariusz 3: Błąd płatności - Przekroczony limit
- **Status:** 200
- **Odpowiedź:** `{ success: false, code: "AMOUNT_LIMIT_EXCEEDED" }`
- **Oczekiwany rezultat:** "Kod poprawny, ale wystąpił błąd płatności. Przekroczono limit kwoty."
- **Akcja:** Sesja zostaje usunięta

### Scenariusz 4: Błąd płatności - Nieznany
- **Status:** 200
- **Odpowiedź:** `{ success: false, code: "UNKNOWN" }`
- **Oczekiwany rezultat:** "Kod poprawny, ale wystąpił błąd płatności. Spróbuj ponownie później."
- **Akcja:** Sesja zostaje usunięta

### Scenariusz 5: Błędny PIN
- **Status:** 400
- **Odpowiedź:** `{ success: false, code: "DCB_INVALID_PIN" }`
- **Oczekiwany rezultat:** "Kod niepoprawny. Wpisz kod z SMS-a. W razie błędu zacznij od początku."
- **Akcja:** Użytkownik może spróbować ponownie

### Scenariusz 6: Błąd wewnętrzny
- **Status:** 500
- **Odpowiedź:** `{ success: false, code: "UNKNOWN" }`
- **Oczekiwany rezultat:** "Wystąpił błąd wewnętrzny. Spróbuj ponownie później."
- **Akcja:** Użytkownik może spróbować ponownie

## 🔧 Konfiguracja testów

### Zmienne środowiskowe
```bash
export API_KEY="your-api-key"
export BASE_URL="http://localhost:3000"
```

### Porty
- **Główny serwer:** 3000
- **Mock server:** 3001

## 📊 Uruchamianie wszystkich testów

```bash
# 1. Testy jednostkowe (najszybsze)
node test-response-codes-simple.js

# 2. Testy z mock serverem
node test-response-codes.js

# 3. Testy integracyjne (wymaga uruchomionego serwera)
# Terminal 1: Uruchom serwer
node index.js

# Terminal 2: Uruchom testy
node test-integration.js
```

## 🐛 Rozwiązywanie problemów

### Problem: "Cannot find module 'axios'"
**Rozwiązanie:**
```bash
npm install axios
```

### Problem: "Port already in use"
**Rozwiązanie:** Zmień port w pliku testowym lub zatrzymaj inne procesy

### Problem: "Connection refused"
**Rozwiązanie:** Upewnij się, że główny serwer jest uruchomiony na porcie 3000

## 📝 Dodawanie nowych testów

Aby dodać nowy scenariusz testowy:

1. Dodaj nowy przypadek w `testCases` array
2. Zaktualizuj `MockServer` w `test-integration.js`
3. Dodaj odpowiedni test w `test-response-codes-simple.js`
4. Uruchom testy i sprawdź czy przechodzą

## 🎯 Najlepsze praktyki

- **Zawsze uruchamiaj testy jednostkowe** przed integracyjnymi
- **Sprawdzaj logi** w przypadku błędów
- **Używaj różnych PIN-ów** w testach
- **Testuj edge cases** (puste dane, nieprawidłowe formaty)
- **Utrzymuj testy aktualne** przy zmianach w kodzie

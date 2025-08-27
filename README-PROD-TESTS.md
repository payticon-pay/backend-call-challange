# 🧪 Testy produkcyjnej aplikacji

## 📍 URL produkcyjny
```
https://paycadoo-call-challange.prod.kubeticon.com/
```

## 🔑 Dane testowe
- **API Key**: `dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh`
- **Numer telefonu**: `+48663366883`
- **Callback URL**: `https://krs.requestcatcher.com/test`

## 🔐 PIN-y do testowania
- **✅ Prawidłowy PIN**: `1234` (powinien przejść weryfikację)
- **❌ Nieprawidłowy PIN**: `4321` (powinien zwrócić błąd)

## 🚀 Szybkie testy

### 1️⃣ Health check
```bash
curl -v https://paycadoo-call-challange.prod.kubeticon.com/health
```

### 2️⃣ Utworzenie sesji
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/session \
  -H "Content-Type: application/json" \
  -H "x-api-key: dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh" \
  -d '{"phone": "+48663366883", "url": "https://krs.requestcatcher.com/test", "secret": "test-secret-prod"}'
```

### 3️⃣ Lista sesji
```bash
curl -v -H "x-api-key: dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh" \
  https://paycadoo-call-challange.prod.kubeticon.com/sessions
```

### 4️⃣ Test endpoint voice
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B48663366883"
```

### 5️⃣ Test weryfikacji z PRAWIDŁOWYM PIN-em (1234)
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/verify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B48663366883&SpeechResult=1234&Confidence=0.9"
```

### 6️⃣ Test weryfikacji z NIEPRAWIDŁOWYM PIN-em (4321)
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/verify \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B48663366883&SpeechResult=4321&Confidence=0.9"
```

### 7️⃣ Test endpoint timeout
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/timeout \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B48663366883"
```

## 🔒 Testy walidacji

### 8️⃣ Test z niepoprawnym API key
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/session \
  -H "Content-Type: application/json" \
  -H "x-api-key: invalid-key" \
  -d '{"phone": "+48663366883", "url": "https://krs.requestcatcher.com/test", "secret": "test-secret-prod"}'
```

### 9️⃣ Test z brakującymi polami
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/session \
  -H "Content-Type: application/json" \
  -H "x-api-key: dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh" \
  -d '{"phone": "+48663366883"}'
```

### 🔟 Test z niepoprawnym formatem telefonu
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/session \
  -H "Content-Type: application/json" \
  -H "x-api-key: dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh" \
  -d '{"phone": "123", "url": "https://krs.requestcatcher.com/test", "secret": "test-secret-prod"}'
```

### 1️⃣1️⃣ Test z niepoprawnym URL
```bash
curl -v -X POST https://paycadoo-call-challange.prod.kubeticon.com/session \
  -H "Content-Type: application/json" \
  -H "x-api-key: dasijewij84u32832ue32rd2uh43uhffq4huhgruhdgh" \
  -d '{"phone": "+48663366883", "url": "invalid-url", "secret": "test-secret-prod"}'
```

## 📋 Skrypty testowe

### Automatyczny test wszystkich endpointów
```bash
./test-prod-curl.sh
```

### Wyświetlenie pojedynczych komend
```bash
./test-prod-curl-single.sh
```

## 🔍 Monitorowanie w k9s

### Lokalizacja logów:
1. **Deployment**: `call-chalange`
2. **Label**: `app: call-chalange`
3. **Namespace**: `default` (lub sprawdź w `helm/values.yaml`)

### Ścieżka w k9s:
- **Deployments** → `call-chalange`
- **Pods** → szukaj po label `app: call-chalange`
- **Logi**: naciśnij `l` na podzie

## 💡 Flagi curl

- **`-v`** - verbose (szczegółowe informacje)
- **`-s`** - silent (bez paska postępu)
- **`-w "HTTP Status: %{http_code}"`** - wyświetl status HTTP
- **`-H`** - header
- **`-d`** - data (body request)

## 🎯 Oczekiwane odpowiedzi

- **Health check**: `200 OK`
- **Utworzenie sesji**: `200 OK` z `{"id": "uuid"}`
- **Lista sesji**: `200 OK` z listą sesji
- **Voice endpoint**: `200 OK` z TwiML
- **Verify endpoint z prawidłowym PIN-em (1234)**: `200 OK` z TwiML (sukces lub retry)
- **Verify endpoint z nieprawidłowym PIN-em (4321)**: `200 OK` z TwiML (błąd + retry)
- **Timeout endpoint**: `200 OK` z TwiML
- **Błędy walidacji**: `400 Bad Request`
- **Niepoprawny API key**: `403 Forbidden`
- **Brak sesji**: `404 Not Found`

## 🔑 Test PIN-ów

### Prawidłowy PIN (1234):
- **Oczekiwany rezultat**: Sukces weryfikacji lub komunikat o ponownej próbie
- **Komunikat**: "Kod poprawny. Trwa finalizacja transakcji." lub komunikat o retry

### Nieprawidłowy PIN (4321):
- **Oczekiwany rezultat**: Błąd weryfikacji z możliwością ponownej próby
- **Komunikat**: "Kod niepoprawny. Wpisz kod z SMS-a. W razie błędu zacznij od początku."

## 🚨 Uwagi

- **API Key** jest wymagany dla większości endpointów
- **Numer telefonu** musi zaczynać się od `+` i mieć min. 8 znaków
- **URL callback** musi być poprawnym URL
- **Wszystkie endpointy** zwracają odpowiedzi w języku polskim
- **Timeout** jest ustawiony na 30 sekund dla wprowadzania PIN-u
- **Porównaj odpowiedzi** między prawidłowym a nieprawidłowym PIN-em

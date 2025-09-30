# 🎯 Backend Call Challenge

Backend aplikacja do obsługi połączeń głosowych z weryfikacją PIN-ów przez DTMF.

## 🚀 **Funkcjonalności**

- **🔐 Weryfikacja PIN-ów** przez klawiaturę numeryczną (DTMF)
- **📞 Obsługa połączeń głosowych** przez Twilio Voice API
- **⏱️ Timeout 30 sekund** na wprowadzenie PIN-u
- **🔄 Automatyczne ponowne próby** przy błędnych PIN-ach
- **📊 Zarządzanie sesjami** z automatycznym czyszczeniem
- **💰 Obsługa błędów płatności** (limity, usługi premium)
- **🌍 Komunikaty w języku polskim**

## 🏗️ **Architektura**

```
├── 📁 docs/           # Dokumentacja
├── 📁 tests/          # Pliki testowe
├── 📁 helm/           # Konfiguracja Kubernetes
├── 📁 .github/        # GitHub Actions
├── 🐳 Dockerfile      # Konteneryzacja
├── 📝 index.js        # Główna aplikacja
└── 📦 package.json    # Zależności
```

## 🚀 **Szybki start**

### **1. Instalacja zależności:**
```bash
npm install
```

### **2. Konfiguracja zmiennych środowiskowych:**
```bash
export API_KEY="twój-klucz-api"
```

### **3. Uruchomienie serwera:**
```bash
node index.js
```

Serwer uruchomi się na porcie 3000.

## 📚 **Dokumentacja**

- **[🧪 Testy](./docs/README-TESTS.md)** - Jak uruchamiać i używać testów
- **[🚀 Testy produkcji](./docs/README-PROD-TESTS.md)** - Testy na środowisku produkcyjnym
- **[📊 Logowanie](./docs/LOGGING-IMPROVEMENTS.md)** - Szczegóły systemu logowania

## 🔧 **Endpointy API**

### **Główne endpointy:**
- `POST /session` - Tworzenie nowej sesji
- `POST /voice` - Obsługa połączeń głosowych
- `POST /verify` - Weryfikacja PIN-ów
- `POST /timeout` - Obsługa timeout-ów
- `GET /sessions` - Lista aktywnych sesji
- `GET /health` - Sprawdzenie stanu aplikacji

### **Autoryzacja:**
Wszystkie endpointy wymagają nagłówka `x-api-key` z odpowiednim kluczem.

## 🧪 **Testy**

Wszystkie testy znajdują się w folderze `tests/`:

```bash
cd tests
node test-local.js        # Testy lokalne
node test-improved.js     # Testy funkcjonalności
./test-prod-curl.sh      # Testy produkcji
```

## 🐳 **Docker**

```bash
docker build -t backend-call-challenge .
docker run -p 3000:3000 -e API_KEY=twój-klucz backend-call-challenge
```

## ☸️ **Kubernetes**

Aplikacja jest gotowa do wdrożenia na Kubernetes:

```bash
cd helm
helm install backend-call-challenge .
```

## 📊 **Monitoring**

- **Health check**: `GET /health`
- **Logi**: Szczegółowe logi wszystkich operacji
- **Sesje**: `GET /sessions` - status aktywnych sesji

## 🔒 **Bezpieczeństwo**

- **API Key**: Wymagany dla wszystkich operacji
- **Walidacja PIN**: Dokładnie 4 cyfry
- **Timeout**: Automatyczne zakończenie nieaktywnych sesji
- **Czyszczenie**: Automatyczne usuwanie starych sesji

## 🚨 **Obsługiwane błędy**

- `DCB_INVALID_PIN` - Niepoprawny PIN
- `DCB_DISABLED_PREMIUM_SERVICES` - Usługa premium wyłączona
- `AMOUNT_LIMIT_EXCEEDED` - Przekroczony limit kwoty
- `3114` - Spending limit reached

## 📞 **Przykład użycia**

1. **Utwórz sesję:**
```bash
curl -X POST http://localhost:3000/session \
  -H "x-api-key: twój-klucz" \
  -H "Content-Type: application/json" \
  -d '{"phone": "+48123456789", "url": "https://api.example.com/verify", "secret": "secret123"}'
```

2. **Zadzwoń na endpoint `/voice`** (Twilio)
3. **Wprowadź 4-cyfrowy PIN** przez klawiaturę
4. **Naciśnij #** aby zakończyć

## 🤝 **Współpraca**

1. Fork projektu
2. Utwórz feature branch (`git checkout -b feature/amazing-feature`)
3. Commit zmiany (`git commit -m 'Add amazing feature'`)
4. Push do brancha (`git push origin feature/amazing-feature`)
5. Otwórz Pull Request

## 📄 **Licencja**

Projekt jest objęty licencją MIT.

## 📞 **Kontakt**

- **Autor**: Lukasz Kafel
- **Email**: lukasz.kafel@gmail.com
- **Projekt**: Backend Call Challenge


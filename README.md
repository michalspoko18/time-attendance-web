# time-attendance-web

Panel webowy systemu rejestracji czasu pracy przeznaczony dla managerów. Umożliwia podgląd obecności zespołu, przeglądanie dziennych raportów oraz zarządzanie danymi pracowników.

## Stos technologiczny

- **Svelte 5** + **TypeScript**
- **Vite 8** — bundler i serwer deweloperski
- **Axios** — komunikacja z API

## Widoki

| Ścieżka              | Opis                         |
| -------------------- | ---------------------------- |
| `/login`             | Logowanie                    |
| `/manager`           | Dashboard — przegląd zespołu |
| `/manager/daily`     | Dzienny raport obecności     |
| `/manager/users`     | Lista pracowników            |
| `/manager/users/:id` | Szczegóły pracownika         |

## Uruchomienie

1. Przejdź do katalogu aplikacji:

```bash
cd web
```

2. Skopiuj konfigurację środowiska:

```bash
cp env.example .env
```

3. Ustaw adres backendu w pliku `.env`:

```env
VITE_API_BASE_URL=http://<adres-backendu>:8000
```

4. Zainstaluj zależności:

```bash
npm install
```

5. Uruchom serwer deweloperski:

```bash
npm run dev
```

Aplikacja dostępna pod `http://localhost:5173`.

## Zmienne środowiskowe

| Zmienna             | Opis                                                    |
| ------------------- | ------------------------------------------------------- |
| `VITE_API_BASE_URL` | Bazowy adres URL backendu (np. `http://localhost:8000`) |

## Przydatne komendy

```bash
npm run build    # build produkcyjny
npm run preview  # podgląd buildu produkcyjnego
npm run check    # sprawdzenie typów TypeScript i Svelte
```

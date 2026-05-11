# Конспектум

Платформа для самостоятельного обучения: конспекты с богатым редактором, флэш-карточки с интервальным повторением (SM-2) и тесты с адаптивным режимом заучивания.

---

## Содержание

- [Стек технологий](#стек-технологий)
- [Архитектура](#архитектура)
- [Требования](#требования)
- [Быстрый старт (локальная разработка)](#быстрый-старт-локальная-разработка)
- [Запуск через Docker Compose (production-like)](#запуск-через-docker-compose-production-like)
- [Порты сервисов](#порты-сервисов)
- [Структура проекта](#структура-проекта)

---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | Next.js 14, TypeScript, MUI, TipTap, TanStack Query |
| Backend | .NET 9, ASP.NET Core, Entity Framework Core |
| API Gateway | YARP (Yet Another Reverse Proxy) |
| База данных | PostgreSQL 16 |
| Кэш | Redis 7 |
| Поиск | Elasticsearch 8 |
| Брокер сообщений | Apache Kafka |
| Почта (dev) | MailHog |

---

## Архитектура

```
Browser
   │
   ▼
┌─────────────────────┐
│   Next.js Frontend  │  :3000
└──────────┬──────────┘
           │ HTTP
           ▼
┌─────────────────────┐
│   YARP API Gateway  │  :5234 (dev) / :5000 (docker)
└──┬──────┬──────┬────┘
   │      │      │
   ▼      ▼      ▼
Auth  Content  Cards   Notification
:5151  :5181   :5066      :5065
   │      │      │          │
   └──────┴──────┴──────────┘
              │
    ┌─────────┼──────────┐
    ▼         ▼          ▼
PostgreSQL  Redis  Elasticsearch
             │
           Kafka
```

---

## Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — для запуска инфраструктуры
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/) и npm

Проверить установку:
```bash
docker --version        # Docker version 24+
dotnet --version        # 9.0.x
node --version          # v20+
```

---

## Быстрый старт (локальная разработка)

### Шаг 1 — Поднять инфраструктуру (PostgreSQL, Redis, Kafka, Elasticsearch, MailHog)

```bash
cd diploma-platform
docker-compose up -d postgres redis zookeeper kafka elasticsearch mailhog
```

Дождаться, пока все контейнеры перейдут в состояние `healthy` (~30–60 секунд):
```bash
docker-compose ps
```

### Шаг 2 — Применить миграции базы данных

Открыть **три отдельных терминала** и выполнить в каждом:

**Терминал A — AuthService:**
```bash
cd diploma-platform/backend/Services/AuthService
dotnet ef database update
```

**Терминал B — ContentService:**
```bash
cd diploma-platform/backend/Services/ContentService
dotnet ef database update
```

**Терминал C — CardsService:**
```bash
cd diploma-platform/backend/Services/CardsService
dotnet ef database update
```

> Базы данных `auth_db`, `content_db`, `cards_db` создаются автоматически скриптом `infra/postgres/init.sql` при первом запуске Docker.

### Шаг 3 — Запустить бэкенд-сервисы

Каждый сервис запускается в **отдельном терминале**.

**Терминал 1 — AuthService** (`http://localhost:5151`):
```bash
cd diploma-platform/backend/Services/AuthService
dotnet run
```

**Терминал 2 — ContentService** (`http://localhost:5181`):
```bash
cd diploma-platform/backend/Services/ContentService
dotnet run
```

**Терминал 3 — CardsService** (`http://localhost:5066`):
```bash
cd diploma-platform/backend/Services/CardsService
dotnet run
```

**Терминал 4 — NotificationService** (`http://localhost:5065`):
```bash
cd diploma-platform/backend/Services/NotificationService
dotnet run
```

**Терминал 5 — API Gateway / YARP** (`http://localhost:5234`):
```bash
cd diploma-platform/backend/Gateway/ApiGateway
dotnet run
```

### Шаг 4 — Запустить фронтенд

**Терминал 6 — Frontend** (`http://localhost:3000`):
```bash
cd diploma-platform/frontend
npm install
npm run dev
```

### Готово

Открыть в браузере: **http://localhost:3000**

---

## Запуск через Docker Compose (production-like)

Поднимает всё — инфраструктуру и все сервисы — одной командой.

### 1. Проверить `.env` файл

В корне проекта уже есть `.env` со значениями по умолчанию для локального запуска. При необходимости отредактировать:

```bash
# diploma-platform/.env

POSTGRES_USER=diploma
POSTGRES_PASSWORD=diploma_secret
POSTGRES_AUTH_DB=auth_db
POSTGRES_CONTENT_DB=content_db
POSTGRES_CARDS_DB=cards_db
POSTGRES_NOTIFICATIONS_DB=notifications_db

REDIS_PASSWORD=redis_secret

JWT_SECRET=super_secret_jwt_signing_key_min_32_chars!!
JWT_ISSUER=DiplomaProject
JWT_AUDIENCE=DiplomaProjectUsers
JWT_ACCESS_EXPIRE_MINUTES=15
JWT_REFRESH_EXPIRE_DAYS=7

KAFKA_BROKER=kafka:9092
ELASTICSEARCH_URL=http://elasticsearch:9200

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your@gmail.com
SMTP_DISPLAY_NAME=Конспектум
```

### 2. Собрать и запустить

```bash
cd diploma-platform
docker-compose up --build
```

Фронтенд при запуске через Docker нужно запустить отдельно (он не включён в compose):
```bash
cd frontend
npm install
npm run dev
```

> В этом режиме фронтенд подключается к gateway на `http://localhost:5000` — при необходимости поменять `baseURL` в `frontend/lib/api.ts`.

### 3. Остановить

```bash
docker-compose down          # остановить контейнеры
docker-compose down -v       # остановить + удалить volumes (сбросить БД)
```

---

## Порты сервисов

### Локальная разработка (dotnet run)

| Сервис | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| API Gateway (YARP) | http://localhost:5234 |
| AuthService | http://localhost:5151 |
| ContentService | http://localhost:5181 |
| CardsService | http://localhost:5066 |
| NotificationService | http://localhost:5065 |

### Инфраструктура (Docker)

| Сервис | Порт | Описание |
|--------|------|----------|
| PostgreSQL | 5432 | Основная БД |
| Redis | 6379 | Кэш и refresh-токены |
| Kafka | 29092 | Брокер сообщений (внешний) |
| Elasticsearch | 9200 | Полнотекстовый поиск |
| MailHog (SMTP) | 1025 | Dev-перехватчик писем |
| MailHog (Web UI) | 8025 | Просмотр отправленных писем |

### Docker Compose (все сервисы в контейнерах)

| Сервис | Внешний порт |
|--------|-------------|
| API Gateway | 5000 |
| AuthService | 5001 |
| ContentService | 5002 |
| CardsService | 5003 |
| NotificationService | 5004 |

---

## Структура проекта

```
diploma-platform/
├── frontend/                        # Next.js 14 приложение
│   ├── app/
│   │   ├── (auth)/                  # Страницы входа и регистрации
│   │   └── dashboard/               # Основные страницы приложения
│   │       ├── page.tsx             # Главная (советы дня)
│   │       ├── notes/               # Конспекты
│   │       ├── flashcards/          # Флэш-карточки и режим заучивания
│   │       ├── quizzes/             # Тесты
│   │       └── settings/            # Настройки профиля
│   ├── components/                  # Переиспользуемые компоненты
│   │   ├── TiptapEditor.tsx         # Редактор конспектов
│   │   ├── ResizableImage.tsx       # Компонент изображений в редакторе
│   │   ├── MathNodeView.tsx         # Рендер LaTeX-формул
│   │   └── Sidebar.tsx              # Навигационная панель
│   └── lib/                         # API-клиенты
│       ├── api.ts                   # Axios + interceptors
│       ├── auth.ts                  # Аутентификация
│       ├── notes.ts                 # Конспекты
│       ├── flashcards.ts            # Карточки
│       └── quizzes.ts               # Тесты
│
├── backend/
│   ├── Gateway/
│   │   └── ApiGateway/              # YARP API Gateway (:5234)
│   └── Services/
│       ├── AuthService/             # Авторизация, JWT, пользователи (:5151)
│       ├── ContentService/          # Конспекты, тесты, папки (:5181)
│       ├── CardsService/            # Колоды и карточки, SM-2 (:5066)
│       └── NotificationService/     # Email-уведомления (:5065)
│
├── infra/
│   └── postgres/
│       └── init.sql                 # Создание баз данных
│
├── docker-compose.yml               # Вся инфраструктура + сервисы
└── .env                             # Переменные окружения
```

---

## Полезные команды

### Просмотр логов конкретного контейнера
```bash
docker-compose logs -f postgres
docker-compose logs -f elasticsearch
docker-compose logs -f kafka
```

### Проверка состояния контейнеров
```bash
docker-compose ps
```

### Подключение к PostgreSQL
```bash
docker exec -it diploma-platform-postgres-1 psql -U diploma -d auth_db
```

### Просмотр перехваченных писем (MailHog)
Открыть в браузере: **http://localhost:8025**

### Сброс базы данных и повторное применение миграций
```bash
# Остановить сервисы, пересоздать volume
docker-compose down -v
docker-compose up -d postgres redis zookeeper kafka elasticsearch mailhog

# Заново применить миграции
cd backend/Services/AuthService && dotnet ef database update
cd ../ContentService && dotnet ef database update
cd ../CardsService && dotnet ef database update
```

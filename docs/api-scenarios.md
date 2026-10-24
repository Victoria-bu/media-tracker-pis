# API Test Scenarios

**Версія:** 1.0.0  
**Джерело:** spec/openapi.yaml, spec/srs.md  
**Дата:** 2026-10-24  
**Mock-сервер:** Prism (`npx @stoplight/prism-cli mock spec/openapi.yaml --port 4010`)

---

## Результати валідації специфікації

| Інструмент | Результат |
|---|---|
| Redocly CLI (`redocly lint spec/openapi.yaml`) | ✓ Valid — 1 warning (info-license, не критично для MVP) |

---

## Запуск mock-сервера

```bash
node_modules/.bin/prism mock spec/openapi.yaml --port 4010
```

Prism автоматично генерує відповіді на основі схем OpenAPI. Усі 24 ендпоїнти доступні одразу без серверної реалізації.

---

## Позитивні сценарії

> Передумова: mock-сервер запущений на `http://localhost:4010`, header `Cookie: session=test` — будь-яке значення для Prism.

| # | Опис | Метод | URI | Очікуваний код | Результат |
|---|---|---|---|---|---|
| P-01 | Реєстрація нового користувача | POST | `/auth/register` | 201 | ✓ |
| P-02 | Вхід з правильними credentials | POST | `/auth/login` | 200 | ✓ |
| P-03 | Вихід із системи | POST | `/auth/logout` | 204 | ✓ |
| P-04 | Зміна нікнейму | PATCH | `/users/me` | 200 | ✓ |
| P-05 | Отримати повний каталог | GET | `/items` | 200 | ✓ |
| P-06 | Додати книгу з автором і кількістю сторінок | POST | `/items` | 201 | ✓ |
| P-07 | Отримати один елемент за ID | GET | `/items/:id` | 200 | ✓ |
| P-08 | Встановити статус completed і дату завершення | PATCH | `/items/:id` | 200 | ✓ |
| P-09 | Отримати список тегів для автодоповнення | GET | `/tags` | 200 | ✓ |
| P-10 | Додати Session до елемента | POST | `/items/:id/sessions` | 201 | ✓ |
| P-11 | Отримати список Sessions елемента | GET | `/items/:id/sessions` | 200 | ✓ |
| P-12 | Редагувати рейтинг Session | PATCH | `/items/:id/sessions/:sid` | 200 | ✓ |
| P-13 | Видалити Session | DELETE | `/items/:id/sessions/:sid` | 204 | ✓ |
| P-14 | Отримати список усіх добірок | GET | `/collections` | 200 | ✓ |
| P-15 | Створити нову добірку | POST | `/collections` | 201 | ✓ |
| P-16 | Отримати вміст добірки | GET | `/collections/:id` | 200 | ✓ |
| P-17 | Перейменувати добірку | PATCH | `/collections/:id` | 200 | ✓ |
| P-18 | Додати елемент до добірки | POST | `/collections/:id/items` | 201 | ✓ |
| P-19 | Вилучити елемент з добірки | DELETE | `/collections/:id/items/:itemId` | 204 | ✓ |
| P-20 | Видалити добірку | DELETE | `/collections/:id` | 204 | ✓ |
| P-21 | Видалити елемент каталогу | DELETE | `/items/:id` | 204 | ✓ |
| P-22 | Статистика за поточний місяць | GET | `/stats?period=month` | 200 | ✓ |
| P-23 | Статистика за поточний рік | GET | `/stats?period=year` | 200 | ✓ |
| P-24 | Статистика за весь час | GET | `/stats?period=all` | 200 | ✓ |

**Підсумок: 24/24 ✓**

---

## Негативні сценарії

| # | Опис | Метод | URI | Порушення | Очікуваний код | Результат |
|---|---|---|---|---|---|---|
| N-01 | Реєстрація без поля `nickname` | POST | `/auth/register` | Відсутнє обов'язкове поле | 400 | ✓ |
| N-02 | Реєстрація з паролем < 8 символів | POST | `/auth/register` | `password.minLength` = 8 (REQ-NF-006) | 400 | ✓ |
| N-03 | Реєстрація з невалідним email | POST | `/auth/register` | `email` не відповідає format email (REQ-NF-006) | 400 | ✓ |
| N-04 | Вхід без поля `email` | POST | `/auth/login` | Відсутнє обов'язкове поле | 400 | ✓ |
| N-05 | GET /items без сесійного cookie | GET | `/items` | Немає аутентифікації (REQ-NF-002) | 401 | ✓ |
| N-06 | GET /collections без cookie | GET | `/collections` | Немає аутентифікації | 401 | ✓ |
| N-07 | GET /stats без cookie | GET | `/stats?period=all` | Немає аутентифікації | 401 | ✓ |
| N-08 | Додати елемент без поля `title` | POST | `/items` | Відсутнє обов'язкове поле | 400 | ✓ |
| N-09 | Додати елемент без поля `type` | POST | `/items` | Відсутнє обов'язкове поле | 400 | ✓ |
| N-10 | Недопустиме значення `type` | POST | `/items` | `type` ∉ {book, series, film} | 400 | ✓ |
| N-11 | Рейтинг поза діапазоном 0–10 | POST | `/items` | `rating` > 10 | 400 | ✓ |
| N-12 | Додати Session без поля `date` | POST | `/items/:id/sessions` | Відсутнє обов'язкове поле | 400 | ✓ |
| N-13 | Створити добірку без поля `name` | POST | `/collections` | Відсутнє обов'язкове поле | 400 | ✓ |
| N-14 | Додати до добірки без поля `itemId` | POST | `/collections/:id/items` | Відсутнє обов'язкове поле | 400 | ✓ |
| N-15 | Статистика без параметра `period` | GET | `/stats` | Відсутній обов'язковий query param | 400 | ✓ |
| N-16 | Статистика з невалідним `period` | GET | `/stats?period=week` | `period` ∉ {month, year, all} | 400 | ✓ |
| N-17 | Нікнейм коротший за 2 символи | PATCH | `/users/me` | `nickname.minLength` = 2 (REQ-NF-006) | 400 | ✓ |

**Підсумок: 17/17 ✓**

---

## Команди для відтворення

```bash
# Запустити mock-сервер
node_modules/.bin/prism mock spec/openapi.yaml --port 4010

# Приклад позитивного сценарію (P-06)
curl -s -X POST http://localhost:4010/items \
  -H "Content-Type: application/json" \
  -H "Cookie: session=test" \
  -d '{"title":"Dune","type":"book","author":"Frank Herbert","pages":412}'

# Приклад негативного сценарію (N-02)
curl -s -X POST http://localhost:4010/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"abc","nickname":"Vic"}'
# → 400
```

#!/usr/bin/env bash
# run-mock-scenarios.sh — прогін усіх API-сценаріїв проти Prism mock
# Використання: bash tests/run-mock-scenarios.sh | tee logs/api-mock-run.md
set -euo pipefail

BASE="http://localhost:4010"
ITEM_ID="6ba79227-7c1c-c20f-d92f-033fc2e59050"
COLL_ID="556ee0ca-7c33-4e19-b96e-200be9404db7"
SES_ID="e40e85b0-80e1-133e-a541-28220fd9b18c"
COOKIE="Cookie: session=test"

# Temp files for cover upload tests (Prism has a body size limit)
FAKE_JPEG=$(mktemp /tmp/test_cover_XXXXXX.jpg)
FAKE_TXT=$(mktemp /tmp/test_cover_XXXXXX.txt)
printf '\xFF\xD8\xFF\xE0fake-jpeg-data' > "$FAKE_JPEG"
echo "not an image" > "$FAKE_TXT"
trap 'rm -f "$FAKE_JPEG" "$FAKE_TXT"' EXIT

pass=0; fail=0; total=0

check() {
  local id="$1" desc="$2" expected="$3"
  shift 3
  local actual
  actual=$(curl -s -o /dev/null -w "%{http_code}" "$@")
  total=$((total + 1))
  if [ "$actual" = "$expected" ]; then
    pass=$((pass + 1))
    printf "| %-5s | %-55s | %s | %s | ✓ |\n" "$id" "$desc" "$expected" "$actual"
  else
    fail=$((fail + 1))
    printf "| %-5s | %-55s | %s | %s | ✗ |\n" "$id" "$desc" "$expected" "$actual"
  fi
}

echo "# API Mock Scenarios — результати прогону"
echo ""
echo "**Дата:** $(date '+%Y-%m-%d %H:%M')"
echo "**Mock:** \`node_modules/.bin/prism mock spec/openapi.yaml --port 4010\`"
echo ""
echo "---"
echo ""
echo "## Позитивні сценарії"
echo ""
echo "| ID | Опис | Очікуваний | Фактичний | OK |"
echo "|---|---|---|---|---|"

check P-01 "Реєстрація нового користувача" 201 \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","nickname":"Vic"}'

check P-02 "Вхід з правильними credentials" 200 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

check P-03 "Вихід із системи" 204 \
  -X POST "$BASE/auth/logout" \
  -H "$COOKIE"

check P-04 "Зміна нікнейму" 200 \
  -X PATCH "$BASE/users/me" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"nickname":"NewNick"}'

check P-05 "Отримати повний каталог" 200 \
  "$BASE/items" \
  -H "$COOKIE"

check P-06 "Додати книгу з автором і кількістю сторінок" 201 \
  -X POST "$BASE/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"title":"Dune","type":"book","author":"Frank Herbert","pages":412}'

check P-07 "Отримати один елемент за ID" 200 \
  "$BASE/items/$ITEM_ID" \
  -H "$COOKIE"

check P-08 "Встановити статус completed і дату завершення" 200 \
  -X PATCH "$BASE/items/$ITEM_ID" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"status":"completed","completedAt":"2026-10-29"}'

check P-09 "Отримати список тегів для автодоповнення" 200 \
  "$BASE/tags" \
  -H "$COOKIE"

check P-10 "Додати Session до елемента" 201 \
  -X POST "$BASE/items/$ITEM_ID/sessions" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"date":"2026-10-29","rating":8,"note":"Great read"}'

check P-11 "Отримати список Sessions елемента" 200 \
  "$BASE/items/$ITEM_ID/sessions" \
  -H "$COOKIE"

check P-12 "Редагувати рейтинг Session" 200 \
  -X PATCH "$BASE/items/$ITEM_ID/sessions/$SES_ID" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"rating":9}'

check P-13 "Видалити Session" 204 \
  -X DELETE "$BASE/items/$ITEM_ID/sessions/$SES_ID" \
  -H "$COOKIE"

check P-14 "Отримати список усіх добірок" 200 \
  "$BASE/collections" \
  -H "$COOKIE"

check P-15 "Створити нову добірку" 201 \
  -X POST "$BASE/collections" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"name":"Favourites"}'

check P-16 "Отримати вміст добірки" 200 \
  "$BASE/collections/$COLL_ID" \
  -H "$COOKIE"

check P-17 "Перейменувати добірку" 200 \
  -X PATCH "$BASE/collections/$COLL_ID" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"name":"Best Films"}'

check P-18 "Додати елемент до добірки" 201 \
  -X POST "$BASE/collections/$COLL_ID/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d "{\"itemId\":\"$ITEM_ID\"}"

check P-19 "Вилучити елемент з добірки" 204 \
  -X DELETE "$BASE/collections/$COLL_ID/items/$ITEM_ID" \
  -H "$COOKIE"

check P-20 "Видалити добірку" 204 \
  -X DELETE "$BASE/collections/$COLL_ID" \
  -H "$COOKIE"

check P-21 "Видалити елемент каталогу" 204 \
  -X DELETE "$BASE/items/$ITEM_ID" \
  -H "$COOKIE"

check P-22 "Статистика за поточний місяць" 200 \
  "$BASE/stats?period=month" \
  -H "$COOKIE"

check P-23 "Статистика за поточний рік" 200 \
  "$BASE/stats?period=year" \
  -H "$COOKIE"

check P-24 "Статистика за весь час" 200 \
  "$BASE/stats?period=all" \
  -H "$COOKIE"

check P-25 "Завантажити обкладинку (JPEG)" 200 \
  -X POST "$BASE/items/$ITEM_ID/cover" \
  -H "$COOKIE" \
  -F "file=@$FAKE_JPEG;type=image/jpeg"

check P-26 "Видалити кастомну обкладинку" 204 \
  -X DELETE "$BASE/items/$ITEM_ID/cover" \
  -H "$COOKIE"

echo ""
echo "## Негативні сценарії"
echo ""
echo "| ID | Опис | Очікуваний | Фактичний | OK |"
echo "|---|---|---|---|---|"

check N-01 "Реєстрація без поля nickname" 400 \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

check N-02 "Реєстрація з паролем < 8 символів" 400 \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"abc","nickname":"Vic"}'

check N-03 "Реєстрація з невалідним email" 400 \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"notanemail","password":"password123","nickname":"Vic"}'

check N-04 "Вхід без поля email" 400 \
  -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"password":"password123"}'

check N-05 "GET /items без сесійного cookie" 401 \
  "$BASE/items"

check N-06 "GET /collections без cookie" 401 \
  "$BASE/collections"

check N-07 "GET /stats без cookie" 401 \
  "$BASE/stats?period=all"

check N-08 "Додати елемент без поля title" 400 \
  -X POST "$BASE/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"type":"book"}'

check N-09 "Додати елемент без поля type" 400 \
  -X POST "$BASE/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"title":"Dune"}'

check N-10 "Недопустиме значення type" 400 \
  -X POST "$BASE/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"title":"Dune","type":"anime"}'

check N-11 "Рейтинг поза діапазоном 0–10" 400 \
  -X POST "$BASE/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"title":"Dune","type":"book","rating":11}'

check N-12 "Додати Session без поля date" 400 \
  -X POST "$BASE/items/$ITEM_ID/sessions" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"rating":8}'

check N-13 "Створити добірку без поля name" 400 \
  -X POST "$BASE/collections" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{}'

check N-14 "Додати до добірки без поля itemId" 400 \
  -X POST "$BASE/collections/$COLL_ID/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{}'

check N-15 "Статистика без параметра period" 400 \
  "$BASE/stats" \
  -H "$COOKIE"

check N-16 "Статистика з невалідним period" 400 \
  "$BASE/stats?period=week" \
  -H "$COOKIE"

check N-17 "Нікнейм коротший за 2 символи" 400 \
  -X PATCH "$BASE/users/me" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -d '{"nickname":"X"}'

# N-18..N-21: Prism потребує Prefer для примусового вибору коду

check N-18 "Дублікат email → 409 (Prefer: code=409)" 409 \
  -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -H "Prefer: code=409" \
  -d '{"email":"taken@example.com","password":"password123","nickname":"Vic"}'

check N-19 "Елемент уже в добірці → 409 (Prefer: code=409)" 409 \
  -X POST "$BASE/collections/$COLL_ID/items" \
  -H "Content-Type: application/json" \
  -H "$COOKIE" \
  -H "Prefer: code=409" \
  -d "{\"itemId\":\"$ITEM_ID\"}"

check N-20 "Неіснуючий елемент → 404 (Prefer: code=404)" 404 \
  "$BASE/items/00000000-0000-0000-0000-000000000099" \
  -H "$COOKIE" \
  -H "Prefer: code=404"

check N-21 "Обкладинка невалідного формату → 400 (Prefer: code=400, Prism не перевіряє вміст)" 400 \
  -X POST "$BASE/items/$ITEM_ID/cover" \
  -H "$COOKIE" \
  -H "Prefer: code=400" \
  -F "file=@$FAKE_TXT;type=text/plain"

echo ""
echo "---"
echo ""
echo "**Результат: $pass/$total ✓, $fail провалено**"

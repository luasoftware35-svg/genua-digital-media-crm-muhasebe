#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FB="npx --yes firebase-tools@14.7.0"
PROJECT_ID="${FIREBASE_PROJECT_ID:-genua-digital-crm-muhasebe}"
DISPLAY_NAME="${FIREBASE_DISPLAY_NAME:-Genua Digital CRM Muhasebe}"
ADMIN_EMAIL="${FIREBASE_ADMIN_EMAIL:-umut@genuadigital.com}"
ADMIN_PASSWORD="${FIREBASE_ADMIN_PASSWORD:-GenuaPanel2026!}"
LOCATION="${FIRESTORE_LOCATION:-eur3}"

echo "==> Firebase hesabı kontrol ediliyor..."
if ! $FB login:list 2>&1 | grep -q "Logged in"; then
  echo "Firebase oturumu yok. Tarayıcı açılacak — Google ile giriş yapın."
  $FB login
fi

ACCOUNT=$($FB login:list 2>&1 | grep "Logged in" | sed -E 's/.*as //' | head -1)
echo "==> Oturum: $ACCOUNT"

if ! $FB projects:list 2>&1 | grep -q "$PROJECT_ID"; then
  echo "==> Proje oluşturuluyor: $PROJECT_ID"
  $FB projects:create "$PROJECT_ID" --display-name "$DISPLAY_NAME"
else
  echo "==> Proje zaten var: $PROJECT_ID"
fi

$FB use "$PROJECT_ID"

echo "==> Firestore veritabanı..."
if ! $FB firestore:databases:list --project "$PROJECT_ID" 2>&1 | grep -q "(default)"; then
  $FB firestore:databases:create "(default)" --location "$LOCATION" --project "$PROJECT_ID" || true
fi

echo "==> Web app ve config..."
APP_ID=$($FB apps:list WEB --project "$PROJECT_ID" --json 2>/dev/null | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
const apps=d.result?.apps||[];
process.stdout.write(apps[0]?.appId||'');
" || true)

if [ -z "$APP_ID" ]; then
  $FB apps:create WEB "Genua Panel Web" --project "$PROJECT_ID" >/dev/null
  APP_ID=$($FB apps:list WEB --project "$PROJECT_ID" --json | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
process.stdout.write(d.result.apps[0].appId);
")
fi

echo "==> SDK config alınıyor..."
$FB apps:sdkconfig WEB "$APP_ID" --project "$PROJECT_ID" --json > /tmp/firebase-sdk.json

node <<'NODE'
const fs = require('fs');
const sdk = JSON.parse(fs.readFileSync('/tmp/firebase-sdk.json', 'utf8'));
const cfg = sdk.result?.sdkConfig || sdk.sdkConfig || sdk;
const lines = [
  `NEXT_PUBLIC_FIREBASE_API_KEY=${cfg.apiKey}`,
  `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${cfg.authDomain}`,
  `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${cfg.projectId}`,
  `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${cfg.storageBucket}`,
  `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${cfg.messagingSenderId}`,
  `NEXT_PUBLIC_FIREBASE_APP_ID=${cfg.appId}`,
];
fs.writeFileSync('.env.local', lines.join('\n') + '\n');
console.log('==> .env.local yazıldı');
NODE

echo "==> Güvenlik kuralları deploy ediliyor..."
$FB deploy --only firestore:rules,storage --project "$PROJECT_ID"

API_KEY=$(grep NEXT_PUBLIC_FIREBASE_API_KEY .env.local | cut -d= -f2)

echo "==> Email/Password auth etkinleştiriliyor..."
ACCESS_TOKEN=$($FB login:ci --no-localhost 2>/dev/null | tail -1 || true)
if [ -z "$ACCESS_TOKEN" ]; then
  TOKEN=$($FB --project "$PROJECT_ID" login:export /tmp/fb-token.json 2>/dev/null || true)
fi

# Identity Toolkit config via gcloud if available
if command -v gcloud >/dev/null 2>&1; then
  gcloud auth application-default print-access-token >/dev/null 2>&1 && \
  GCLOUD_TOKEN=$(gcloud auth print-access-token) && \
  curl -s -X PATCH \
    "https://identitytoolkit.googleapis.com/v2/projects/${PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired" \
    -H "Authorization: Bearer ${GCLOUD_TOKEN}" \
    -H "Content-Type: application/json" \
    -H "X-Goog-User-Project: ${PROJECT_ID}" \
    -d '{"signIn":{"email":{"enabled":true,"passwordRequired":true}}}' >/dev/null && \
  echo "==> Auth email etkin (gcloud)" || echo "==> Auth: Console'dan Email/Password açın"
else
  echo "==> Auth: Firebase Console > Authentication > Email/Password açın (tek tık)"
fi

echo "==> Admin kullanıcı oluşturuluyor..."
curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\",\"returnSecureToken\":true}" \
  | node -e "
const d=JSON.parse(require('fs').readFileSync(0,'utf8'));
if (d.localId) console.log('==> Kullanıcı oluşturuldu:', process.env.ADMIN_EMAIL);
else if ((d.error?.message||'').includes('EMAIL_EXISTS')) console.log('==> Kullanıcı zaten var:', process.env.ADMIN_EMAIL);
else console.log('==> Kullanıcı:', d.error?.message || 'Auth henüz aktif değil — Email/Password açın');
" ADMIN_EMAIL="$ADMIN_EMAIL"

cat > firebase-setup-summary.txt <<EOF
Firebase proje: $PROJECT_ID
Giriş e-posta: $ADMIN_EMAIL
Giriş şifre: $ADMIN_PASSWORD

.env.local oluşturuldu.
Vercel env eklemek için:
  npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
  (diğer NEXT_PUBLIC_FIREBASE_* değişkenleri için tekrarla)
EOF

echo ""
echo "=== TAMAMLANDI ==="
cat firebase-setup-summary.txt

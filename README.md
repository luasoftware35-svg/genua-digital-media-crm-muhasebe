# Genua Digital Media — CRM · Muhasebe

Şirket içi ajans paneli. **Firebase** (Auth + Firestore + Storage) ile çalışır.

**Canlı:** https://genua-digital-media-crm-muhasebe.vercel.app

## Kurulum

```bash
npm install
cp .env.local.example .env.local
# .env.local içine Firebase ayarlarını yapıştır
npm run dev
```

## Firebase kurulumu

1. [Firebase Console](https://console.firebase.google.com) → **Yeni proje** oluştur
2. **Authentication** → Sign-in method → **Email/Password** etkinleştir
3. **Authentication** → Users → **Add user** ile panel kullanıcını ekle
4. **Firestore Database** → Create database (production mode)
5. **Storage** → Get started
6. Proje ayarları → Web app ekle → config değerlerini `.env.local` dosyasına kopyala:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

7. Güvenlik kurallarını deploy et (Firebase CLI gerekir):

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # proje ID seç
firebase deploy --only firestore:rules,storage
```

Kurallar `firebase/` klasöründedir — giriş yapmış kullanıcılar okuyup yazabilir.

## Vercel deploy

Vercel dashboard → Project → Settings → Environment Variables → aynı `NEXT_PUBLIC_FIREBASE_*` değerlerini ekle.

## Modüller

| Sayfa | Route |
|---|---|
| Dashboard | `/dashboard` |
| Firmalar | `/firmalar` |
| Ödemeler | `/odemeler` |
| Projeler | `/projeler` |
| Teklifler | `/teklifler` |
| Giderler | `/giderler` |
| İçerik Takvimi | `/takvim` |
| Raporlar | `/raporlar` |
| Ayarlar | `/ayarlar` |

Veriler Firestore koleksiyonlarında kalıcı olarak saklanır.

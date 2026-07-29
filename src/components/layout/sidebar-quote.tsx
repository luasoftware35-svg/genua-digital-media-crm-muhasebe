"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const QUOTES = [
  {
    text: "Kontrol edebildiğin şeye odaklan. Gerisini bırak.",
    author: "Epiktetos",
  },
  {
    text: "Engeller yolu engellemez — yol engellerden geçer.",
    author: "Marcus Aurelius",
  },
  {
    text: "Zamanımızın çoğu bizim değil; başkalarına harcanıyor.",
    author: "Seneca",
  },
  {
    text: "Düşünce eylemdir. Ne düşünürsen o olursun.",
    author: "Marcus Aurelius",
  },
  {
    text: "İmkansız diye bir şey yoktur; sadece henüz yapılmamış vardır.",
    author: "Seneca",
  },
  {
    text: "Öfke, aklın rüzgârda savrulmasıdır.",
    author: "Seneca",
  },
  {
    text: "Sabah kalktığında kendine söyle: Bugün insanlarla karşılaşacağım.",
    author: "Marcus Aurelius",
  },
  {
    text: "Mutluluk, olanı istemektir; olmayanı değil.",
    author: "Epiktetos",
  },
  {
    text: "En güçlü silahın, sakin bir akıldır.",
    author: "Marcus Aurelius",
  },
  {
    text: "Yaşamın kısalığı değil, israfıdır sorun.",
    author: "Seneca",
  },
  {
    text: "Zorluk, karakterin aynasıdır.",
    author: "Epiktetos",
  },
  {
    text: "Yarının işini bugüne bırakma — bugün senin.",
    author: "Marcus Aurelius",
  },
  {
    text: "Disiplin, özgürlüğün fiyatıdır.",
    author: "Epiktetos",
  },
  {
    text: "Küçük işler büyük sonuçlar doğurur. İhmal etme.",
    author: "Seneca",
  },
  {
    text: "Dışarıdaki kaos seni bozamaz; sen izin verirsen bozar.",
    author: "Marcus Aurelius",
  },
  {
    text: "Bilgelik, neyin senin neyin olmadığını bilmektir.",
    author: "Epiktetos",
  },
  {
    text: "Erteleme, geleceğin hırsızıdır.",
    author: "Seneca",
  },
  {
    text: "İşini iyi yap. Övgüyü bekleme.",
    author: "Marcus Aurelius",
  },
  {
    text: "Dayanıklılık doğuştan gelmez; seçilir.",
    author: "Epiktetos",
  },
  {
    text: "Netlik, kararın anahtarıdır. Kararsızlık ise yük.",
    author: "Seneca",
  },
  {
    text: "Başkalarının ne düşündüğü seni tanımlamaz; senin ne yaptığın tanımlar.",
    author: "Epiktetos",
  },
  {
    text: "Her sabah yeniden doğarsın. Dün seni bağlamaz.",
    author: "Marcus Aurelius",
  },
  {
    text: "Konfor, büyümenin düşmanıdır. Zorluk seni inşa eder.",
    author: "Seneca",
  },
  {
    text: "Özgürlük, dış koşullara değil; iç huzura bağlıdır.",
    author: "Epiktetos",
  },
  {
    text: "Acele etme. Doğru hamle, hızlı hamleden üstündür.",
    author: "Marcus Aurelius",
  },
  {
    text: "Zenginlik, az şeye sahip olmaktır.",
    author: "Seneca",
  },
  {
    text: "Kendine hükmet; dünyaya hükmet.",
    author: "Epiktetos",
  },
  {
    text: "Olumsuzluk seni yıkamaz; ona verdiğin anlam yıkar.",
    author: "Marcus Aurelius",
  },
  {
    text: "Cesaret, korkunun yokluğu değil; korkuya rağmen ilerlemektir.",
    author: "Seneca",
  },
  {
    text: "Şikâyet etmek yerine çözüm üret. Enerjini oraya harca.",
    author: "Epiktetos",
  },
  {
    text: "Bugünkü işini bugün bitir. Yarın kendi yükü vardır.",
    author: "Marcus Aurelius",
  },
  {
    text: "Sessizlik, en güçlü cevaplardan biridir.",
    author: "Seneca",
  },
  {
    text: "Başarısızlık bir son değil; bir veridir.",
    author: "Epiktetos",
  },
  {
    text: "İnsanları değiştirmeye çalışma. Kendini geliştir.",
    author: "Marcus Aurelius",
  },
  {
    text: "Her gün biraz daha iyi ol. Küçük adımlar büyük yolculuklar açar.",
    author: "Seneca",
  },
  {
    text: "Duyguların seni yönetmesine izin verme; sen onları yönet.",
    author: "Epiktetos",
  },
  {
    text: "Ölümü hatırla — bu seni gereksiz endişeden kurtarır.",
    author: "Marcus Aurelius",
  },
  {
    text: "Sabır, acı çekmek değil; acıyı anlamlandırmaktır.",
    author: "Seneca",
  },
  {
    text: "İstediğin şeyi elde edemezsen, istemeyi bırakmayı öğren.",
    author: "Epiktetos",
  },
  {
    text: "Doğru olanı yapmak popüler olmakla aynı şey değildir.",
    author: "Marcus Aurelius",
  },
  {
    text: "Boş konuşma yerine net eylem tercih et.",
    author: "Seneca",
  },
  {
    text: "Kendine karşı dürüst ol. Başkalarına karşı dürüstlük oradan gelir.",
    author: "Epiktetos",
  },
  {
    text: "Evren değişir. Sen de değiş. Uyum, dirençten güçlüdür.",
    author: "Marcus Aurelius",
  },
  {
    text: "Para araçtır; amaç değil. Amacını unutma.",
    author: "Seneca",
  },
  {
    text: "Gurur seni yüksekten düşürür. Alçakgönüllülük ayakta tutar.",
    author: "Epiktetos",
  },
  {
    text: "Ne söylediğin değil, ne yaptığın seni tanımlar.",
    author: "Marcus Aurelius",
  },
  {
    text: "Zaman en değerli varlığındır. Onu kimseye bedava verme.",
    author: "Seneca",
  },
  {
    text: "Hayat sana ne verirse ver, onu en iyi şekilde kullan.",
    author: "Epiktetos",
  },
  {
    text: "İç sesini dinle. Kalabalığın sesi senin sesin değildir.",
    author: "Marcus Aurelius",
  },
  {
    text: "Kıskançlık, kendi eksikliğini başkasında aramaktır.",
    author: "Seneca",
  },
  {
    text: "Her zorluk, gizli bir ders taşır. Onu bul.",
    author: "Epiktetos",
  },
  {
    text: "Mükemmel olmaya çalışma. Tutarlı ol.",
    author: "Marcus Aurelius",
  },
  {
    text: "Gece yatmadan önce kendine sor: Bugün ne öğrendim?",
    author: "Seneca",
  },
  {
    text: "Başkalarının onayına ihtiyacın yok. Kendi onayın yeter.",
    author: "Epiktetos",
  },
  {
    text: "Fırtına geldiğinde ağaç köklerine sarılır. Sen de değerlerine.",
    author: "Marcus Aurelius",
  },
  {
    text: "Öğrenmeyi bırakmak, yaşamayı bırakmaktır.",
    author: "Seneca",
  },
  {
    text: "Kontrol edemediğin şeyler için endişelenmek, enerjini çalar.",
    author: "Epiktetos",
  },
  {
    text: "Basit yaşam, karmaşık zihin için en büyük lükstür.",
    author: "Marcus Aurelius",
  },
  {
    text: "Her 'hayır' dediğin şey, bir 'evet'e alan açar.",
    author: "Seneca",
  },
  {
    text: "Acı geçicidir. Vazgeçmek kalıcıdır.",
    author: "Epiktetos",
  },
  {
    text: "Dünya senin etrafında dönmez. Sen dünyanın bir parçasısın.",
    author: "Marcus Aurelius",
  },
  {
    text: "Konuşmadan önce dinle. Hareket etmeden önce düşün.",
    author: "Seneca",
  },
  {
    text: "Gerçek güç, zayıflığını kabul edebilmektir.",
    author: "Epiktetos",
  },
  {
    text: "Bugün yapabileceğin en iyi işi yap. Gerisi kendiliğinden gelir.",
    author: "Marcus Aurelius",
  },
  {
    text: "Mutluluk dışarıda aranmaz; içeride inşa edilir.",
    author: "Seneca",
  },
  {
    text: "Plan yap, ama planın seni esir almasına izin verme.",
    author: "Epiktetos",
  },
  {
    text: "Her insan bir öğretmendir. İyi veya kötü — ders vardır.",
    author: "Marcus Aurelius",
  },
  {
    text: "Sakin kal. Panik, en kötü kararların annesidir.",
    author: "Seneca",
  },
  {
    text: "Kendi hikâyeni yaz. Başkalarının senaryosunda figüran olma.",
    author: "Epiktetos",
  },
];

const INTERVAL_MS = 8000;

export function SidebarQuote() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % QUOTES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const quote = QUOTES[index];

  return (
    <div className="border-t border-[#262626] p-4 min-h-[108px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="space-y-2"
        >
          <p className="font-mono text-[11px] leading-relaxed text-text-secondary">
            “{quote.text}”
          </p>
          <p className="font-mono text-[10px] text-accent/80 tracking-wide">
            — {quote.author}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { Link } from "react-router";
import { FileText, Lock, ScrollText, ShieldCheck } from "lucide-react";
import { Container, PageHero } from "@/components/site";
import { Button } from "@/components/ui/button";

/**
 * Hujjatlar sahifasi.
 *
 * Footer va ro'yxatdan o'tish sahifasidagi yuridik havolalar shu sahifaning
 * bo'limlariga olib boradi (`/hujjatlar#maxfiylik` kabi).
 */

const UPDATED = "2026-yil 1-sentabr";

type Doc = {
  id: string;
  title: string;
  icon: typeof FileText;
  intro: string;
  items: { heading: string; text: string }[];
};

const DOCS: Doc[] = [
  {
    id: "maxfiylik",
    title: "Maxfiylik siyosati",
    icon: Lock,
    intro:
      "Biz sizning shaxsiy ma'lumotlaringizni faqat sayohatni tashkil qilish uchun yig'amiz va uchinchi shaxslarga sotmaymiz.",
    items: [
      {
        heading: "Qanday ma'lumot yig'iladi",
        text: "Ism, telefon raqami, email, sayohat sanalari va to'lov holati. To'lov karta ma'lumotlari bizda saqlanmaydi — ular to'lov provayderlari (Click, Payme) tomonidan qayta ishlanadi.",
      },
      {
        heading: "Ma'lumot nima uchun ishlatiladi",
        text: "Bronni tasdiqlash, mehmonxona/transport/gidga uzatish, to'lov va qaytarish jarayonlari, shuningdek xizmat sifati bo'yicha aloqa uchun.",
      },
      {
        heading: "Kim bilan bo'lishamiz",
        text: "Faqat buyurtmani bajarishga jalb qilingan hamkorlar (mehmonxona, transfer, gid, tarjimon) bilan — zarur hajmdagina. Boshqa maqsadlarda uchinchi shaxslarga berilmaydi.",
      },
      {
        heading: "Sizning huquqlaringiz",
        text: "Profilingizni ko'rish, tuzatish yoki o'chirib tashlashni so'rash huquqiga egasiz. So'rov uchun salam@millytour.uz manziliga yozing — 7 ish kuni ichida javob beramiz.",
      },
      {
        heading: "Telegram orqali kirish",
        text: "Telegram bot orqali kirganingizda faqat Telegram ID, ism va (ruxsat bersangiz) telefon raqamingiz olinadi. Bu ma'lumot faqat hisobingizni bog'lash uchun kerak.",
      },
    ],
  },
  {
    id: "foydalanish",
    title: "Foydalanish shartlari",
    icon: ScrollText,
    intro:
      "Platformadan foydalanish qoidalari: bron qilish, to'lov, bekor qilish va javobgarlik chegaralari.",
    items: [
      {
        heading: "Bron qilish",
        text: "Buyurtma to'lov tasdiqlangach kuchga kiradi. Joylar soni cheklangan — to'lov kechiksa, narx va mavjudlik o'zgarishi mumkin.",
      },
      {
        heading: "Narxlar",
        text: "Narxlar AQSh dollarida ko'rsatiladi, so'mdagi ekvivalenti ma'lumot uchun beriladi. Yakuniy to'lov valyutasi buyurtma varag'ida ko'rsatiladi.",
      },
      {
        heading: "Bekor qilish va qaytarish",
        text: "Safardan 24 soat oldin bepul o'zgartirish mumkin. Kechroq bekor qilinsa, hamkorlar siyosatiga qarab qisman qaytariladi (mehmonxona va transport shartlari alohida).",
      },
      {
        heading: "Foydalanuvchi majburiyatlari",
        text: "To'g'ri aloqa ma'lumotlarini kiritish, pasport/hujjatlar amal qilish muddatini tekshirish va hamkorlar qoidalariga rioya qilish.",
      },
      {
        heading: "Javobgarlik chegarasi",
        text: "Biz tashkilotchi sifatida javobgarmiz, biroq fors-major holatlar (ob-havo, yopiq yo'llar, rasmiy cheklovlar) uchun javobgarlikni o'z zimmamizga olmaymiz.",
      },
    ],
  },
  {
    id: "oferta",
    title: "Ommaviy oferta",
    icon: FileText,
    intro:
      "Turistik xizmatlarni sotish bo'yicha ommaviy shartnoma — saytdagi buyurtma talabnoma hisoblanadi.",
    items: [
      {
        heading: "Shartnoma predmeti",
        text: "Ijrochi saytda ko'rsatilgan tur paket va xizmatlarni tashkil qilishni, mijoz esa ularni qabul qilib, kelishilgan summani to'lashni majburiyat oladi.",
      },
      {
        heading: "Buyurtma berish tartibi",
        text: "Buyurtma sayt, Milly AI chat yoki Telegram bot orqali beriladi. Hisob-faktura va bron kodi email/Telegramga yuboriladi.",
      },
      {
        heading: "To'lov shartlari",
        text: "To'lov Click, Payme yoki bank o'tkazmasi orqali amalga oshiriladi. Xizmat ko'rsatilishi uchun 30% oldindan to'lov talab qilinishi mumkin.",
      },
      {
        heading: "Tomonlarning javobgarligi",
        text: "Nizolar muzokaralar yo'li bilan, kelishuvga erishilmasa — O'zbekiston Respublikasi qonunchiligiga ko'ra hal qilinadi.",
      },
      {
        heading: "Shartnoma muddati",
        text: "Oferta saytda e'lon qilingan paytdan kuchga kiradi va yangi tahriri chiqarilgunga qadar amal qiladi.",
      },
    ],
  },
];

export default function Documents() {
  return (
    <>
      <PageHero
        eyebrow="Yuridik ma'lumot"
        title="Hujjatlar va shartlar"
        description="Maxfiylik siyosati, foydalanish shartlari va ommaviy oferta — bir sahifada. Savollar bo'lsa, qo'llab-quvvatlash xizmatiga yozing."
      >
        <div className="flex flex-wrap gap-2">
          {DOCS.map((doc) => (
            <a
              key={doc.id}
              href={`#${doc.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/20"
            >
              <doc.icon className="size-3.5 text-gold" aria-hidden="true" />
              {doc.title}
            </a>
          ))}
        </div>
      </PageHero>

      <Container className="py-12 lg:py-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-[12px] font-semibold text-muted-foreground">
          <ShieldCheck className="size-3.5 text-eco" aria-hidden="true" />
          Oxirgi yangilanish: {UPDATED}
        </p>

        <div className="mt-8 space-y-6">
          {DOCS.map((doc) => (
            <section
              key={doc.id}
              id={doc.id}
              className="scroll-mt-24 rounded-3xl border border-border/70 bg-card p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)] sm:p-8"
            >
              <div className="flex items-start gap-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <doc.icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-[20px] leading-7 font-bold tracking-tight text-foreground sm:text-[22px]">
                    {doc.title}
                  </h2>
                  <p className="mt-1.5 max-w-2xl text-[13.5px] leading-6 text-muted-foreground">
                    {doc.intro}
                  </p>
                </div>
              </div>

              <ol className="mt-6 space-y-5">
                {doc.items.map((item, index) => (
                  <li key={item.heading} className="flex gap-3.5">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-[14px] font-semibold text-foreground">{item.heading}</h3>
                      <p className="mt-1 text-[13px] leading-6 text-muted-foreground">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-muted/40 p-6">
          <div>
            <p className="text-[15px] font-semibold text-foreground">Savolingiz bormi?</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Qo'llab-quvvatlash: <a className="font-medium text-primary hover:underline" href="mailto:salam@millytour.uz">salam@millytour.uz</a> ·{" "}
              <a className="font-medium text-primary hover:underline" href="tel:+998712007070">+998 71 200 70 70</a>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/hamkorlar">Hamkorlik shartlari</Link>
            </Button>
            <Button asChild>
              <Link to="/paketlar">Tur paketlar</Link>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}

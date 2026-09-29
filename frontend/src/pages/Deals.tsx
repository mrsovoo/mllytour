import { PageHero } from "@/components/site";
import { TopDealsBand } from "@/components/top-deals";

/**
 * Takliflar sahifasi (`/takliflar`).
 *
 * Bosh sahifadagi banner shu sahifaga olib keladi: chapda haftalik chegirma
 * banneri, o'ngda turkum bo'yicha filtrlanadigan taklif kartochkalari.
 */
export default function Deals() {
  return (
    <>
      <PageHero
        eyebrow="Takliflar"
        title="Shu haftaning eng yaxshi takliflari"
        description="Chegirmali tur paketlar va hafta tanlovi — tarixiy shaharlar, ekoturizm va tabiat, hunarmandchilik, ziyorat hamda sarguzasht yo'nalishlari bo'yicha. Narxlar joylar tugaguncha amal qiladi."
      />

      <TopDealsBand hideHeading />
    </>
  );
}

import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { assetPaths, categories, featuredNominees, nomineeEntries } from "../data/home";

type Nominee = {
  title: string;
  name: string;
  image: string;
};

const sliderModules = [Autoplay, Pagination];

export function CategorySlider() {
  return (
    <Swiper
      className="category-slider gbe-swiper container-gbe mt-[42px] max-[560px]:mt-[54px]"
      modules={sliderModules}
      slidesPerView={1}
      slidesPerGroup={1}
      spaceBetween={16}
      loop
      autoplay={{ delay: 2500, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      breakpoints={{
        768: { slidesPerView: 2, spaceBetween: 20 },
        1025: { slidesPerView: 3, spaceBetween: 24 },
      }}
    >
      {categories.map((category, index) => (
        <SwiperSlide key={`${category}-${index}`}>
          <article className="group grid min-h-[250px] place-items-center overflow-hidden rounded-[12px] border border-[rgba(255,176,1,0.5)] bg-gradient-to-b from-gbe-surface-3 to-gbe-surface px-5 pb-[38px] pt-11 transition-all duration-300 hover:-translate-y-[6px] hover:border-gbe-gold hover:shadow-[0_12px_40px_rgba(255,176,1,0.25)] hover:bg-gradient-to-b hover:from-gbe-surface-3/80 hover:to-gbe-surface-2 max-[1024px]:min-h-[238px]">
            <div className="mb-5 transition-transform duration-300 group-hover:scale-110">
              <img className="h-[100px] w-[100px] object-contain drop-shadow-[0_4px_12px_rgba(255,176,1,0.15)]" src={assetPaths.award} alt="" width="100" height="100" loading="lazy" decoding="async" />
            </div>
            <h3 className="mb-0 max-w-[300px] text-center text-[clamp(17px,1.5vw,21px)] font-bold leading-[1.25] text-gbe-text transition-colors duration-300 group-hover:text-gbe-gold max-[560px]:text-[17px]">{category}</h3>
          </article>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function NomineeCard({ nominee }: { nominee: Nominee }) {
  return (
    <article className="nominee-card group relative grid min-h-[367px] grid-cols-[minmax(0,1fr)_124px] grid-rows-[1fr_auto] overflow-hidden rounded-[18px] border border-[rgba(255,176,1,0.16)] bg-[radial-gradient(circle_at_88%_18%,rgba(255,176,1,0.2),transparent_120px),linear-gradient(135deg,rgba(255,176,1,0.16),transparent_23%,transparent_72%,rgba(25,84,255,0.16)),var(--c-card)] px-[30px] pb-6 pt-[38px] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:-translate-y-2 hover:border-[rgba(255,176,1,0.55)] hover:shadow-[0_20px_55px_rgba(0,0,0,0.55),0_0_34px_rgba(255,176,1,0.18)] max-[1024px]:min-h-[336px] max-[1024px]:grid-cols-[minmax(0,1fr)_94px] max-[1024px]:px-6 max-[1024px]:pb-[22px] max-[1024px]:pt-[34px]">
      <div className="relative z-[1] pr-4">
        <div className="mb-5 h-px w-16 bg-gradient-to-r from-gbe-gold to-transparent transition-all duration-300 group-hover:w-24" aria-hidden="true"></div>
        <h3 className="m-0 text-[clamp(19px,1.55vw,23px)] font-extrabold leading-[1.12] text-gbe-text transition-colors duration-300 group-hover:text-gbe-gold max-[1024px]:text-lg">{nominee.title}</h3>
        <p className="mb-0 mt-[18px] text-[clamp(15px,1.15vw,16px)] font-medium leading-[1.45] text-gbe-text/72 transition-colors duration-300 group-hover:text-gbe-text/88 max-[1024px]:text-[15px]">{nominee.name}</p>
      </div>
      <div className="relative z-[1] self-center justify-self-center rounded-full bg-[linear-gradient(135deg,rgba(255,176,1,0.78),rgba(255,255,255,0.22),rgba(31,92,255,0.36))] p-[3px] shadow-[0_0_26px_rgba(255,176,1,0.14)] transition-transform duration-300 group-hover:scale-105">
        <img className="h-28 w-28 rounded-full bg-gbe-card object-cover object-center max-[1024px]:h-[88px] max-[1024px]:w-[88px]" src={nominee.image} alt="" width="300" height="300" loading="lazy" decoding="async" />
      </div>
      <div className="relative z-[1] col-span-full mt-8 flex items-end justify-between gap-[18px] border-t border-gbe-text/10 pt-5">
        <span className="font-script text-[42px] font-bold leading-[0.9] text-gbe-text transition-colors duration-300 group-hover:text-gbe-gold">Congratulations!</span>
        <img className="h-[52px] w-[52px] object-contain drop-shadow-[0_0_12px_rgba(255,176,1,0.18)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" src={assetPaths.award} alt="" width="52" height="52" loading="lazy" decoding="async" />
      </div>
    </article>
  );
}

function NomineeSlider({ nominees, className }: { nominees: Nominee[]; className: string }) {
  return (
    <Swiper
      className={`nominee-slider gbe-swiper m-0 w-full ${className}`}
      modules={[Autoplay]}
      slidesPerView={1}
      slidesPerGroup={1}
      spaceBetween={25}
      loop
      autoplay={{ delay: 2000, disableOnInteraction: false }}
      breakpoints={{
        768: { slidesPerView: 2 },
        1025: { slidesPerView: 3 },
      }}
    >
      {nominees.map((nominee, index) => (
        <SwiperSlide key={`${nominee.title}-${nominee.name}-${index}`}>
          <NomineeCard nominee={nominee} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

export function FeaturedNomineeSlider() {
  return <NomineeSlider nominees={featuredNominees} className="nominee-slider--featured" />;
}

export function NomineeEntrySlider() {
  return <NomineeSlider nominees={nomineeEntries} className="nominee-slider--entries mt-[25px]" />;
}

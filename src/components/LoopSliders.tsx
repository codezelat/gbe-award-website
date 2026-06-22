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
          <article className="group grid min-h-[250px] place-items-center overflow-hidden rounded-[12px] border border-[rgba(255,176,1,0.5)] bg-gradient-to-b from-[#0a0a0a] to-[#050505] px-5 pb-[38px] pt-11 transition-all duration-300 hover:-translate-y-[6px] hover:border-gbe-gold hover:shadow-[0_12px_40px_rgba(255,176,1,0.25)] hover:bg-gradient-to-b hover:from-[#111111] hover:to-[#0a0a0a] max-[1024px]:min-h-[238px]">
            <div className="mb-5 transition-transform duration-300 group-hover:scale-110">
              <img className="h-[100px] w-[100px] object-contain drop-shadow-[0_4px_12px_rgba(255,176,1,0.15)]" src={assetPaths.award} alt="" width="100" height="100" loading="lazy" decoding="async" />
            </div>
            <h3 className="mb-0 max-w-[300px] text-center text-[clamp(17px,1.5vw,21px)] font-bold leading-[1.25] text-white transition-colors duration-300 group-hover:text-gbe-gold max-[560px]:text-[17px]">{category}</h3>
          </article>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function NomineeCard({ nominee }: { nominee: Nominee }) {
  return (
    <article className="nominee-card relative grid min-h-[367px] grid-cols-[minmax(0,1fr)_126px] grid-rows-[1fr_auto] overflow-hidden rounded-[15px] bg-[linear-gradient(90deg,rgba(255,176,1,0.18),transparent_10%,transparent_90%,rgba(255,176,1,0.18)),#030303] px-[30px] pb-6 pt-[42px] text-left max-[1024px]:min-h-[336px] max-[1024px]:grid-cols-[minmax(0,1fr)_96px] max-[1024px]:px-6 max-[1024px]:pb-[22px] max-[1024px]:pt-[35px]">
      <div>
        <h3 className="relative z-[1] m-0 text-[clamp(20px,1.7vw,24px)] font-bold leading-[1.15] text-white max-[1024px]:text-lg">{nominee.title}</h3>
        <p className="relative z-[1] mb-0 mt-[22px] text-[clamp(15px,1.2vw,17px)] font-normal leading-[1.5] text-gbe-muted max-[1024px]:text-[15px]">{nominee.name}</p>
      </div>
      <img className="h-28 w-28 self-center justify-self-center rounded-full object-cover object-center max-[1024px]:h-[88px] max-[1024px]:w-[88px]" src={nominee.image} alt="" width="300" height="300" loading="lazy" decoding="async" />
      <div className="relative z-[1] col-span-full flex items-end justify-end gap-[18px]">
        <span className="font-script text-[42px] font-bold leading-[0.9] text-white">Congratulations!</span>
        <img className="h-[52px] w-[52px] object-contain" src={assetPaths.award} alt="" width="52" height="52" loading="lazy" decoding="async" />
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

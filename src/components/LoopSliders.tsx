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
      className="category-slider gbe-swiper container-gbe mt-[42px] pb-0 max-[560px]:mt-[54px]"
      modules={sliderModules}
      slidesPerView={1}
      slidesPerGroup={1}
      spaceBetween={10}
      loop
      autoplay={{ delay: 2000, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      breakpoints={{
        768: { slidesPerView: 2 },
        1025: { slidesPerView: 3 },
      }}
    >
      {categories.map((category, index) => (
        <SwiperSlide key={`${category}-${index}`}>
          <article className="grid min-h-[250px] place-items-center rounded-[10px] border-2 border-[rgba(255,176,1,0.78)] bg-gbe-panel px-5 pb-[38px] pt-11 transition-[transform,box-shadow,border-color] duration-[240ms] hover:-translate-y-1 hover:border-gbe-gold hover:shadow-gold-glow max-[1024px]:min-h-[238px]">
            <img className="h-[100px] w-[100px] object-contain" src={assetPaths.award} alt="" width="100" height="100" loading="lazy" decoding="async" />
            <h3 className="mb-0 mt-5 max-w-[300px] text-[clamp(18px,1.6vw,22px)] font-bold leading-[1.2] text-white max-[560px]:text-[17px]">{category}</h3>
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

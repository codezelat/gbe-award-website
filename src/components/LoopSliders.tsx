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
      className="category-slider gbe-swiper"
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
          <article className="category-card">
            <img src={assetPaths.award} alt="" width="100" height="100" loading="lazy" decoding="async" />
            <h3>{category}</h3>
          </article>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

function NomineeCard({ nominee }: { nominee: Nominee }) {
  return (
    <article className="nominee-card">
      <div className="nominee-copy">
        <h3>{nominee.title}</h3>
        <p>{nominee.name}</p>
      </div>
      <img className="nominee-photo" src={nominee.image} alt="" width="300" height="300" loading="lazy" decoding="async" />
      <div className="nominee-footer">
        <span>Congratulations!</span>
        <img src={assetPaths.award} alt="" width="52" height="52" loading="lazy" decoding="async" />
      </div>
    </article>
  );
}

function NomineeSlider({ nominees, className }: { nominees: Nominee[]; className: string }) {
  return (
    <Swiper
      className={`nominee-slider gbe-swiper ${className}`}
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
  return <NomineeSlider nominees={nomineeEntries} className="nominee-slider--entries" />;
}

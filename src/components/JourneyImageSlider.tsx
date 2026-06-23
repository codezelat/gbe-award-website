import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

type JourneyImage = {
  src: string;
  alt: string;
};

export default function JourneyImageSlider({ images }: { images: JourneyImage[] }) {
  const loopImages = [...images, ...images];

  return (
    <Swiper
      className="journey-mobile-slider"
      modules={[Autoplay]}
      slidesPerView={1.08}
      centeredSlides
      loop
      speed={5200}
      allowTouchMove={false}
      autoplay={{
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: false,
      }}
      breakpoints={{
        560: { slidesPerView: 1.34, spaceBetween: 18 },
        768: { slidesPerView: 1.62, spaceBetween: 22 },
      }}
      spaceBetween={14}
    >
      {loopImages.map((image, index) => (
        <SwiperSlide key={`${image.src}-${index}`}>
          <figure className="relative m-0 overflow-hidden rounded-[18px] border border-[rgba(255,176,1,0.24)] bg-gbe-bg shadow-[0_12px_32px_rgba(26,26,46,0.12)]">
            <img
              className="aspect-[16/10] w-full object-cover object-center"
              src={image.src}
              alt={image.alt}
              width="768"
              height="480"
              loading="eager"
              decoding="async"
            />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_62%,rgba(0,0,0,0.46))]" aria-hidden="true"></div>
          </figure>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

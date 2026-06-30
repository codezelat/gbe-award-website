import { useState } from "react";
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import type { AboutGalleryImage } from "../data/aboutGallery";

type Props = {
  images: AboutGalleryImage[];
};

export default function AboutGallerySlider({ images }: Props) {
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[11vw] bg-gradient-to-r from-[var(--c-bg)] to-transparent max-[560px]:w-10" aria-hidden="true"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[11vw] bg-gradient-to-l from-[var(--c-bg)] to-transparent max-[560px]:w-10" aria-hidden="true"></div>

      <div className="absolute right-[max(24px,calc((100vw-var(--container))/2))] top-3 z-20 flex gap-2 max-[560px]:right-4 max-[560px]:top-2">
        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(255,176,1,0.42)] bg-gbe-surface-3/90 text-gbe-gold shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur transition-colors hover:bg-gbe-gold hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gbe-gold max-[560px]:h-9 max-[560px]:w-9"
          type="button"
          aria-label="Previous gallery image"
          onClick={() => swiper?.slidePrev()}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(255,176,1,0.42)] bg-gbe-surface-3/90 text-gbe-gold shadow-[0_12px_30px_rgba(0,0,0,0.18)] backdrop-blur transition-colors hover:bg-gbe-gold hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gbe-gold max-[560px]:h-9 max-[560px]:w-9"
          type="button"
          aria-label="Next gallery image"
          onClick={() => swiper?.slideNext()}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>

      <Swiper
        className="about-gallery-slider !overflow-visible"
        modules={[Autoplay, Keyboard]}
        onSwiper={setSwiper}
        slidesPerView="auto"
        spaceBetween={14}
        loop
        speed={850}
        keyboard={{ enabled: true }}
        autoplay={{
          delay: 2450,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          560: { spaceBetween: 16 },
          1024: { spaceBetween: 18 },
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide
            key={`${image.src}-${index}`}
            style={{ width: image.portrait ? "min(74vw, 330px)" : "min(82vw, 510px)" }}
          >
            <button
              className="group block w-full overflow-hidden rounded-[16px] border border-[rgba(255,176,1,0.2)] bg-gbe-card p-0 shadow-[0_18px_46px_rgba(0,0,0,0.2)] transition duration-300 hover:-translate-y-1 hover:border-gbe-gold/60 hover:shadow-[0_24px_58px_rgba(0,0,0,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gbe-gold"
              type="button"
              data-preview-image
              data-preview-src={image.src}
              data-preview-srcset={image.srcSet}
              data-preview-alt={image.alt}
              data-preview-position={image.position}
              aria-label={`Preview ${image.alt}`}
            >
              <img
                className="h-[340px] w-full object-cover transition duration-500 group-hover:scale-[1.025] max-[1024px]:h-[310px] max-[560px]:h-[260px]"
                src={image.src}
                srcSet={image.srcSet}
                sizes={image.portrait ? "(max-width: 560px) 74vw, 330px" : "(max-width: 560px) 82vw, 510px"}
                alt={image.alt}
                width="900"
                height={image.portrait ? "1200" : "600"}
                loading="lazy"
                decoding="async"
                style={{ objectPosition: image.position ?? "50% 44%" }}
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

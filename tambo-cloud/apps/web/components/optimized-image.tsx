"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

type OptimizedImageProps = Omit<ImageProps, "onLoad"> & {
  lowQualitySrc?: string;
};

/**
 * Optimized image component with LQIP (Low Quality Image Placeholder)
 * Improves CLS (Cumulative Layout Shift) by using a low-quality placeholder
 * Improves LCP (Largest Contentful Paint) by optimizing image loading
 */
export function OptimizedImage({
  src,
  alt,
  className,
  lowQualitySrc,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="relative overflow-hidden"
      style={{ aspectRatio: `${props.width} / ${props.height}` }}
    >
      {/* Low quality placeholder */}
      {lowQualitySrc && (
        <Image
          src={lowQualitySrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full transition-opacity duration-500 ${
            isLoaded ? "opacity-0" : "opacity-100"
          } ${className || ""}`}
          fill
          sizes={props.sizes}
          priority={false}
          quality={10}
        />
      )}

      {/* Main image */}
      <Image
        src={src}
        alt={alt}
        className={`transition-opacity duration-500 ${
          isLoaded ? "opacity-100" : "opacity-0"
        } ${className || ""}`}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}

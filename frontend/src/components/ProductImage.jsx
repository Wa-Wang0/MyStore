/** Product image with a fallback if the file is missing. */
export default function ProductImage({ src, alt, className = "" }) {
  return (
    <img
      className={className}
      src={src || "/images/placeholder.svg"}
      alt={alt}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null; // avoid an endless loop
        event.currentTarget.src = "/images/placeholder.svg";
      }}
    />
  );
}

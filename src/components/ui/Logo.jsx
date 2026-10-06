export default function Logo({ className = '' }) {
  return (
    <span
      className={`inline-block font-script font-bold leading-[1.2] tracking-normal text-gradient select-none px-[0.12em] pt-[0.08em] pb-[0.16em] overflow-visible ${className}`}
      aria-label="LIT"
    >
      lit
    </span>
  )
}

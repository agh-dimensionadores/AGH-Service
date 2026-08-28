import { maquinaImageSrc, type MaquinaImageInput } from "@/lib/maquina-images";
import { machineThumbStyle } from "@/lib/utils";

export function MachineThumb({
  maquina,
  alt,
  className,
}: {
  maquina: MaquinaImageInput;
  alt: string;
  className?: string;
}) {
  const src = maquinaImageSrc(maquina);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={className} />
    );
  }
  return (
    <div
      className={className}
      style={machineThumbStyle(maquina.modelo ?? maquina.marca ?? "")}
    />
  );
}

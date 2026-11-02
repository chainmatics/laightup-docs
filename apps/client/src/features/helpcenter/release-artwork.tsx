import {
  IconCheck,
  IconFileTypePdf,
  IconTag,
  IconTypography,
  IconPhoto,
  IconSquare,
} from "@tabler/icons-react";
import { helpMessages } from "./content";
import styles from "./release-artwork.module.css";
const copy = helpMessages.updates.artwork;
const scenes: Record<string, "brief" | "tags" | "layers" | "variants"> = {
  "2026-10-29-produkt": "brief",
  "2026-10-22-produkt": "tags",
  "2026-10-12-produkt": "layers",
  "2026-10-04-produkt": "variants",
};
export default function ReleaseArtwork({ entryId }: { entryId: string }) {
  const scene = scenes[entryId];
  if (!scene) return null;
  if (scene === "brief")
    return (
      <figure className={styles.screenshot}>
        <img
          src="/helpcenter/images/product/easyflow-varianten.webp"
          alt={copy.screenshotAlt}
          width={1100}
          height={820}
          loading="lazy"
        />
        <figcaption>{copy.screenshotCaption}</figcaption>
      </figure>
    );
  return (
    <div
      className={styles.stage}
      data-scene={scene}
      role="img"
      aria-label={copy[scene].alt}
    >
      <div className={styles.caption} aria-hidden="true">
        <span>{copy[scene].label}</span>
        <span>laightup</span>
      </div>
      <div className={styles.composition} aria-hidden="true">
        {scene === "tags" && (
          <>
            <div className={styles.paperBack} />
            <div className={styles.paper}>
              <IconFileTypePdf size={35} stroke={1.1} />
              <div className={styles.paperLines}>
                <i />
                <i />
                <i />
              </div>
              <span>PDF</span>
            </div>
            <div className={styles.assetStack}>
              <div className={styles.asset}>
                <div className={styles.assetImage}>
                  <span />
                </div>
                <div className={styles.tag}>
                  <IconTag size={12} />
                  {copy.tags.campaign}
                </div>
              </div>
              <div className={styles.tagRow}>
                <span>{copy.tags.summer}</span>
                <span>{copy.tags.store}</span>
              </div>
            </div>
          </>
        )}
        {scene === "layers" && (
          <>
            <div className={styles.layerArt}>
              <div className={styles.layerBase} />
              <div className={styles.layerShape} />
              <div className={styles.layerType}>
                Aa<span>↗</span>
              </div>
            </div>
            <div className={styles.layerList}>
              {[
                [IconTypography, copy.layers.text],
                [IconPhoto, copy.layers.image],
                [IconSquare, copy.layers.shape],
              ].map(([Icon, label], i) => {
                const LayerIcon = Icon as typeof IconPhoto;
                return (
                  <div key={i}>
                    <LayerIcon size={17} stroke={1.4} />
                    <span>{label as string}</span>
                    <i />
                  </div>
                );
              })}
            </div>
          </>
        )}
        {scene === "variants" && (
          <>
            <div className={styles.variantWide}>
              <span className={styles.micro}>{copy.variants.design}</span>
              <strong>Aa.</strong>
              <span>16:9</span>
            </div>
            <div className={styles.variantTall}>
              <span className={styles.micro}>{copy.variants.design}</span>
              <strong>Aa.</strong>
              <span>9:16</span>
            </div>
            <div className={styles.default}>
              <IconCheck size={13} />
              {copy.variants.default}
            </div>
          </>
        )}
      </div>
      <span className={styles.footnote} aria-hidden="true">
        {copy.illustration}
      </span>
    </div>
  );
}

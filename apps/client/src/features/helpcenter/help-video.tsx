import styles from "./video.module.css";

export default function HelpVideo() {
  return (
    <section className={styles.videoSection} aria-labelledby="video-title">
      <div className={styles.heading}>
        <h2 id="video-title">Platzhalter in 32 Sekunden</h2>
        <span>ERKLÄRDEMO</span>
      </div>
      <video
        controls
        playsInline
        preload="none"
        poster="/helpcenter/videos/platzhalter-poster.jpg"
        aria-label="Erklärdemo: standortabhängige Platzhalter und Standardwerte"
        aria-describedby="video-description"
      >
        <source src="/helpcenter/videos/platzhalter.mp4" type="video/mp4" />
        <track
          kind="captions"
          src="/helpcenter/videos/platzhalter.de.vtt"
          srcLang="de"
          label="Deutsch"
        />
        Dein Browser unterstützt die Videowiedergabe nicht. Nutze den
        Video-Download oder den Textablauf darunter.
      </video>
      <p id="video-description">
        Ohne Ton, mit Texteinblendungen. Animierte Erklärung anhand der
        interaktiven Helpcenter-Demo mit fiktiven Preisen.
      </p>
      <div className={styles.resources}>
        <details>
          <summary>Ablauf als Text lesen</summary>
          <ol>
            <li>
              Der Platzhalter <code>{"{{angebot.preis}}"}</code> bleibt im
              Design gleich.
            </li>
            <li>Für Berlin greift die Bedingungszeile Berlin: 3,90 €.</li>
            <li>Für Köln greift die Bedingungszeile Köln: 4,50 €.</li>
            <li>
              Ohne passende Bedingungszeile gilt der Standardwert: 4,90 €.
            </li>
            <li>
              Die Werte werden zentral gepflegt; die Auswahl in dieser Demo
              verändert keine Produktdaten.
            </li>
          </ol>
        </details>
        <a href="/helpcenter/videos/platzhalter.mp4" download>
          Video herunterladen
        </a>
      </div>
    </section>
  );
}

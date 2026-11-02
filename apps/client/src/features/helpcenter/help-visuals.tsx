import { useState } from "react";
import {
  IconArrowRight,
  IconBuildingStore,
  IconCheck,
  IconDeviceTv,
  IconDownload,
  IconFileText,
  IconPlaylist,
  IconQrcode,
  IconShieldCheck,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import styles from "./experience.module.css";

export function NetworkGraphic() {
  return (
    <div className={styles.network}>
      <svg
        viewBox="0 0 620 410"
        role="img"
        aria-labelledby="network-title network-description"
      >
        <title id="network-title">Von einer Idee zu vielen Bildschirmen</title>
        <desc id="network-description">
          Ein Design wird über eine Playlist und einen Sendeplan an drei
          Displays verteilt. Die bewegten Linien veranschaulichen den Weg der
          Inhalte.
        </desc>
        <defs>
          <linearGradient id="screen-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop stopColor="#32008a" />
            <stop offset="1" stopColor="#503bd9" />
          </linearGradient>
          <pattern
            id="network-grid"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="#bfb1e2" opacity=".2" />
          </pattern>
        </defs>
        <rect width="620" height="410" fill="url(#network-grid)" />
        <circle
          cx="310"
          cy="207"
          r="170"
          fill="none"
          stroke="#bfb1e2"
          opacity=".15"
        />
        <circle
          cx="310"
          cy="207"
          r="119"
          fill="none"
          stroke="#bfb1e2"
          opacity=".18"
        />
        <g
          className={styles.connections}
          fill="none"
          stroke="#bda6f1"
          strokeWidth="1.5"
        >
          <path d="M162 201H240Q260 201 260 177V118H367" />
          <path d="M162 201H370" />
          <path d="M162 201H240Q260 201 260 226V300H381" />
        </g>
        <g
          className={styles.signal}
          fill="none"
          stroke="#04d9d9"
          strokeWidth="2.5"
          strokeDasharray="5 230"
        >
          <path d="M162 201H240Q260 201 260 177V118H367" />
          <path d="M162 201H370" />
          <path d="M162 201H240Q260 201 260 226V300H381" />
        </g>
        <g className={styles.sourceNode}>
          <rect x="38" y="139" width="125" height="132" rx="15" fill="#fff" />
          <rect x="52" y="153" width="97" height="71" rx="7" fill="#f0f0f5" />
          <path d="M63 209L84 182L100 198L115 178L139 209Z" fill="#b8a5ff" />
          <circle cx="71" cy="170" r="6" fill="#04d9d9" />
          <rect x="53" y="237" width="58" height="5" rx="2.5" fill="#32008a" />
          <rect x="53" y="249" width="81" height="4" rx="2" fill="#e4dfef" />
          <text
            x="100"
            y="299"
            textAnchor="middle"
            fill="#d5c8ee"
            fontSize="12"
          >
            Dein Design
          </text>
        </g>
        <g>
          <circle cx="260" cy="201" r="26" fill="#32008a" stroke="#8e72bf" />
          <path
            d="M250 192H269M250 200H269M250 208H260"
            stroke="#04d9d9"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <text
            x="260"
            y="250"
            textAnchor="middle"
            fill="#d5c8ee"
            fontSize="11"
          >
            Planen & verteilen
          </text>
        </g>
        <g className={styles.screenOne}>
          <rect
            x="367"
            y="65"
            width="174"
            height="104"
            rx="9"
            fill="#211037"
            stroke="#b7a2d1"
          />
          <rect
            x="375"
            y="73"
            width="158"
            height="88"
            rx="4"
            fill="url(#screen-gradient)"
          />
          <text x="389" y="97" fill="#eee7ff" fontSize="8" letterSpacing="1.5">
            HEUTE FÜR DICH
          </text>
          <text x="388" y="122" fill="white" fontSize="22" fontWeight="600">
            Neue Ideen.
          </text>
          <rect x="389" y="136" width="57" height="4" rx="2" fill="#04d9d9" />
          <path d="M449 169V179H470V169" fill="none" stroke="#b7a2d1" />
          <text x="454" y="48" textAnchor="middle" fill="#d5c8ee" fontSize="11">
            Berlin · Schaufenster
          </text>
        </g>
        <g className={styles.screenTwo}>
          <rect
            x="384"
            y="190"
            width="135"
            height="78"
            rx="8"
            fill="#211037"
            stroke="#b7a2d1"
          />
          <rect x="391" y="197" width="121" height="64" rx="3" fill="#04d9d9" />
          <text x="402" y="216" fill="#28005a" fontSize="7" letterSpacing="1">
            DEINE MARKE
          </text>
          <text x="402" y="238" fill="#28005a" fontSize="13" fontWeight="650">
            Überall präsent.
          </text>
          <text x="538" y="231" fill="#d5c8ee" fontSize="10">
            Köln
          </text>
        </g>
        <g className={styles.screenThree}>
          <rect
            x="393"
            y="293"
            width="95"
            height="69"
            rx="7"
            fill="#211037"
            stroke="#b7a2d1"
          />
          <rect
            x="400"
            y="300"
            width="81"
            height="55"
            rx="3"
            fill="url(#screen-gradient)"
          />
          <text x="410" y="321" fill="#04d9d9" fontSize="8">
            WILLKOMMEN
          </text>
          <rect
            x="410"
            y="333"
            width="48"
            height="3"
            rx="1.5"
            fill="#ffffff70"
          />
          <text x="503" y="333" fill="#d5c8ee" fontSize="10">
            Empfang
          </text>
        </g>
        <g transform="translate(45 41)">
          <rect
            width="128"
            height="27"
            rx="13.5"
            fill="#ffffff0d"
            stroke="#ffffff25"
          />
          <circle cx="16" cy="13.5" r="3" fill="#04d9d9" />
          <text x="27" y="17" fill="#e9def7" fontSize="10">
            Eine Idee. Viele Screens.
          </text>
        </g>
      </svg>
      <span className={styles.graphicCaption}>
        Prinzipdarstellung · Inhalte zentral planen, lokal ausspielen
      </span>
    </div>
  );
}

const visualSteps: Record<
  string,
  { label: string; detail: string; icon: typeof IconDeviceTv }[]
> = {
  installation: [
    {
      label: "Player wählen",
      detail: "Tizen · Android · Browser",
      icon: IconDownload,
    },
    {
      label: "Installation prüfen",
      detail: "Gerät & freigegebenes Paket",
      icon: IconShieldCheck,
    },
    {
      label: "Player starten",
      detail: "Kopplungscode bereithalten",
      icon: IconQrcode,
    },
  ],
  registrierung: [
    {
      label: "Player starten",
      detail: "Code am Display ablesen",
      icon: IconQrcode,
    },
    {
      label: "Gerät registrieren",
      detail: "Name, Standort, Ausrichtung",
      icon: IconDeviceTv,
    },
    {
      label: "Programm zuweisen",
      detail: "Veröffentlichte Version wählen",
      icon: IconCheck,
    },
  ],
  standort: [
    {
      label: "Standort",
      detail: "Adresse & Betriebszeiten",
      icon: IconBuildingStore,
    },
    { label: "Geräte", detail: "Name, Rotation & Gruppen", icon: IconDeviceTv },
    {
      label: "Programm",
      detail: "Passende Inhalte zuweisen",
      icon: IconPlaylist,
    },
  ],
  geraet: [
    { label: "Identifizieren", detail: "Name & Notizen", icon: IconDeviceTv },
    {
      label: "Organisieren",
      detail: "Standort & Gerätegruppen",
      icon: IconBuildingStore,
    },
    {
      label: "Kontrollieren",
      detail: "Ausrichtung & Wiedergabe",
      icon: IconCheck,
    },
  ],
  fluss: [
    { label: "Design", detail: "Was möchtest du zeigen?", icon: IconFileText },
    {
      label: "Playlist & Sendeplan",
      detail: "Wie und wann soll es laufen?",
      icon: IconPlaylist,
    },
    { label: "Display", detail: "Wo wird es sichtbar?", icon: IconDeviceTv },
  ],
  kreativ: [
    {
      label: "Idee beschreiben",
      detail: "Anlass, Zielgruppe & Botschaft",
      icon: IconSparkles,
    },
    {
      label: "Varianten vergleichen",
      detail: "Motiv & Format prüfen",
      icon: IconFileText,
    },
    {
      label: "Design übernehmen",
      detail: "Speichern & freigeben",
      icon: IconCheck,
    },
  ],
  verwaltung: [
    {
      label: "Arbeitsbereich",
      detail: "Gemeinsame Vorgaben",
      icon: IconBuildingStore,
    },
    {
      label: "Team & Rollen",
      detail: "Passende Zugriffsrechte",
      icon: IconUsers,
    },
    {
      label: "Freigaben",
      detail: "Kontrolliert veröffentlichen",
      icon: IconShieldCheck,
    },
  ],
};
const figureCaptions: Record<string, string> = {
  installation:
    "Wähle zuerst die Plattform. Nach der Installation folgen Registrierung und Standortzuordnung.",
  registrierung: "Kopplung und Programmzuweisung sind zwei getrennte Schritte.",
  standort:
    "Ein Standort kann mehrere Displays enthalten. Gerätegruppen ergänzen diese Zuordnung.",
  geraet: "Geräteangaben und Programmzuweisung werden getrennt gepflegt.",
  fluss:
    "Ein Design ist der ausspielbare Inhalt. Playlist und Sendeplan bestimmen seine Wiedergabe.",
  kreativ: "Prüfe Text, Motiv und Format, bevor du ein Ergebnis übernimmst.",
  verwaltung:
    "Gemeinsame Vorgaben gelten für den Arbeitsbereich; Zugriffsrechte regeln die Aufgaben im Team.",
  "platzhalter-setup":
    "Das Gruppenkürzel steht vor dem Punkt, das Spaltenkürzel dahinter. Teste Werte an einem konkreten Gerät.",
  zuweisung:
    "Nur veröffentlichte Playlists oder Sendepläne stehen für die Zuweisung zur Verfügung.",
  einladung:
    "Prüfe Arbeitsbereich, E-Mail-Adresse und Rollen vor dem Absenden.",
};
visualSteps["platzhalter-setup"] = [
  {
    label: "Gruppe anlegen",
    detail: "Zum Beispiel angebot",
    icon: IconPlaylist,
  },
  {
    label: "Werte definieren",
    detail: "Spalte preis + Standardwert",
    icon: IconFileText,
  },
  {
    label: "Am Gerät testen",
    detail: "Bedingung und Ausgabe prüfen",
    icon: IconDeviceTv,
  },
];
visualSteps.zuweisung = [
  {
    label: "Display auswählen",
    detail: "Name und Standort prüfen",
    icon: IconDeviceTv,
  },
  {
    label: "Programm wählen",
    detail: "Veröffentlichte Version",
    icon: IconPlaylist,
  },
  {
    label: "Ausgabe prüfen",
    detail: "Am tatsächlichen Bildschirm",
    icon: IconCheck,
  },
];
visualSteps.einladung = [
  {
    label: "Person erfassen",
    detail: "Name und E-Mail-Adresse",
    icon: IconUsers,
  },
  {
    label: "Rollen auswählen",
    detail: "Passend zur Aufgabe",
    icon: IconShieldCheck,
  },
  {
    label: "Einladung senden",
    detail: "Eintrag danach kontrollieren",
    icon: IconCheck,
  },
];
export function ArticleGraphic({ variant }: { variant: string }) {
  if (variant === "parameter") return <ParameterDemo />;
  if (variant === "platzhalter-regeln")
    return (
      <figure className={styles.rulesFigure}>
        <div className={styles.figureLabel}>WELCHER WERT GREIFT?</div>
        <div className={styles.ruleExample}>
          <span>Gerät in Berlin</span>
          <IconArrowRight size={17} />
          <span>Erste passende Zeile</span>
          <IconArrowRight size={17} />
          <strong>Preis: 3,90 €</strong>
        </div>
        <div className={styles.ruleExample}>
          <span>Wert dort leer?</span>
          <IconArrowRight size={17} />
          <span>Standardzeile</span>
          <IconArrowRight size={17} />
          <strong>Preis: 4,90 €</strong>
        </div>
        <figcaption>
          Beispielwerte: Eine leere Zelle übernimmt den Standardwert. Sie löscht
          ihn nicht.
        </figcaption>
      </figure>
    );
  if (variant === "systemwerte")
    return (
      <figure className={styles.systemFigure}>
        <div className={styles.figureLabel}>
          VOM STANDORTDATENSATZ INS DESIGN
        </div>
        <div>
          <span>
            <IconBuildingStore size={25} stroke={1.4} />
            Standort: Köln
          </span>
          <IconArrowRight size={17} />
          <code>{"{{system.location.city}}"}</code>
          <IconArrowRight size={17} />
          <strong>Köln</strong>
        </div>
        <figcaption>
          Beispiel: Die Stadt kommt aus dem Standort, dem das Display zugeordnet
          ist.
        </figcaption>
      </figure>
    );
  if (variant === "zeitplan")
    return (
      <figure className={styles.timelineFigure}>
        <div className={styles.figureLabel}>
          SO GREIFT DEIN PROGRAMM INEINANDER
        </div>
        <div className={styles.timeAxis}>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
        </div>
        <div className={styles.timelineTrack}>
          <span>Dauerprogramm</span>
          <div />
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className={styles.exclusiveTrack}>
          <span>Exklusivprogramm</span>
        </div>
        <div className={styles.timelineLegend}>
          <span>
            <i />
            Grundprogramm
          </span>
          <span>
            <i />
            Zeitweise Übernahme
          </span>
          <span>
            <i />
            Mix-In
          </span>
        </div>
        <figcaption>
          Beispiel: Eine Aktion ersetzt zeitweise das Grundprogramm. Mix-Ins
          können weiterhin eingestreut werden.
        </figcaption>
      </figure>
    );
  const steps = visualSteps[variant];
  if (!steps) return null;
  return (
    <figure className={styles.flowFigure}>
      <div className={styles.figureLabel}>DER ABLAUF AUF EINEN BLICK</div>
      <ol>
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.label}>
              <div className={styles.stepGlyph}>
                <Icon size={25} stroke={1.4} />
                <b>{i + 1}</b>
              </div>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
              {i < steps.length - 1 && (
                <IconArrowRight className={styles.flowArrow} size={18} />
              )}
            </li>
          );
        })}
      </ol>
      <figcaption>{figureCaptions[variant]}</figcaption>
    </figure>
  );
}
function ParameterDemo() {
  const [location, setLocation] = useState("berlin");
  const values = {
    berlin: {
      name: "Berlin",
      price: "3,90 €",
      source: "Bedingungszeile Berlin",
    },
    koeln: { name: "Köln", price: "4,50 €", source: "Bedingungszeile Köln" },
    standard: {
      name: "Anderer Standort",
      price: "4,90 €",
      source: "Standardzeile",
    },
  };
  const current = values[location];
  return (
    <figure className={styles.parameterDemo}>
      <div className={styles.figureLabel}>
        AUSPROBIEREN · EIN DESIGN, LOKALE WERTE
      </div>
      <div className={styles.parameterColumns}>
        <div className={styles.parameterControls}>
          <span>Wähle ein Beispielgerät</span>
          <div role="group" aria-label="Beispielstandort">
            {Object.entries(values).map(([key, value]) => (
              <button
                key={key}
                aria-pressed={location === key}
                onClick={() => setLocation(key)}
              >
                {value.name}
              </button>
            ))}
          </div>
          <code>{"{{angebot.preis}}"}</code>
          <p>
            Wert aus: <strong>{current.source}</strong>
          </p>
        </div>
        <div className={styles.parameterScreen} aria-live="polite">
          <span>HEUTE FRISCH</span>
          <strong key={location}>{current.price}</strong>
          <small>
            Dein Angebot in{" "}
            {current.name === "Anderer Standort"
              ? "weiteren Filialen"
              : current.name}
          </small>
          <span className={styles.screenStand} />
        </div>
      </div>
      <figcaption>
        Illustratives Beispiel mit fiktiven Preisen. Die Auswahl verändert nur
        diese Erklärung, keine Daten in deinem Arbeitsbereich.
      </figcaption>
    </figure>
  );
}

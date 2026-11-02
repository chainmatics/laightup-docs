import {
  IconBook2,
  IconBraces,
  IconCalendarEvent,
  IconDeviceDesktop,
  IconDownload,
  IconFolder,
  IconLifebuoy,
  IconMapPin,
  IconPlaylist,
  IconSettings,
  IconShieldCheck,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import styles from "./premium-cards.module.css";

export function CardArtwork({
  kind,
}: {
  kind: "site" | "campaign" | "local" | "team";
}) {
  return (
    <div className={styles.artwork} data-art={kind} aria-hidden="true">
      <svg viewBox="0 0 520 205" fill="none">
        {kind === "site" && (
          <>
            <path
              d="M37 28L134 38L224 12L330 36L359 175L258 190L156 168L60 189Z"
              fill="#fff"
              stroke="#ded9e7"
            />
            <path
              d="M134 38L156 168M224 12L258 190M54 104L345 106M85 38L300 172"
              stroke="#eeeaf3"
              strokeWidth="5"
            />
            <path
              d="M97 105Q142 64 184 95T277 88"
              stroke="#b9a9dd"
              strokeWidth="2"
              strokeDasharray="4 5"
            />
            <g transform="translate(83 74)">
              <path
                d="M14 0C6 0 0 6 0 14C0 25 14 38 14 38C14 38 28 25 28 14C28 6 22 0 14 0Z"
                fill="#32008a"
              />
              <circle cx="14" cy="14" r="5" fill="#04d9d9" />
            </g>
            <g transform="translate(211 115)">
              <path
                d="M11 0C5 0 0 5 0 11C0 20 11 30 11 30C11 30 22 20 22 11C22 5 17 0 11 0Z"
                fill="#503bd9"
              />
              <circle cx="11" cy="11" r="4" fill="#fff" />
            </g>
            <g className={styles.artFloat}>
              <rect
                x="322"
                y="43"
                width="139"
                height="111"
                rx="10"
                fill="#28005a"
              />
              <rect
                x="331"
                y="52"
                width="121"
                height="91"
                rx="4"
                fill="#32008a"
              />
              <text
                x="347"
                y="75"
                fill="#ded0f5"
                fontSize="8"
                letterSpacing="1.4"
              >
                DISPLAY VERBINDEN
              </text>
              <rect
                x="347"
                y="89"
                width="89"
                height="32"
                rx="5"
                fill="#ffffff10"
                stroke="#ffffff30"
              />
              <text
                x="392"
                y="110"
                fill="#04d9d9"
                fontSize="20"
                textAnchor="middle"
                letterSpacing="4"
              >
                AB·12
              </text>
              <path
                d="M384 154V164H404V154M370 165H417"
                stroke="#28005a"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
            <circle cx="287" cy="65" r="4" fill="#04d9d9" />
            <circle cx="287" cy="65" r="10" stroke="#04d9d9" opacity=".3" />
          </>
        )}
        {kind === "campaign" && (
          <>
            <rect
              x="57"
              y="31"
              width="199"
              height="129"
              rx="9"
              fill="#fff"
              stroke="#d7d1e2"
            />
            <rect
              x="66"
              y="40"
              width="181"
              height="111"
              rx="4"
              fill="#32008a"
            />
            <circle cx="211" cy="72" r="37" fill="#503bd9" />
            <path d="M168 151Q180 92 247 91V151Z" fill="#04d9d9" />
            <text x="82" y="70" fill="#d6c8ef" fontSize="8" letterSpacing="1.4">
              DIESE WOCHE
            </text>
            <text x="81" y="99" fill="#fff" fontSize="23" fontWeight="550">
              Dein Angebot.
            </text>
            <path
              d="M82 117H142"
              stroke="#04d9d9"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M145 160V168H172V160M129 169H188"
              stroke="#b5a6c9"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <g className={styles.artFloat}>
              <rect
                x="283"
                y="61"
                width="185"
                height="100"
                rx="10"
                fill="#fff"
                stroke="#d7d1e2"
              />
              <text
                x="297"
                y="82"
                fill="#867592"
                fontSize="8"
                letterSpacing="1"
              >
                ZEITFENSTER
              </text>
              <path
                d="M298 100H452M298 119H452M298 137H452"
                stroke="#eeeaf3"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <rect
                x="322"
                y="95"
                width="92"
                height="11"
                rx="3"
                fill="#503bd9"
              />
              <rect
                x="360"
                y="114"
                width="54"
                height="11"
                rx="3"
                fill="#28005a"
              />
              <path d="M399 88V149" stroke="#05b9c8" strokeWidth="2" />
              <circle cx="399" cy="88" r="3" fill="#05b9c8" />
            </g>
            <path d="M256 99H276" stroke="#bcaed6" strokeWidth="1.5" />
            <path
              d="M271 94L277 99L271 104"
              stroke="#bcaed6"
              strokeWidth="1.5"
            />
          </>
        )}
        {kind === "local" && (
          <>
            <rect
              x="34"
              y="66"
              width="190"
              height="63"
              rx="10"
              fill="#fff"
              stroke="#d7d1e2"
            />
            <text x="52" y="90" fill="#8e7c9e" fontSize="8" letterSpacing="1">
              EIN PLATZHALTER IM DESIGN
            </text>
            <text
              x="51"
              y="111"
              fill="#32008a"
              fontSize="15"
              fontFamily="monospace"
            >
              {"{{angebot.preis}}"}
            </text>
            <path
              d="M225 98H267V53H298M267 98V153H298"
              stroke="#a392be"
              strokeWidth="1.5"
            />
            <circle cx="267" cy="98" r="4" fill="#04d9d9" />
            <g className={styles.artFloat}>
              <rect
                x="298"
                y="20"
                width="177"
                height="74"
                rx="8"
                fill="#28005a"
              />
              <text
                x="313"
                y="42"
                fill="#cdb9eb"
                fontSize="8"
                letterSpacing="1.3"
              >
                BERLIN
              </text>
              <text
                x="313"
                y="76"
                fill="#04d9d9"
                fontSize="30"
                fontWeight="500"
              >
                3,90 €
              </text>
              <rect
                x="298"
                y="113"
                width="177"
                height="74"
                rx="8"
                fill="#fff"
                stroke="#d7d1e2"
              />
              <text
                x="313"
                y="135"
                fill="#8e7c9e"
                fontSize="8"
                letterSpacing="1.3"
              >
                KÖLN
              </text>
              <text
                x="313"
                y="169"
                fill="#32008a"
                fontSize="30"
                fontWeight="500"
              >
                4,50 €
              </text>
            </g>
          </>
        )}
        {kind === "team" && (
          <>
            <path
              d="M260 59V92M260 92H115V121M260 92V121M260 92H405V121"
              stroke="#c4b5d7"
              strokeWidth="1.5"
            />
            <rect
              x="182"
              y="19"
              width="156"
              height="43"
              rx="8"
              fill="#28005a"
            />
            <circle cx="201" cy="40" r="4" fill="#04d9d9" />
            <text x="216" y="44" fill="#fff" fontSize="11">
              Dein Arbeitsbereich
            </text>
            <g className={styles.artFloat}>
              <rect
                x="47"
                y="121"
                width="136"
                height="58"
                rx="8"
                fill="#fff"
                stroke="#d7d1e2"
              />
              <circle cx="69" cy="148" r="11" fill="#ebe5f6" />
              <path
                d="M65 150L68 153L74 145"
                stroke="#503bd9"
                strokeWidth="1.5"
              />
              <text x="88" y="152" fill="#49385d" fontSize="10">
                Administration
              </text>
            </g>
            <rect
              x="192"
              y="121"
              width="136"
              height="58"
              rx="8"
              fill="#fff"
              stroke="#d7d1e2"
            />
            <circle cx="214" cy="148" r="11" fill="#e1f7f6" />
            <path
              d="M210 150L213 153L219 145"
              stroke="#287b83"
              strokeWidth="1.5"
            />
            <text x="233" y="152" fill="#49385d" fontSize="10">
              Redaktion
            </text>
            <rect
              x="337"
              y="121"
              width="136"
              height="58"
              rx="8"
              fill="#fff"
              stroke="#d7d1e2"
            />
            <circle cx="359" cy="148" r="11" fill="#ebe5f6" />
            <path
              d="M355 150L358 153L364 145"
              stroke="#503bd9"
              strokeWidth="1.5"
            />
            <text x="378" y="152" fill="#49385d" fontSize="10">
              Freigabe
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

const topicIcons = {
  start: IconBook2,
  installation: IconDownload,
  inhalte: IconFolder,
  ki: IconSparkles,
  playlists: IconPlaylist,
  sendeplaene: IconCalendarEvent,
  displays: IconDeviceDesktop,
  parameter: IconBraces,
  freigaben: IconShieldCheck,
  hilfe: IconLifebuoy,
  verwaltung: IconUsers,
  einstellungen: IconSettings,
};
export function TopicArtwork({ topic }: { topic: string }) {
  const Icon = topicIcons[topic] ?? IconBook2;
  const panel = "var(--art-panel)";
  const line = "var(--art-stroke)";
  const ink = "var(--art-solid)";
  return (
    <div className={styles.topicArtwork} data-topic={topic} aria-hidden="true">
      <svg className={styles.topicVector} viewBox="0 0 260 110" fill="none">
        {topic === "parameter" ? (
          <>
            <rect
              x="32"
              y="35"
              width="76"
              height="40"
              rx="7"
              fill={panel}
              stroke={line}
            />
            <Icon x={54} y={40} width={31} height={31} color={ink} />
            <path d="M109 55H139V29H169M139 55V82H169" stroke={line} />
            <rect
              x="170"
              y="15"
              width="59"
              height="29"
              rx="5"
              fill={panel}
              stroke={line}
            />
            <rect
              x="170"
              y="68"
              width="59"
              height="29"
              rx="5"
              fill={panel}
              stroke={line}
            />
            <path
              d="M183 29H214M183 83H204"
              stroke="#04d9d9"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        ) : topic === "sendeplaene" ? (
          <>
            <path
              d="M40 26H221M40 49H221M40 72H221M40 95H221"
              stroke={line}
              opacity=".4"
            />
            <rect
              x="47"
              y="31"
              width="162"
              height="13"
              rx="3"
              fill="#503bd9"
              stroke={line}
            />
            <rect
              x="102"
              y="54"
              width="62"
              height="13"
              rx="3"
              fill={panel}
              stroke={line}
            />
            <rect x="64" y="77" width="12" height="13" rx="3" fill="#04d9d9" />
            <rect x="117" y="77" width="12" height="13" rx="3" fill="#04d9d9" />
            <rect x="170" y="77" width="12" height="13" rx="3" fill="#04d9d9" />
            <path d="M145 18V99" stroke="#04d9d9" strokeWidth="1.3" />
            <circle cx="145" cy="18" r="3" fill="#04d9d9" />
          </>
        ) : topic === "displays" || topic === "installation" ? (
          <>
            <rect
              x="82"
              y="24"
              width="128"
              height="69"
              rx="7"
              fill={panel}
              stroke={line}
            />
            <rect x="89" y="31" width="114" height="54" rx="3" fill="#e9e3f5" />
            <Icon x={130} y={40} width={31} height={31} color={ink} />
            <path
              d="M137 94V99H155V94M124 100H168"
              stroke={line}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="40"
              y="41"
              width="48"
              height="39"
              rx="7"
              fill={panel}
              stroke={line}
            />
            <IconMapPin x={54} y={49} width={20} height={20} color="#05b9c8" />
            <path
              d="M60 25L67 19M45 34H36"
              stroke="#b9a6d3"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        ) : topic === "verwaltung" || topic === "freigaben" ? (
          <>
            <path d="M130 38V57H68V70M130 57V70M130 57H192V70" stroke={line} />
            <rect
              x="111"
              y="10"
              width="38"
              height="32"
              rx="7"
              fill={panel}
              stroke={line}
            />
            <Icon x={118} y={14} width={24} height={24} color={ink} />
            {[68, 130, 192].map((x, i) => (
              <g key={x}>
                <circle cx={x} cy="84" r="16" fill={panel} stroke={line} />
                <circle cx={x} cy="80" r="4" fill={i === 1 ? "#05b9c8" : ink} />
                <path
                  d={`M${x - 7} 92Q${x} 83 ${x + 7} 92`}
                  stroke={i === 1 ? "#05b9c8" : ink}
                  strokeWidth="2"
                />
              </g>
            ))}
          </>
        ) : topic === "einstellungen" ? (
          <>
            <rect
              x="62"
              y="16"
              width="137"
              height="79"
              rx="8"
              fill={panel}
              stroke={line}
            />
            {[36, 55, 74].map((y, i) => (
              <g key={y}>
                <path d={`M82 ${y}H179`} stroke={line} strokeWidth="2" />
                <circle
                  cx={[110, 150, 125][i]}
                  cy={y}
                  r="6"
                  fill={i === 1 ? "#04d9d9" : "#503bd9"}
                />
              </g>
            ))}
          </>
        ) : topic === "playlists" ? (
          <>
            <path d="M49 55H214" stroke={line} />
            {[43, 100, 157].map((x, i) => (
              <g key={x}>
                <rect
                  x={x}
                  y={i === 1 ? 22 : 32}
                  width="49"
                  height="58"
                  rx="6"
                  fill={panel}
                  stroke={line}
                />
                <path
                  d={`M${x + 20} ${i === 1 ? 43 : 53}L${x + 31} ${i === 1 ? 51 : 61}L${x + 20} ${i === 1 ? 59 : 69}Z`}
                  fill={i === 1 ? "#05b9c8" : ink}
                />
              </g>
            ))}
          </>
        ) : (
          <>
            <rect
              x="61"
              y="24"
              width="135"
              height="69"
              rx="8"
              fill={panel}
              stroke={line}
            />
            <rect
              x="49"
              y="15"
              width="135"
              height="69"
              rx="8"
              fill={panel}
              stroke={line}
            />
            <Icon x={67} y={31} width={33} height={33} color={ink} />
            <path
              d="M115 37H167M115 48H155M115 59H161"
              stroke={line}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="202" cy="28" r="4" fill="#04d9d9" />
          </>
        )}
      </svg>
    </div>
  );
}

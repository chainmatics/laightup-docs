import { useState } from "react";
import { Popover } from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconSearch,
} from "@tabler/icons-react";
import {
  findLanguages,
  languageAvailable,
  type HelpLanguage,
} from "./languages";
import { helpMessages, formatHelpMessage } from "./content";
import styles from "./language-switcher.module.css";

const copy = helpMessages.languagePicker;
const groups = [
  { id: "europe", label: copy.europe },
  { id: "asia", label: copy.asia },
];

export default function LanguageSwitcher({
  dark,
  motionPaused,
}: {
  dark: boolean;
  motionPaused: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const searching = Boolean(query.trim());
  const matches = findLanguages(query);
  const groupLanguages = (id: string) => findLanguages("", id);
  const choose = (language: HelpLanguage) => {
    if (languageAvailable(language.code)) {
      setOpened(false);
      return;
    }
    try {
      localStorage.setItem("laightup-help-preferred-language", language.code);
    } catch {
      /* Optional preference. */
    }
    setNotice(formatHelpMessage(copy.notice, { language: language.name }));
  };
  const languageRow = (language: HelpLanguage) => (
    <button
      key={language.code}
      className={styles.language}
      data-language={language.code}
      onClick={() => choose(language)}
      aria-label={formatHelpMessage(
        languageAvailable(language.code) ? copy.select : copy.reserve,
        { language: language.name },
      )}
      title={languageAvailable(language.code) ? copy.current : copy.pending}
    >
      <span className={styles.flag} aria-hidden="true">
        {language.flag}
      </span>
      <span className={styles.label}>
        <span>{language.name}</span>
        <small lang={language.code}>{language.nativeName}</small>
      </span>
      {languageAvailable(language.code) ? (
        <IconCheck size={13} className={styles.check} />
      ) : (
        <span className={styles.pending} aria-label={copy.pending} />
      )}
    </button>
  );
  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      offset={9}
      width={240}
      withinPortal
      withRoles={false}
      returnFocus
      closeOnEscape
      transitionProps={{ duration: motionPaused ? 0 : 90 }}
      classNames={{ dropdown: styles.dropdown }}
    >
      <Popover.Target>
        <button
          className={styles.trigger}
          aria-label={copy.trigger}
          aria-expanded={opened}
          aria-controls={opened ? "help-language-dropdown" : undefined}
          onClick={() => {
            setOpened(!opened);
            setQuery("");
            setActive(null);
            setNotice("");
          }}
        >
          <span aria-hidden="true">🇩🇪</span>
          <span>DE</span>
          <IconChevronDown size={12} />
        </button>
      </Popover.Target>
      <Popover.Dropdown
        id="help-language-dropdown"
        role="region"
        aria-label={copy.title}
      >
        <div className={styles.surface} data-theme={dark ? "dark" : "light"}>
          <div className={styles.search}>
            <IconSearch size={15} aria-hidden="true" />
            <input
              data-autofocus
              type="search"
              aria-label={copy.searchLabel}
              placeholder={copy.compactSearch}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(null);
                setNotice("");
              }}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.nativeEvent.isComposing &&
                  searching &&
                  matches[0]
                )
                  choose(matches[0]);
              }}
            />
          </div>
          {searching ? (
            <div className={styles.matches}>
              {matches.map(languageRow)}
              {!matches.length && (
                <p className={styles.empty}>{copy.noMatches}</p>
              )}
            </div>
          ) : (
            <div
              className={styles.regions}
              onMouseLeave={() => setActive(null)}
            >
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={styles.group}
                  onMouseEnter={() => {
                    if (
                      window.matchMedia("(hover: hover) and (min-width: 601px)")
                        .matches
                    )
                      setActive(group.id);
                  }}
                >
                  <button
                    className={styles.region}
                    aria-expanded={active === group.id}
                    aria-controls={`language-region-${group.id}`}
                    onFocus={() => {
                      if (window.matchMedia("(min-width: 601px)").matches)
                        setActive(group.id);
                    }}
                    onClick={() => setActive(group.id)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight") {
                        event.preventDefault();
                        setActive(group.id);
                        document
                          .getElementById(`language-region-${group.id}`)
                          ?.querySelector<HTMLButtonElement>(
                            "button[data-language]",
                          )
                          ?.focus();
                      }
                    }}
                  >
                    <span>{group.label}</span>
                    <IconChevronRight size={13} />
                  </button>
                  {active === group.id && (
                    <div
                      id={`language-region-${group.id}`}
                      className={styles.submenu}
                      role="group"
                      aria-label={group.label}
                      onKeyDown={(event) => {
                        if (event.key === "ArrowLeft") {
                          event.preventDefault();
                          (
                            event.currentTarget
                              .previousElementSibling as HTMLButtonElement
                          )?.focus();
                          setActive(null);
                        }
                      }}
                    >
                      <button
                        className={styles.back}
                        onClick={() => setActive(null)}
                      >
                        <IconChevronLeft size={13} />
                        {copy.backToRegions}
                      </button>
                      {groupLanguages(group.id).map(languageRow)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {notice && (
            <p className={styles.notice} role="status">
              {notice}
            </p>
          )}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}

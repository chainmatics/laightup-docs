import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { diffLines } from "diff";
import {
  GlassButton,
  GlassCard,
  GlassInput,
  GlassSelect,
  GlassTextarea,
} from "./laightup-ui";
import styles from "./team-workflow.module.css";
import type { EditorDocument } from "../editor/editor-types";
const roleNames = {
  none: "Kein Zugriff",
  reader: "Leser",
  commenter: "Kommentator",
  editor: "Redakteur",
  reviewer: "Prüfer",
  creator: "Strukturverantwortlicher",
  admin: "Administrator",
};
type Access = {
  mode: "local" | "session";
  token: string;
  actor: { id: string; name: string; role: string };
  capabilities: string[];
  revision: string;
  members: {
    id: string;
    name: string;
    email: string;
    inherited: boolean;
    role: string;
  }[];
};
type Proposal = {
  id: string;
  title: string;
  pageId: string;
  kind: string;
  at: string;
  status: string;
  version: number;
  author: { id: string; name: string };
};
type Detail = Proposal & {
  document: EditorDocument;
  before: EditorDocument;
  stale: boolean;
  localSelfReview: boolean;
  comments: { actor: { name: string }; at: string; text: string }[];
  decision?: { actor: { name: string }; at: string; comment: string };
};
const statuses = {
  pending: "Wartet auf Prüfung",
  applying: "Übernahme prüfen",
  approved: "Freigegeben",
  rejected: "Zur Überarbeitung",
};
const actions = {
  "review.submitted": "Vorschlag eingereicht",
  "review.applying": "Übernahme begonnen",
  "review.approve": "Vorschlag freigegeben",
  "review.reject": "Überarbeitung angefordert",
  "review.comment": "Kommentar ergänzt",
  "review.failed": "Übernahme fehlgeschlagen",
};
const date = (value: string) =>
  new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
const text = (d: EditorDocument) =>
  `# ${d.title}\n\n${d.description}\n\n${d.kind === "update" ? d.changes.map((c) => `## ${c.title}\n\n${c.description}`).join("\n\n") : d.body}`;
async function api<T>(
  route: string,
  token?: string,
  value?: unknown,
): Promise<T> {
  const response = await fetch(
    `/__help-editor/${route}`,
    value === undefined
      ? { cache: "no-store" }
      : {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Help-Editor-Token": token!,
          },
          body: JSON.stringify(value),
        },
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Die Aktion ist fehlgeschlagen.");
  return data;
}
export default function TeamWorkflow({ view }: { view: "access" | "reviews" }) {
  const [access, setAccess] = useState<Access | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [list, setList] = useState<{
    requests: Proposal[];
    audit: {
      id: string;
      at: string;
      actor: { name: string };
      action: string;
      target: string;
    }[];
  }>({ requests: [], audit: [] });
  const [detail, setDetail] = useState<Detail | null>(null),
    [comment, setComment] = useState(""),
    [filter, setFilter] = useState(""),
    [status, setStatus] = useState("pending");
  const load = async () => {
    const [a, l] = await Promise.all([
      api<Access>("access"),
      api<typeof list>("reviews"),
    ]);
    setAccess(a);
    setList(l);
  };
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [view]);
  async function select(id: string) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      setDetail(await api<Detail>(`review?id=${encodeURIComponent(id)}`));
      setComment("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function decide(action: string) {
    if (!detail || !access) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = await api<Detail>("review-decide", access.token, {
        id: detail.id,
        version: detail.version,
        action,
        comment,
      });
      setDetail(next);
      setComment("");
      await load();
      setNotice(
        action === "approve"
          ? "Freigegeben. Die lokale Dokumentation ist aktualisiert."
          : action === "reject"
            ? "Zur Überarbeitung zurückgegeben."
            : "Kommentar gespeichert.",
      );
    } catch (e) {
      await select(detail.id);
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function changeRole(id: string, role: string) {
    setBusy(true);
    setError("");
    try {
      setAccess(
        await api<Access>("member", access!.token, {
          id,
          role,
          revision: access!.revision,
        }),
      );
      setNotice("Teamrechte gespeichert.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (!response.ok && response.status !== 401)
        throw new Error(
          "Die Abmeldung ist fehlgeschlagen. Bitte erneut versuchen.",
        );
      window.location.assign(
        `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  const canReview = access?.capabilities.includes("review"),
    canComment = access?.capabilities.includes("comment");
  return (
    <div className={styles.root}>
      {error && (
        <p role="alert" className={styles.error}>
          {error}{" "}
          <Link
            to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
          >
            Zur Anmeldung
          </Link>
        </p>
      )}
      {notice && (
        <p role="status" className={styles.notice}>
          {notice}
        </p>
      )}
      {!access && !error && (
        <p role="status">Team und Vorschläge werden geladen …</p>
      )}
      {access && view === "access" && (
        <>
          <GlassCard className={styles.card}>
            <h2>Zugriff auf die Redaktion</h2>
            <p>
              {access.mode === "local"
                ? "Lokale Arbeitsumgebung · nur auf diesem Rechner"
                : "Workspace-Anmeldung · Sitzung wird bei jeder Anfrage geprüft"}
            </p>
            <div className={styles.identity}>
              <strong>{access.actor.name}</strong>
              <span>{roleNames[access.actor.role]}</span>
            </div>
            <p>
              {access.mode === "local"
                ? "Hier arbeitet eine lokale Redaktion. Teammitglieder werden erst nach Anbindung des Workspace-Backends angezeigt. Eigene Vorschläge können lokal zu Testzwecken freigegeben werden."
                : "Workspace-Administratoren behalten Administratorrechte. Andere Mitglieder erhalten ausschließlich die unten zugewiesenen Rechte. Eigene Vorschläge benötigen die Freigabe einer anderen Person."}
            </p>
            <p>
              Der veröffentlichte Hilfebereich ist weiterhin öffentlich
              zugänglich.
            </p>
            {access.mode === "session" && (
              <GlassButton
                variant="secondary"
                disabled={busy}
                onClick={signOut}
              >
                Abmelden
              </GlassButton>
            )}
          </GlassCard>
          {access.mode === "session" &&
            access.capabilities.includes("members") && (
              <GlassCard className={styles.card}>
                <h2>Workspace-Mitglieder</h2>
                <p>
                  Änderungen werden unmittelbar gespeichert. „Kein Zugriff“
                  sperrt die Redaktion, nicht die öffentliche Dokumentation.
                </p>
                <div className={styles.members}>
                  {access.members.map((member) => (
                    <div key={member.id}>
                      <span>
                        <strong>{member.name}</strong>
                        <small>
                          {member.email}
                          {member.inherited
                            ? " · Workspace-Administration"
                            : ""}
                        </small>
                      </span>
                      <GlassSelect
                        aria-label={`Rolle für ${member.name}`}
                        value={member.role}
                        options={Object.entries(roleNames).map(
                          ([value, label]) => ({ value, label }),
                        )}
                        onValueChange={(role) => changeRole(member.id, role)}
                        disabled={
                          busy ||
                          member.inherited ||
                          member.id === access.actor.id
                        }
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          <GlassCard className={styles.card}>
            <h2>Rollen und Aufgaben</h2>
            <p>Jede Rolle umfasst die Rechte der darunterliegenden Rollen.</p>
            <dl className={styles.roles}>
              {[
                [
                  "admin",
                  "Website-Einstellungen, Gestaltung und Mitglieder verwalten",
                ],
                ["creator", "Themen und Seitenstruktur verwalten"],
                [
                  "reviewer",
                  "Änderungsvorschläge prüfen, freigeben und zurückgeben",
                ],
                [
                  "editor",
                  "Eigene Entwürfe bearbeiten und Vorschläge einreichen",
                ],
                ["commenter", "Vorschläge lesen und kommentieren"],
                ["reader", "Redaktion und Vorschläge lesen"],
              ].map(([role, scope]) => (
                <div key={role}>
                  <dt>{roleNames[role]}</dt>
                  <dd>{scope}</dd>
                </div>
              ))}
            </dl>
          </GlassCard>
          {list.audit.length > 0 && (
            <GlassCard className={styles.card}>
              <h2>Letzte Aktivitäten</h2>
              <ul className={styles.activity}>
                {list.audit.map((event) => (
                  <li key={event.id}>
                    <span>
                      {actions[event.action] ??
                        (event.action.startsWith("member.")
                          ? `Rolle geändert: ${roleNames[event.action.slice(7)]}`
                          : event.action)}{" "}
                      · {event.actor.name}
                    </span>
                    <time dateTime={event.at}>{date(event.at)}</time>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </>
      )}
      {access && view === "reviews" && (
        <>
          <p className={styles.intro}>
            Vorschläge bewahren den eingereichten Stand. Spätere
            Entwurfsänderungen verändern die Prüfung nicht.
          </p>
          <div className={styles.filters}>
            <GlassInput
              aria-label="Vorschläge durchsuchen"
              placeholder="Titel oder Autor suchen …"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <GlassSelect
              aria-label="Vorschlagsstatus"
              value={status}
              onValueChange={setStatus}
              options={[
                { value: "pending", label: "Offene Vorschläge" },
                { value: "all", label: "Alle Vorschläge" },
                { value: "approved", label: "Freigegeben" },
                { value: "rejected", label: "Zur Überarbeitung" },
              ]}
            />
          </div>
          <div className={styles.layout}>
            <div className={styles.proposals}>
              {list.requests
                .filter(
                  (r) =>
                    (status === "all" ||
                      r.status === status ||
                      (status === "pending" && r.status === "applying")) &&
                    `${r.title} ${r.author.name}`
                      .toLocaleLowerCase()
                      .includes(filter.toLocaleLowerCase()),
                )
                .reverse()
                .map((r) => (
                  <button
                    className={detail?.id === r.id ? styles.selected : ""}
                    key={r.id}
                    onClick={() => select(r.id)}
                    aria-pressed={detail?.id === r.id}
                  >
                    <strong>{r.title}</strong>
                    <span>
                      {statuses[r.status]} · {r.author.name}
                    </span>
                    <time dateTime={r.at}>{date(r.at)}</time>
                  </button>
                ))}
              {!list.requests.some(
                (r) =>
                  (status === "all" ||
                    r.status === status ||
                    (status === "pending" && r.status === "applying")) &&
                  `${r.title} ${r.author.name}`
                    .toLocaleLowerCase()
                    .includes(filter.toLocaleLowerCase()),
              ) && (
                <GlassCard className={styles.card}>
                  <h2>Keine passenden Vorschläge</h2>
                  <p>
                    Reiche eine bearbeitete Seite in der Redaktion über „Zur
                    Prüfung einreichen“ ein.
                  </p>
                  <Link to="/help/bearbeiten">Redaktion öffnen</Link>
                </GlassCard>
              )}
            </div>
            <div>
              {detail ? (
                <GlassCard className={styles.card}>
                  <header className={styles.detailHead}>
                    <h2>{detail.document.title}</h2>
                    <span>{statuses[detail.status]}</span>
                  </header>
                  <p>
                    {detail.author.name} · {date(detail.at)}
                  </p>
                  <Link
                    to={`/help/bearbeiten?typ=${detail.document.kind}&seite=${detail.document.id}`}
                  >
                    Seite in der Redaktion öffnen
                  </Link>
                  {detail.stale && detail.status === "pending" && (
                    <p role="status" className={styles.error}>
                      Die Quelle wurde seit dem Einreichen geändert. Dieser
                      Vorschlag kann nicht freigegeben werden. Gib ihn zur
                      Überarbeitung zurück; danach kann ein neuer Stand
                      eingereicht werden.
                    </p>
                  )}
                  {detail.status === "applying" && (
                    <p className={styles.error}>
                      Eine Übernahme wurde begonnen, aber noch nicht
                      abgeschlossen. Prüfe Quellen und Sicherungsstand, bevor
                      der Status durch die Administration wiederhergestellt
                      wird.
                    </p>
                  )}
                  <h3>Eingereichte Änderungen</h3>
                  <p className={styles.legend}>
                    <span>− Entfernt</span>
                    <span>+ Hinzugefügt</span>
                  </p>
                  <div className={styles.diff} aria-label="Änderungsvergleich">
                    {diffLines(text(detail.before), text(detail.document)).map(
                      (part, i) =>
                        !part.added &&
                        !part.removed &&
                        part.value.split("\n").length > 12 ? (
                          <details key={i} className={styles.unchanged}>
                            <summary>
                              {part.value.split("\n").length} unveränderte
                              Zeilen anzeigen
                            </summary>
                            <pre>{part.value}</pre>
                          </details>
                        ) : (
                          <pre
                            key={i}
                            className={
                              part.added
                                ? styles.added
                                : part.removed
                                  ? styles.removed
                                  : ""
                            }
                          >
                            {part.value.split("\n").map((line, index) => (
                              <span key={index}>
                                {part.added ? "+ " : part.removed ? "− " : "  "}
                                {line}
                                {"\n"}
                              </span>
                            ))}
                          </pre>
                        ),
                    )}
                  </div>
                  {detail.before.group !== detail.document.group && (
                    <p>
                      Themenwechsel: {detail.before.group} →{" "}
                      {detail.document.group}
                    </p>
                  )}
                  <details className={styles.metadata}>
                    <summary>Weitere Seiteneinstellungen vergleichen</summary>
                    <table>
                      <thead>
                        <tr>
                          <th>Einstellung</th>
                          <th>Bisher</th>
                          <th>Vorschlag</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          [
                            "Zielgruppe",
                            detail.before.audience,
                            detail.document.audience,
                          ],
                          [
                            "Lernziel",
                            detail.before.outcome,
                            detail.document.outcome,
                          ],
                          [
                            "Suchbegriffe",
                            detail.before.tags.join(", "),
                            detail.document.tags.join(", "),
                          ],
                        ].map(([label, before, after]) => (
                          <tr key={label}>
                            <th scope="row">{label}</th>
                            <td>{before || "–"}</td>
                            <td>{after || "–"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </details>
                  <h3>Rückmeldungen</h3>
                  {detail.comments.length === 0 ? (
                    <p>Noch keine Kommentare.</p>
                  ) : (
                    detail.comments.map((c, i) => (
                      <blockquote key={i}>
                        <p>{c.text}</p>
                        <footer>
                          {c.actor.name} · {date(c.at)}
                        </footer>
                      </blockquote>
                    ))
                  )}
                  {detail.decision && (
                    <p className={styles.decision}>
                      {detail.decision.actor.name} · {date(detail.decision.at)}
                      {detail.decision.comment && (
                        <span>{detail.decision.comment}</span>
                      )}
                    </p>
                  )}
                  {detail.status === "pending" && canComment && (
                    <>
                      <label>
                        Kommentar oder Begründung
                        <GlassTextarea
                          aria-label="Kommentar oder Begründung"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          maxLength={5000}
                        />
                      </label>
                      <div className={styles.actions}>
                        <GlassButton
                          variant="secondary"
                          disabled={busy || !comment.trim()}
                          onClick={() => decide("comment")}
                        >
                          Kommentieren
                        </GlassButton>
                        {canReview && (
                          <>
                            <GlassButton
                              variant="secondary"
                              disabled={busy || !comment.trim()}
                              onClick={() => decide("reject")}
                            >
                              Überarbeitung anfordern
                            </GlassButton>
                            <GlassButton
                              disabled={
                                busy ||
                                detail.stale ||
                                (!detail.localSelfReview &&
                                  detail.author.id === access.actor.id)
                              }
                              onClick={() => decide("approve")}
                            >
                              Freigeben und übernehmen
                            </GlassButton>
                          </>
                        )}
                      </div>
                      {canReview && detail.author.id === access.actor.id && (
                        <p>
                          {detail.localSelfReview
                            ? "Lokaler Testbetrieb: Du darfst deinen eigenen Vorschlag übernehmen."
                            : "Eine andere Person muss deinen Vorschlag freigeben."}
                        </p>
                      )}
                    </>
                  )}
                </GlassCard>
              ) : (
                list.requests.length > 0 && (
                  <p className={styles.intro}>
                    Wähle einen Vorschlag, um Änderungen und Rückmeldungen zu
                    prüfen.
                  </p>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

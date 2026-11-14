import { Link } from "react-router-dom";
import styles from "./helpcenter.module.css";
type Page = {
  id: string;
  slug: string;
  title: string;
  parentId?: string | null;
};
export default function HelpPageTree({
  pages,
  currentSlug,
  onNavigate,
}: {
  pages: Page[];
  currentSlug?: string;
  onNavigate?: () => void;
}) {
  const branch = (parentId: string | null = null): React.ReactNode => (
    <ul>
      {pages
        .filter((p) => (p.parentId ?? null) === parentId)
        .map((p) => (
          <li key={p.id}>
            <Link
              to={`/help/${p.slug}`}
              aria-current={p.slug === currentSlug ? "page" : undefined}
              onClick={onNavigate}
            >
              {p.title}
            </Link>
            {pages.some((child) => child.parentId === p.id) && branch(p.id)}
          </li>
        ))}
    </ul>
  );
  return <div className={styles.pageTree}>{branch()}</div>;
}

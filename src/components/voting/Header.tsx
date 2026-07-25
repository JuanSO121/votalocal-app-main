import logoAsset from "@/assets/logo-gobernacion.png.asset.json";
import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Trophy, Vote } from "lucide-react";
import { SHOW_LIVE_RESULTS } from "@/lib/results-config";

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <div className="glass-pill flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 shadow-elegant sm:pr-4">
          <img
            src={logoAsset.url}
            alt="Gobernación del Valle del Cauca"
            className="h-8 w-8 shrink-0 rounded-full bg-white/10 object-cover sm:h-9 sm:w-9"
            loading="eager"
          />
          <span className="hidden text-xs font-semibold leading-tight text-white/85 sm:block">
            Secretaría General
          </span>
        </div>

        <nav className="glass-pill flex shrink-0 items-center gap-1 rounded-full p-1 shadow-elegant sm:gap-1.5 sm:p-1.5">
          <NavTab to="/" active={pathname === "/"} icon={<Vote className="h-3.5 w-3.5" />}>
            Votación
          </NavTab>
          {SHOW_LIVE_RESULTS && (
            <NavTab
              to="/resultados"
              active={pathname === "/resultados"}
              icon={<Trophy className="h-3.5 w-3.5" />}
            >
              Resultados
            </NavTab>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavTab({
  to,
  active,
  icon,
  children,
}: {
  to: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition sm:text-sm ${
        active ? "bg-white text-primary shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="shrink-0 px-4 py-3 text-center text-xs text-white/50 sm:px-6">
      © {new Date().getFullYear()} Gobernación del Valle del Cauca · Secretaría General · Uso interno
    </footer>
  );
}
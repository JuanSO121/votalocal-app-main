// components/voting/Header.tsx
import logoAsset from "@/assets/logo-gobernacion.png";
import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Trophy, Vote } from "lucide-react";

interface HeaderProps {
  /** Nombre de la entidad (CONFIG.ENTIDAD). */
  entidad?: string;
  /** Muestra la pestaña Resultados (resultados en vivo o ya revelados). */
  showResults?: boolean;
}

export function Header({ entidad, showResults = false }: HeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        {/* El logo es horizontal (escudo + texto): se muestra completo sobre una píldora blanca, sin recortarlo en círculo. */}
        <div className="flex shrink-0 items-center rounded-full border border-border bg-white px-3 py-1.5 shadow-sm sm:px-5 sm:py-2">
          <img
            src={logoAsset}
            alt={entidad ?? "Gobernación del Valle del Cauca"}
            className="h-8 w-auto sm:h-12"
            loading="eager"
          />
        </div>

        <nav className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-white/85 p-1 shadow-sm backdrop-blur sm:gap-1.5 sm:p-1.5">
          <NavTab to="/" active={pathname === "/"} icon={<Vote className="h-3.5 w-3.5" />}>
            Votación
          </NavTab>
          {showResults && (
            <NavTab to="/resultados" active={pathname === "/resultados"} icon={<Trophy className="h-3.5 w-3.5" />}>
              Resultados
            </NavTab>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavTab({ to, active, icon, children }: { to: string; active: boolean; icon: ReactNode; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition sm:text-sm ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

export function Footer({ entidad }: { entidad?: string }) {
  return (
    <footer className="shrink-0 px-4 py-3 text-center text-xs text-muted-foreground sm:px-6">
      © {new Date().getFullYear()} {entidad ?? ""}
    </footer>
  );
}
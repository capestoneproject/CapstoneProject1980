"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/lib/auth-context";
import { Home, LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAuth();
  const isAdminPage = pathname?.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ModeToggle />
            {isAuthenticated && isAdminPage ? (
              <Button variant="ghost" onClick={logout}>
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </Button>
            ) : (
              <Link href="/admin">
                <Button variant="ghost">Admin</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

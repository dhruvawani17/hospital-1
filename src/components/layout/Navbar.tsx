"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BriefcaseMedical, CalendarDays, LogIn, LogOut, UserCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { HealthFirstLogo } from "@/components/shared/icons";
import { APP_NAME } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import React from "react";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/services", label: "Services", icon: BriefcaseMedical },
  { href: "/book-appointment", label: "Book Appointment", icon: CalendarDays },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();

  const commonLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkClasses = "bg-primary/10 text-primary";
  const inactiveLinkClasses = "hover:bg-primary/5 hover:text-primary/90";

  const renderNavLinks = (isMobile: boolean = false) => (
    navLinks.map((link) => {
      const isActive = pathname === link.href;
      const LinkContent = (
        <>
          <link.icon className="h-5 w-5" />
          {link.label}
        </>
      );
      if (isMobile) {
        return (
          <SheetClose asChild key={link.href}>
            <Link
              href={link.href}
              className={cn(commonLinkClasses, isActive ? activeLinkClasses : inactiveLinkClasses, "w-full justify-start")}
              aria-current={isActive ? "page" : undefined}
            >
              {LinkContent}
            </Link>
          </SheetClose>
        );
      }
      return (
        <Link
          key={link.href}
          href={link.href}
          className={cn(commonLinkClasses, isActive ? activeLinkClasses : inactiveLinkClasses)}
          aria-current={isActive ? "page" : undefined}
        >
          {LinkContent}
        </Link>
      );
    })
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label={`${APP_NAME} homepage`}>
          <HealthFirstLogo className="h-8 w-8" />
          <span className="font-headline text-xl font-semibold text-primary">{APP_NAME}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
          {renderNavLinks()}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && (
            user ? (
              <>
                <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                  <Link href="/dashboard" className={cn(commonLinkClasses, pathname === "/dashboard" ? activeLinkClasses : inactiveLinkClasses)}>
                    <UserCircle className="h-5 w-5" /> Dashboard
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={logout} className="hidden md:flex">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </Button>
              </>
            ) : (
              <Button variant="ghost" size="sm" asChild className="hidden md:flex">
                <Link href="/login" className={cn(commonLinkClasses, pathname === "/login" ? activeLinkClasses : inactiveLinkClasses)}>
                  <LogIn className="h-5 w-5" /> Login
                </Link>
              </Button>
            )
          )}
           {loading && <div className="hidden md:block h-8 w-20 animate-pulse rounded-md bg-muted"></div>}


          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] p-6">
              <div className="mb-6">
                <Link href="/" className="flex items-center gap-2" aria-label={`${APP_NAME} homepage`}>
                  <HealthFirstLogo className="h-8 w-8" />
                  <span className="font-headline text-xl font-semibold text-primary">{APP_NAME}</span>
                </Link>
              </div>
              <nav className="flex flex-col gap-3">
                {renderNavLinks(true)}
                <hr className="my-2"/>
                {!loading && (
                  user ? (
                    <>
                     <SheetClose asChild>
                      <Link href="/dashboard" className={cn(commonLinkClasses, pathname === "/dashboard" ? activeLinkClasses : inactiveLinkClasses, "w-full justify-start")}>
                        <UserCircle className="h-5 w-5" /> Dashboard
                      </Link>
                      </SheetClose>
                      <Button variant="outline" size="sm" onClick={() => { logout(); }} className="w-full justify-start">
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                      </Button>
                    </>
                  ) : (
                     <SheetClose asChild>
                    <Link href="/login" className={cn(commonLinkClasses, pathname === "/login" ? activeLinkClasses : inactiveLinkClasses, "w-full justify-start")}>
                      <LogIn className="h-5 w-5" /> Login
                    </Link>
                    </SheetClose>
                  )
                )}
                {loading && <div className="h-8 w-full animate-pulse rounded-md bg-muted"></div>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

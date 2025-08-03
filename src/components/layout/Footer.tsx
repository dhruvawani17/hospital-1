'use client';

import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { HealthFirstLogo } from "@/components/shared/icons";
import { Github, Linkedin, Twitter } from "lucide-react";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  
  return (
    <footer className="border-t bg-card text-card-foreground">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4" aria-label={`${APP_NAME} homepage`}>
              <HealthFirstLogo className="h-8 w-8" />
              <span className="font-headline text-xl font-semibold text-primary">{APP_NAME}</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footerTagline')}
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 font-headline">{t('quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">{t('ourServices')}</Link></li>
              <li><Link href="/book-appointment" className="text-muted-foreground hover:text-primary transition-colors">{t('bookAppointment')}</Link></li>
              <li><Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">{t('faq')}</Link></li>
              <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">{t('contactUs')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 font-headline">{t('connectWithUs')}</h3>
            <div className="flex space-x-3">
              <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><Twitter className="h-6 w-6" /></Link>
              <Link href="#" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors"><Linkedin className="h-6 w-6" /></Link>
              <Link href="#" aria-label="GitHub" className="text-muted-foreground hover:text-primary transition-colors"><Github className="h-6 w-6" /></Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Mumbai 400001
            </p>
            <p className="text-sm text-muted-foreground">
              +91 9876543210
            </p>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            &copy; {currentYear} {APP_NAME}. {t('allRightsReserved')}
          </p>
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}

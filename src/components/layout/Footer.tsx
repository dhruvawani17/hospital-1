import { APP_NAME } from "@/lib/constants";
import Link from "next/link";
import { HealthFirstLogo } from "@/components/shared/icons";
import { Github, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
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
              Providing quality healthcare with compassion and expertise. Your health is our priority.
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 font-headline">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/services" className="text-muted-foreground hover:text-primary transition-colors">Our Services</Link></li>
              <li><Link href="/book-appointment" className="text-muted-foreground hover:text-primary transition-colors">Book Appointment</Link></li>
              <li><Link href="/#faq" className="text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold mb-3 font-headline">Connect With Us</h3>
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
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} {APP_NAME}. All rights reserved.  </p>
        </div>
      </div>
    </footer>
  );
}

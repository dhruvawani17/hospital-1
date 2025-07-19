'use client';

import { useState } from 'react';
import { Languages } from 'lucide-react';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const languageNames = {
  en: 'English',
  hi: 'हिंदी', 
  mr: 'मराठी'
};

export function LanguageSwitcher() {
  const { currentLanguage, setLanguage, getAvailableLanguages } = useLanguage();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
    setIsOpen(false);
  };

  const availableLanguages = getAvailableLanguages();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-primary transition-colors gap-2"
          aria-label={t('switchLanguage')}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{languageNames[currentLanguage]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {availableLanguages.map((language) => (
          <DropdownMenuItem
            key={language}
            onClick={() => handleLanguageChange(language)}
            className="cursor-pointer flex items-center gap-2"
          >
            <Languages className="h-3 w-3" />
            {languageNames[language]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AsYouType,
  type CountryCode,
  getCountries,
  getCountryCallingCode,
} from "libphonenumber-js/max";
import { Check, ChevronDown, Phone, Search } from "lucide-react";

type Language = "ru" | "he";

type CountryOption = {
  code: CountryCode;
  dialCode: string;
  name: string;
};

const PRIORITY_COUNTRIES: CountryCode[] = ["IL", "UA", "RU", "BY", "US", "CA", "GB", "DE", "PL", "FR"];

const TEXT = {
  ru: {
    chooseCountry: "Выбрать страну",
    searchCountry: "Поиск страны или кода",
    phonePlaceholder: "Номер телефона",
    noCountries: "Страны не найдены",
  },
  he: {
    chooseCountry: "בחירת מדינה",
    searchCountry: "חיפוש מדינה או קידומת",
    phonePlaceholder: "מספר טלפון",
    noCountries: "לא נמצאו מדינות",
  },
} satisfies Record<Language, Record<string, string>>;

function countryFlag(code: CountryCode) {
  return code
    .split("")
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

function searchable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanTypedPhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (trimmed.startsWith("00")) return `+${digits.slice(2)}`;
  return digits;
}

function formatPhoneInput(rawValue: string, fallbackCountry: CountryCode) {
  const clean = cleanTypedPhone(rawValue);
  if (!clean) return { country: fallbackCountry, displayValue: "", internationalValue: "" };

  const formatter = clean.startsWith("+") ? new AsYouType() : new AsYouType(fallbackCountry);
  const formatted = formatter.input(clean);
  const detectedCountry = formatter.getCountry() ?? fallbackCountry;
  const number = formatter.getNumber();

  return {
    country: detectedCountry,
    displayValue: clean.startsWith("+") && formatter.getCountry() && number ? number.formatNational() : formatted,
    internationalValue: number ? String(number.number) : clean,
  };
}

export function InternationalPhoneField({
  language,
  onChange,
}: {
  language: Language;
  onChange: (value: string) => void;
}) {
  const copy = TEXT[language];
  const [country, setCountry] = useState<CountryCode>("IL");
  const [displayValue, setDisplayValue] = useState("");
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const countries = useMemo<CountryOption[]>(() => {
    const names = new Intl.DisplayNames([language === "he" ? "he" : "ru"], { type: "region" });
    const priority = new Map(PRIORITY_COUNTRIES.map((code, index) => [code, index]));

    return getCountries()
      .map((code) => ({
        code,
        dialCode: getCountryCallingCode(code),
        name: names.of(code) || code,
      }))
      .sort((left, right) => {
        const leftPriority = priority.get(left.code);
        const rightPriority = priority.get(right.code);
        if (leftPriority !== undefined || rightPriority !== undefined) {
          if (leftPriority === undefined) return 1;
          if (rightPriority === undefined) return -1;
          return leftPriority - rightPriority;
        }
        return left.name.localeCompare(right.name, language === "he" ? "he" : "ru");
      });
  }, [language]);

  const visibleCountries = useMemo(() => {
    const query = searchable(search);
    if (!query) return countries;
    return countries.filter((item) =>
      searchable(`${item.name} ${item.code} +${item.dialCode}`).includes(query),
    );
  }, [countries, search]);

  const selectedCountry = countries.find((item) => item.code === country) ?? {
    code: country,
    dialCode: getCountryCallingCode(country),
    name: country,
  };

  useEffect(() => {
    if (!open) return;
    const focusFrame = window.requestAnimationFrame(() => searchRef.current?.focus());
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.focus();
      }
    };
    const closeOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("mousedown", closeOutside);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("mousedown", closeOutside);
    };
  }, [open]);

  const updatePhone = (rawValue: string, defaultCountry = country) => {
    const formatted = formatPhoneInput(rawValue, defaultCountry);
    setCountry(formatted.country);
    setDisplayValue(formatted.displayValue);
    onChange(formatted.internationalValue);
  };

  const chooseCountry = (nextCountry: CountryCode) => {
    setCountry(nextCountry);
    setSearch("");
    setOpen(false);
    updatePhone(displayValue, nextCountry);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  return (
    <div ref={rootRef} className="relative" dir="ltr">
      <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-[#5e5ce6] focus-within:ring-4 focus-within:ring-[#5e5ce6]/10">
        <button
          type="button"
          onClick={() => {
            setSearch("");
            setOpen((current) => !current);
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${copy.chooseCountry}: ${selectedCountry.name}, +${selectedCountry.dialCode}`}
          className="flex min-h-13 items-center justify-center gap-1.5 border-e border-zinc-200 px-2 text-sm font-bold text-zinc-800 transition-colors duration-150 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#5e5ce6]"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {countryFlag(selectedCountry.code)}
          </span>
          <span>+{selectedCountry.dialCode}</span>
          <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        </button>

        <span className="relative block min-w-0">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            ref={inputRef}
            id="gift-phone"
            type="tel"
            inputMode="tel"
            value={displayValue}
            onChange={(event) => updatePhone(event.target.value)}
            autoComplete="tel"
            placeholder={country === "IL" ? "050 123 4567" : copy.phonePlaceholder}
            maxLength={24}
            required
            className="h-13 w-full min-w-0 bg-transparent ps-10 pe-3 text-left text-base font-semibold outline-none placeholder:text-zinc-400"
          />
        </span>
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_20px_50px_rgba(15,15,20,0.18)]">
          <div className="border-b border-zinc-100 p-3">
            <label className="relative block">
              <span className="sr-only">{copy.searchCountry}</span>
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.searchCountry}
                className="h-11 w-full rounded-xl border border-zinc-200 bg-zinc-50 ps-10 pe-3 text-sm font-semibold outline-none placeholder:text-zinc-400 focus:border-[#5e5ce6] focus:ring-4 focus:ring-[#5e5ce6]/10"
              />
            </label>
          </div>

          <div className="max-h-64 overflow-y-auto overscroll-contain p-1.5" role="listbox" aria-label={copy.chooseCountry}>
            {visibleCountries.length ? (
              visibleCountries.map((item) => {
                const selected = item.code === country;
                return (
                  <button
                    key={item.code}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => chooseCountry(item.code)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#5e5ce6] ${
                      selected ? "bg-[#f1efff] text-[#4b48c8]" : "text-zinc-800 hover:bg-zinc-50 active:bg-zinc-100"
                    }`}
                  >
                    <span aria-hidden="true" className="text-xl leading-none">
                      {countryFlag(item.code)}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-bold" dir={language === "he" ? "rtl" : "ltr"}>
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold text-zinc-500">+{item.dialCode}</span>
                    {selected ? <Check className="h-4 w-4 shrink-0" strokeWidth={3} /> : null}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-6 text-center text-sm font-semibold text-zinc-500">{copy.noCountries}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * @file utils.ts
 * @description Allgemeine Hilfsfunktionen für die GlobeNews-Applikation.
 *              Stellt CSS-Klassen-Utilities für Tailwind CSS bereit.
 * @author Projektteam GlobeNews
 * @version 1.0
 * @date 2026-05-20
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Kombiniert mehrere CSS-Klassen und löst Tailwind-Konflikte auf.
 * Verwendet clsx für bedingte Klassen und tailwind-merge für Konfliktauflösung.
 *
 * @param inputs - Beliebige Anzahl von CSS-Klassen, Objekten oder Arrays
 * @returns Zusammengeführter CSS-Klassen-String ohne Konflikte
 * @example cn("px-2 py-1", isActive && "bg-blue-500", "px-4") // => "py-1 bg-blue-500 px-4"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

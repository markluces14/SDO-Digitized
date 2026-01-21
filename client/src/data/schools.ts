// src/data/schools.ts

export const PUBLIC_ELEM = [
  "Anatolia Arcenas Memorial School",
  "Antonio Villasis Memorial School",
  "Balijuagan Elementary School",
  "Banica Elementary School",
  "Barra Elementary School",
  "Bato Elementary School",
  "Culasi Elementary School",
  "Don Conrado Barrios Memorial School",
  "Don Francisco Dinglasan Memorial School",
  "Don Gervacio Diaz Memorial School",
  "Don Manuel Arnaldo Memorial School",
  "Don Ynocencio A. Del Rosario Memorial School",
  "Doña Emiliana Alba Memorial School",
  "Doña Vicenta P. Hontiveros Memorial School",
  "Dumolog Elementary School",
  "Katipunan Village Elementary School",
  "Libas Elementary School",
  "Mongpong Elementary School",
  "Paciano Bombaes Memorial School",
  "Plaridel East Elementary School",
  "Plaridel West Elementary School",
  "President Manuel Roxas Memorial School - North",
  "Punta Cogon Elementary School",
  "Rufina Andrada Santos Memorial School",
  "Talon Elementary School",
  "Tanza Elementary School",
  "Venancio Alba Elementary School",
] as const;

export const PUBLIC_SECONDARY_INTEGRATED = [
  "Adlawan Integrated School",
  "Bago National High School",
  "Balijuagan National High School",
  "Cogon Integrated School",
  "Cong. Ramon A. Arnaldo High School",
  "Culasi National High School",
  "Don Amando Bayot, Sr. Memorial Integrated School",
  "Don Canuto Fuentes Integrated School",
  "Don Jose Acevedo Integrated School",
  "Don Juan Celino Integrated School",
  "Don Ynocencio Del Rosario National High School",
  "Dumolog National High School",
  "Inzo Arnaldo Village Integrated School",
  "Lawa-an Integrated School",
  "Loctugan Integrated Farm School",
  "Marcos Fuentes Integrated School",
  "Milibili National High School",
  "Olotayan Integrated School",
  "PMRMIS - South",
  "PMRMS - SPED",
  "Roxas City School for Philippine Craftsmen",
  "Sofronio A. Cordovero Integrated School",
  "Tanque National High School",
] as const;




/** Grouped for rendering with <optgroup> */
export const SCHOOL_GROUPED: Record<string, readonly string[]> = {
  "Public Elementary (incl. Kinder/Primary)": PUBLIC_ELEM,
  "Public JHS/SHS/Integrated": PUBLIC_SECONDARY_INTEGRATED,

};

/** Flat convenience list (if you don’t want optgroups) */
export const SCHOOL_OPTIONS = [
  ...PUBLIC_ELEM,
  ...PUBLIC_SECONDARY_INTEGRATED,
] as const;

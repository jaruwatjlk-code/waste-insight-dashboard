// ─────────────────────────────────────────────────────────────
// Core domain types — mirrors Dashboard_Source sheet columns
// ─────────────────────────────────────────────────────────────

export type Dataset    = 'Replan' | 'Addpaper'
export type RecordType = 'MONTHLY' | 'DEPT' | 'DETAIL'

export interface WasteRow {
  RecordType:  RecordType
  CalendarYear: number
  MonthNo:     number
  MonthName:   string        // Jan–Dec
  TargetFY:    number
  Dept:        string
  Date:        string | null // "dd-mmm-yyyy" (DETAIL only)
  JO:          string
  Code:        string
  Component:   string        // Replan: compnt | Addpaper: blank
  QtyBx:       number | null // Replan only
  QtySheet:    number | null
  Value:       number
  Machine:     string
  Problem:     string
  Cause:       string
  JORef:       string        // Replan only
  FactorySite: string
  Actual:      number        // MONTHLY / DEPT
  Target:      number        // MONTHLY / DEPT
  PrevAvg:     number        // MONTHLY / DEPT
  AchPct:      number        // 0–1 float (MONTHLY / DEPT)
  DeptRatio:   number        // 0–1 float (DEPT only)
  SourceSheet: string
  SearchText:  string
}

// ─────────────────────────────────────────────────────────────
// API response types
// ─────────────────────────────────────────────────────────────

export interface ApiMeta {
  dataset:  Dataset
  type:     RecordType | 'ALL'
  count:    number
  cachedAt: string  // ISO string
}

export interface ApiResponse {
  meta: ApiMeta
  data: WasteRow[]
}

// ─────────────────────────────────────────────────────────────
// UI helper types
// ─────────────────────────────────────────────────────────────

export interface Filters {
  years: number[]
  depts: string[]
}

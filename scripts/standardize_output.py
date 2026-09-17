#!/usr/bin/env python3
"""
apply_field_mapping.py

Usage:
  python apply_field_mapping.py \
    --input mergedMosquitoData.csv \
    --headers headers.json \
    --output mergedMosquitoData_translated.csv

What it does:
  - Reads headers.json, extracts expected fields per documentType using "translation"
  - Maps each translation name -> a source column in the merged CSV
    * Uses a curated manual map for known fields
    * Falls back to fuzzy matching if needed
  - Creates new columns named by the translation and copies values from the source column
  - Writes the augmented dataframe to output CSV

Notes:
  - This is designed for your merged wide CSV where irrelevant template fields are NA for other templates.
  - We treat empty strings as NA when computing match diagnostics; values are copied as-is.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np
import pandas as pd


# -----------------------------
# Normalization + fuzzy matching
# -----------------------------
def _norm_key(s: str) -> str:
    s = str(s).strip().lower()
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[^a-z0-9]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _best_fuzzy_match(target: str, candidates: Iterable[str], cutoff: float) -> Tuple[Optional[str], float]:
    t = _norm_key(target)
    best_col = None
    best_score = 0.0
    for c in candidates:
        score = SequenceMatcher(None, t, _norm_key(c)).ratio()
        if score > best_score:
            best_score = score
            best_col = c
    if best_score >= cutoff:
        return best_col, best_score
    return None, best_score


# -----------------------------
# Manual map (translation -> merged CSV column)
# -----------------------------
def build_manual_map() -> Dict[str, str]:
    m: Dict[str, str] = {
        # common
        "House Number": "House.Number",
        "Type of wall": "wall_type",
        "Type of floor": "floor_type",
        "Type of ceiling": "ceiling_type",
        "People present": "people_present",
        "Number of rooms visited": "num_rooms_visited",
        "Presence of net": "presence_net",
        "Number of nets": "num_nets",
        "Number of sleeping people": "num_sleepingPeople",
        "Source of nets": "source_nets",
        "Date of last spraying": "date_last_spray",
        "latitude": "latitude",
        "longitude": "longitude",

        # other_vectors
        "Males (Culex sp)": "males_Culex",
        "Females (Culex sp)": "females_Culex",
        "Males (Aedes sp)": "males_Aedes",
        "Females (Aedes sp)": "females_Aedes",
        "Males (Mansonia sp)": "males_Mansonia",
        "Females (Mansonia sp)": "females_Mansonia",
        "Males (Unidentified Anopheles)": "males_unidentifiedAnopheles",
        "Females (Unidentified Anopheles)": "females_unidentifiedAnopheles",

        # anopheles gambiae / funestus (non s.l. style)
        "Feeding (Anopheles Gambia)": "feeding_AnophelesGambiae",
        "Pregnant (Anopheles Gambia)": "pregnant_AnophelesGambiae",
        "Not feeding (Anopheles Gambia)": "notfeeding_AnophelesGambiae",
        "Females (Anopheles Gambia)": "females_AnophelesGambiae",
        "Males (Anopheles Gambia)": "males_AnophelesGambiae",

        "Feeding (Anopheles Funestus)": "feeding_AnophelesFunestus",
        "Pregnant (Anopheles Funestus)": "pregnant_AnophelesFunestus",
        "Not feeding (Anopheles Funestus)": "notfeeding_AnophelesFunestus",
        "Females (Anopheles Funestus)": "females_AnophelesFunestus",
        "Males (Anopheles Funestus)": "males_AnophelesFunestus",

        # other anopheles (non s.l.)
        "Males (Anopheles Coustani)": "males_AnophelesCoustani",
        "Females (Anopheles Coustani)": "females_AnophelesCoustani",
        "Males (Anopheles Phaorensis)": "males_AnophelesPhaorensis",
        "Females (Anopheles Phaorensis)": "females_AnophelesPhaorensis",

        # disease templates (s.l.)
        "Feeding (An. Gambiae s.l.)": "feeding_AnGambiae_sI",
        "Pregnant (An. Gambiae s.l.)": "pregnant_AnGambiae_sI",
        "Not Feeding (An. Gambiae s.l.)": "notfeeding_AnGambiae_sI",
        "Total Females (An. Gambiae s.l.)": "totalFemales_AnGambiae_sI",
        "Total Males (An. Gambiae s.l.)": "totalMales_AnGambiae_sI",

        "Feeding (An. Funestus s.l.)": "feeding_AnFunestus_sI",
        "Pregnant (An. Funestus s.l.)": "pregnant_AnFunestus_sI",
        "Not Feeding (An. Funestus s.l.)": "notfeeding_AnFunestus_sI",
        "Total Females (An. Funestus s.l.)": "totalFemales_AnFunestus_sI",
        "Total Males (An. Funestus s.l.)": "totalMales_AnFunestus_sI",

        "Males (An. Coustani)": "males_AnCoustani",
        "Females (An. Coustani)": "females_AnCoustani",
        "Males (An. Phaorensis)": "males_AnPhaorensis",
        "Females (An. Phaorensis)": "females_AnPhaorensis",
        "Males (An. Macu)": "males_AnMacu",
        "Females (An. Macu)": "females_AnMacu",
        "Males (An. Pretori)": "males_AnPretori",
        "Females (An. Pretori)": "females_AnPretori",

        # light traps
        "Anopheles Funestus (Indoors)": "indoors_AnophelesFunestus",
        "Anopheles gambiae (Indoors)": "indoors_AnophelesGambiae",
        "Culex (Indoors)": "indoors_Culex",
        "Aedes (Indoors)": "indoors_Aedes",
        "Other Anopheles (Indoors)": "indoors_otherAnopheles",
        "Anopheles Funestus (Outdoors)": "outdoors_AnophelesFunestus",
        "Anopheles gambiae (Outdoors)": "outdoors_AnophelesGambiae",
        "Culex (Outdoors)": "outdoors_Culex",
        "Aedes (Outdoors)": "outdoors_Aedes",
        "Other Anopheles (Outdoors)": "outdoors_otherAnopheles",

        # procopack totals (kept here; you can ignore procopack in analysis, but mapping is harmless)
        "Total specimens (Gambiae s.l.)": "total_Gambiae_sI",
        "Total specimens (Funestus s.l.)": "total_Funestus_sI",
    }

    # Unspecified 1..6
    for i in range(1, 7):
        m[f"Males (Unspecified {i})"] = f"males_Unspecified{i}"
        m[f"Females (Unspecified {i})"] = f"females_Unspecified{i}"

    return m


# -----------------------------
# Core mapping logic
# -----------------------------
@dataclass(frozen=True)
class MappingResult:
    translation: str
    source_col: str
    method: str   # "manual" or "fuzzy"
    score: float  # 1.0 for manual, fuzzy similarity otherwise


def load_expected_translations(headers_json: dict) -> Dict[str, List[str]]:
    expected = defaultdict(list)
    for h in headers_json:
        dt = h.get("documentType")
        for c in h.get("columns", []):
            expected[dt].append(c.get("translation") or c.get("original"))
    # stable de-dupe
    return {dt: list(dict.fromkeys(cols)) for dt, cols in expected.items()}


def build_translation_union(expected_translations: Dict[str, List[str]]) -> List[str]:
    # union over all doc types
    seen = set()
    out: List[str] = []
    for dt, cols in expected_translations.items():
        for t in cols:
            if t not in seen:
                seen.add(t)
                out.append(t)
    return out


def compute_field_mapping(
    df_cols: List[str],
    translations: List[str],
    manual_map: Dict[str, str],
    fuzzy_cutoff: float,
) -> Tuple[List[MappingResult], List[Tuple[str, float]]]:
    mapped: List[MappingResult] = []
    unmapped: List[Tuple[str, float]] = []

    for t in translations:
        # manual
        if t in manual_map and manual_map[t] in df_cols:
            mapped.append(MappingResult(t, manual_map[t], "manual", 1.0))
            continue

        # fuzzy fallback
        best_col, best_score = _best_fuzzy_match(t, df_cols, cutoff=fuzzy_cutoff)
        if best_col is not None:
            mapped.append(MappingResult(t, best_col, "fuzzy", best_score))
        else:
            unmapped.append((t, best_score))

    return mapped, unmapped


def apply_mapping_add_columns(
    df: pd.DataFrame,
    mapping: List[MappingResult],
    overwrite: bool = False,
) -> pd.DataFrame:
    out = df.copy()
    for m in mapping:
        if (m.translation in out.columns) and (not overwrite):
            # already exists; skip
            continue
        out[m.translation] = out[m.source_col]
    return out


def drop_original_template_cols(
    df: pd.DataFrame,
    mapping: List[MappingResult],
    keep_cols: Optional[List[str]] = None,
) -> pd.DataFrame:
    keep = set(keep_cols or [])
    source_cols = {m.source_col for m in mapping}
    to_drop = [c for c in source_cols if c in df.columns and c not in keep]
    return df.drop(columns=to_drop)


# -----------------------------
# CLI
# -----------------------------
def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Path to merged CSV (input).")
    p.add_argument("--headers", required=True, help="Path to headers.json.")
    p.add_argument("--output", required=True, help="Path to write translated CSV.")
    p.add_argument("--fuzzy-cutoff", type=float, default=0.70, help="Similarity cutoff for fuzzy mapping (default 0.70).")
    p.add_argument("--overwrite", action="store_true", help="Overwrite translated column if it already exists.")
    p.add_argument("--drop-original-template-cols", action="store_true",
                   help="Drop the original template columns that were mapped-from, leaving translated columns.")
    p.add_argument("--keep-cols", nargs="*", default=[],
                   help="Extra columns to protect from dropping when --drop-original-template-cols is used.")
    p.add_argument("--write-mapping-report", default=None,
                   help="Optional path to write mapping report CSV (translation -> source_col, method, score).")
    args = p.parse_args()

    df = pd.read_csv(args.input)
    with open(args.headers, "r", encoding="utf-8") as f:
        headers_json = json.load(f)

    expected = load_expected_translations(headers_json)
    translations = build_translation_union(expected)

    manual_map = build_manual_map()
    mapped, unmapped = compute_field_mapping(
        df_cols=list(df.columns),
        translations=translations,
        manual_map=manual_map,
        fuzzy_cutoff=args.fuzzy_cutoff,
    )

    # Diagnostics to stderr
    print(f"[info] input rows={len(df)} cols={len(df.columns)}", file=sys.stderr)
    print(f"[info] translations (union across templates)={len(translations)}", file=sys.stderr)
    print(f"[info] mapped={len(mapped)} unmapped={len(unmapped)}", file=sys.stderr)
    if unmapped:
        print("[warn] Unmapped translations (top 15):", file=sys.stderr)
        for t, sc in sorted(unmapped, key=lambda x: x[1], reverse=True)[:15]:
            print(f"  - {t} (best_score={sc:.3f})", file=sys.stderr)

    out = apply_mapping_add_columns(df, mapped, overwrite=args.overwrite)

    if args.drop_original_template_cols:
        out = drop_original_template_cols(out, mapped, keep_cols=args.keep_cols)

    out.to_csv(args.output, index=False)

    if args.write_mapping_report:
        rep = pd.DataFrame([{
            "translation": m.translation,
            "source_col": m.source_col,
            "method": m.method,
            "score": m.score,
        } for m in mapped])
        rep.to_csv(args.write_mapping_report, index=False)

    print(f"[info] wrote: {args.output} (rows={len(out)} cols={len(out.columns)})", file=sys.stderr)
    if args.write_mapping_report:
        print(f"[info] wrote mapping report: {args.write_mapping_report}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

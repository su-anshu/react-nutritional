# SattuPro — Food Nutrition Formulation, Validation, Claim Checker & Label Generator

An end-to-end industrial food formulation, nutrition science validation, FSSAI regulatory claim checking, and print-ready statutory label generation platform built with **React 18 + Vite**.

---

## 🏛️ Core Architectural Principles & Invariants

1. **Missing ≠ Zero Contract**  
   Missing nutrient data is strictly preserved as `null` and displayed as `—` (em-dash) across all statutory panels and formulation tables. `0.0` is reserved strictly for analytically verified zeros (e.g., Added Sugar: 0g, Trans Fat: 0g).
2. **Calculated → Override → Final Architecture**  
   Raw recipe physics calculations are permanently preserved. Users and QC teams can enter batch lab overrides (e.g. NABL laboratory certificates). If an override exists: $\text{Final} = \text{Override}$; otherwise $\text{Final} = \text{Calculated}$.
3. **Strict Coverage-Gated Claim Evaluation**  
   For all nutrient-dependent claims, if relevant nutrient coverage $< 100\%$ ($99.9\%$), the system outputs `INSUFFICIENT_DATA` and `eligible: false`. Missing nutrients (e.g., missing trans fat) are never assumed to be zero.
4. **Claim Screening vs Legal Approval Disclaimer**  
   The Claim Checker performs automated mathematical screening based on FSSAI thresholds (`NUMERICALLY_ELIGIBLE`, `NOT_ELIGIBLE`, `INSUFFICIENT_DATA`, `LAB_VALIDATION_REQUIRED`). It clearly notes that screening does not substitute for qualified food regulatory counsel.
5. **Safe Regulatory Label Transfer**  
   Only nutrients with $\ge 99.9\%$ recipe weight coverage or explicit lab overrides are transferred to statutory label generator templates. Incomplete or proxy nutrients are safely held as `null` / `—` on statutory panels.
6. **4-Tier Data Provenance Hierarchy**  
   - **Tier 1 (Certified)**: NABL Lab Certificate / Batch Assay (`LAB_VERIFIED`).
   - **Tier 2 (Composite / Specification)**: Supplier Certificate of Analysis (`SUPPLIER_COA`).
   - **Tier 3 (Proximate Reference)**: National standard food composition databases (`IFCT_2017_STANDARD`, `USDA_SR28_STANDARD`).
   - **Tier 4 (Proxy Estimate)**: Literature proxy or unverified benchmark (`PROXY_ESTIMATE`).
7. **Atwater Energy Sanity Formulas**  
   - **Preferred Formula** (when available carbohydrates and dietary fibre are present):  
     $$\text{Energy (kcal)} = (4 \times \text{Protein}) + (4 \times \text{Available Carbohydrate}) + (9 \times \text{Total Fat}) + (2 \times \text{Dietary Fibre})$$
   - **Fallback Formula** (when only total carbohydrates are available):  
     $$\text{Energy (kcal)} = (4 \times \text{Protein}) + (4 \times \text{Total Carbohydrate}) + (9 \times \text{Total Fat})$$
8. **Specialty Salt & Sodium Engine**  
   Calculates sodium contribution as $\text{Grams} \times \text{sodiumFraction} \times 1000$ normalized per 100g. Salts without verified sodium fraction (e.g. unassayed Himalayan Pink Salt) trigger explicit warnings.
9. **Protein-Weighted Amino Acid Coverage**  
   Tracks amino acid coverage weighted by protein contribution rather than raw recipe weight. BCAA percentage of protein is guarded and suppressed unless protein coverage $\ge 95\%$.

---

## 🌟 Comprehensive Feature Suite

### 1. 🏷️ Statutory Label Generator & 300 DPI Exporter
- **13 Specialized Label Layouts**:
  - **Regulatory Statutory Panels**: Standard FSSAI Panel, FDA Vertical Format.
  - **Marketing / Digital / Quick Views**: Compact Strip, Boxed Banner, Curved Modern, Two-Tone Split, Minimalist Line, Hero Tiles, Dual Stat Cards, Dark Premium, Icon Row, RDA Ring Gauges, Editorial Masthead.
  - *Includes statutory disclaimer notifying users that marketing views are promotional visualizations and not statutory panels.*
- **Physical Size Presets**: Standard (111 mm), Small pack (80 mm), Large pack (140 mm) rendered at crisp **300 DPI**.
- **Export Options**: Single PDF, High-Resolution PNG, 1-Click Clipboard Copy, and Batch Export (Multi-page PDF or PNG ZIP).
- **Safe Recipe Transfer**: Displays active data origin banner (`RECIPE_ESTIMATE`) when derived from recipe formulations.

---

### 2. 🧪 Food Nutrition Formulation Engine (`src/engine/nutritionEngine.js`)
- **10 Real Manufacturing Master Formulations**:
  1. *Chana Sattu Pure* (100% roasted Bengal gram, Mithila Foods 394 kcal baseline).
  2. *Jeera Chana Sattu* (96.62g Chana, 3.38g Roasted Jeera).
  3. *Pea Fortified Sattu* (60g Chana, 40g Pea Protein Isolate).
  4. *Moringa Sattu* (78.95g Chana, 8.77g Moringa, 3.07g Jeera, 2.63g Salt, seasonings).
  5. *Beetroot Sattu* (52.63g Chana, 35.09g Beetroot, 3.07g Jeera, 2.63g Salt, seasonings).
  6. *ABC Sattu* (48.25g Chana, 13.16g Apple, 13.16g Beetroot, 13.16g Carrot, 2.63g Salt, seasonings).
  7. *Kulthi Sattu* (100% roasted Horse Gram flour).
  8. *Makai Sattu* (100% roasted Yellow Maize flour).
  9. *Jau Sattu* (100% roasted Barley flour — allergen tagged).
  10. *Triphala Sattu* (78.95g Chana, 8.77g Triphala, 3.07g Jeera, 2.63g Salt, seasonings).
- **Dual Standard Serving Sizes**: Standard Primary Serving (25g) and Heavy Serving (50g) with real-time scaling and custom gram inputs.
- **Manufacturing Tolerance**: Balanced formulation check supporting 99.99g batches within standard manufacturing rounding tolerance (99.95g–100.05g).
- **Lab Overrides Manager**: Drawer UI for attaching certified NABL lab results and notes to any recipe nutrient without losing calculated model values.

---

### 3. 🛡️ Food Science & Compliance Validation Engine (`src/engine/validationEngine.js`)
Automated 8-point food science audit that grades each recipe (0–100 Compliance Score) with clear status badges (**PASS**, **INFO**, **WARNING**, **FAIL**):
1. **Atwater Energy Sanity Check**: Preferred Available Carb + Fibre basis $(4P + 4\text{AvailCarb} + 9F + 2\text{Fiber})$ or Fallback Total Carb basis with internal QA thresholds ($\le 5\%$ PASS, $5\text{--}10\%$ INFO, $>10\%$ WARNING).
2. **Physical Mass-Balance Check**: Verifies that proximate sum without carbohydrate double-counting $(\text{Protein} + \text{Fat} + \text{AvailCarb} + \text{Fiber} + \text{Moisture} + \text{Ash})$ is physically valid.
3. **Carbohydrate & Sugar Hierarchy**: Enforces $\text{Total Sugar} \le \text{Total Carbohydrates}$ and $\text{Added Sugar} \le \text{Total Sugars}$.
4. **Fat & Fatty Acid Hierarchy**: Enforces $\text{Saturated Fat} \le \text{Total Fat}$ and $\text{Sat} + \text{Trans} \le \text{Total Fat}$.
5. **Salt vs Sodium Balance Audit**: Verifies that added salt correctly accounts for finished sodium.
6. **Specialty Salt Verification**: Flags unassayed specialty salts missing `sodiumFraction`.
7. **Supplier COA Verification Advisory**: Flags ingredients with variable supplier specs (e.g. Pea Protein Isolate, Triphala).
8. **Statutory Allergen Check**: Automatically enforces mandatory allergen statements (e.g. `CONTAINS GLUTEN / BARLEY` for barley formulations).

---

### 4. ⚖️ FSSAI Claim Checker & Marketing Scanner (`src/engine/claimEngine.js`)
- **17 FSSAI Regulatory Claims**: Evaluates eligibility against statutory thresholds for Protein, Dietary Fibre, Low Fat, Trans Fat Free, Cholesterol Free, No Added Sugar, Low Sodium, No Added Salt, Iron, Calcium, and more.
- **Multi-Status Classification**:
  - `NUMERICALLY_ELIGIBLE`: Meets numerical limits with $\ge 99.9\%$ verified recipe coverage.
  - `NOT_ELIGIBLE`: Fails statutory thresholds.
  - `INSUFFICIENT_DATA`: Required nutrient coverage is partial or missing (missing $\ne 0$).
  - `LAB_VALIDATION_REQUIRED`: Requires accredited laboratory batch assay.
- **Prohibited Marketing Text Scanner**: Scans promotional text in real-time to detect and prevent prohibited therapeutic or disease-cure claims (e.g., "cures diabetes", "prevents cancer", "medicinal"). Includes non-exhaustive scanner disclaimer.

---

### 5. 🧬 Amino Acid & BCAA Profile Engine (`src/engine/aminoAcidEngine.js`)
- Computes complete profiles for 9 Essential Amino Acids and 9 Non-Essential Amino Acids.
- Calculates total BCAAs (Leucine + Isoleucine + Valine), Sulfur Amino Acids, and Aromatic Amino Acids.
- **Protein Contribution Coverage**: Calculates true protein-weighted coverage.
- **BCAA % Guard**: BCAA as % of total protein is only computed when protein coverage $\ge 95\%$.
- **Bio-efficacy Notice**: Explicitly clarifies that amino acid profiles reflect chemical composition and that in-vivo digestibility assay is required for PDCAAS/DIAAS.

---

### 6. 🥗 Master Ingredient Database (`src/data/ingredientMaster.js`)
- 16 Seed Ingredients with complete nutrient, amino acid, and provenance metadata (IFCT, USDA, NABL Lab, COA, Proxy).
- Mithila Foods Pure Chana Sattu baseline (394 kcal, 22.5g protein, 64g carb, 17g fiber, 5.2g fat, 20mg sodium). Unverified micronutrients held as `null`.
- Master Table UI with category filters, detailed modal view, COA requirements, and sodium fraction editor.

---

### 7. 📑 Technical Formulation Dossier & Data Backup
- **Printable Technical Dossier (`FormulationReport.jsx`)**: Clean, audit-ready specification sheet formatted for PDF export / printing.
- **Data & Backup Hub (`DataSettings.jsx`)**: 1-click JSON backup export, JSON restore, and factory reset.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone or navigate to the repository
cd nutrtitional_label_react

# Install dependencies
npm install

# Run automated unit tests (Vitest)
npm test

# Start the local development server
npm run dev

# Build production bundle
npm run build
```

---

## 🧪 Test Suite
The project includes a comprehensive Vitest test suite in `tests/`:
```bash
npm test -- --run
```
All 21 tests verify:
- Accurate calculation of 10 seed manufacturing recipes and Mithila Foods 394 kcal baseline.
- Dual serving sizes (25g primary and 50g heavy serving) scaling.
- Missing ≠ Zero handling (`null` preservation).
- Calculated $\to$ Override $\to$ Final architecture.
- Safe regulatory label transfer gating.
- Food science validation rules (Atwater preferred/fallback formulas, mass balance, hierarchies, gluten allergen detection, supplier COA flags, specialty salt checks).
- Protein-weighted amino acid and BCAA coverage guards.
- FSSAI claim evaluations with multi-nutrient dependency gating.
- Prohibited marketing text detection and non-exhaustive disclaimer.

---

## 📂 Project Architecture

```
nutrtitional_label_react/
├── src/
│   ├── components/
│   │   ├── formulation/
│   │   │   ├── AminoAcidPanel.jsx        # Amino acid profile, protein coverage & BCAA metrics
│   │   │   ├── ClaimChecker.jsx          # FSSAI claim evaluator & text scanner
│   │   │   ├── DataSettings.jsx          # JSON backup, restore & factory reset
│   │   │   ├── FormulationReport.jsx     # Printable Technical Dossier
│   │   │   ├── FormulationWorkspace.jsx  # Formulation coordinator workspace
│   │   │   ├── IngredientContribution.jsx# Nutrient contribution breakdown
│   │   │   ├── IngredientMaster.jsx      # Master ingredient table & editor
│   │   │   ├── NutritionResults.jsx      # Per 100g, 25g, 50g results & Lab Overrides
│   │   │   ├── RecipeBuilder.jsx         # Formulation editor & rounding tolerance
│   │   │   └── ValidationPanel.jsx       # Food science compliance scorecard
│   │   ├── templates/                    # 13 Label visual templates
│   │   ├── NutritionLabel.jsx            # Dynamic template router
│   │   └── ProductSelect.jsx             # Searchable combobox
│   ├── data/
│   │   ├── claimRules.js                 # FSSAI statutory limits, metadata & prohibited keywords
│   │   ├── ingredientMaster.js           # 16 standard ingredients with provenance & sodium fractions
│   │   └── productRecipes.js             # 10 exact manufacturing master Sattu formulations
│   ├── engine/
│   │   ├── aminoAcidEngine.js            # BCAA, protein-weighted coverage & amino calculators
│   │   ├── claimEngine.js                # FSSAI claims & marketing text scanner
│   │   ├── nutritionEngine.js            # Weighted sums, overrides, dual servings & safe label transfer
│   │   └── validationEngine.js           # 8-point food science audit suite with Atwater formulas
│   ├── App.jsx                           # Top-level application coordinator & persistence
│   ├── constants.js                      # RDAs, template groupings & default values
│   ├── exportUtils.js                    # 300 DPI Canvas, PDF, PNG & ZIP exporters
│   ├── index.css                         # Clean Apple/editorial design system
│   ├── main.jsx                          # React 18 root
│   └── utils.js                          # Missing-safe formatters & CSV parsing
├── tests/
│   ├── engines.test.js                   # Validation, amino acid & claim tests
│   └── nutritionEngine.test.js           # Formulation calculation, baseline, overrides & transfer tests
└── package.json
```

---

## 📜 License
Private application developed for Sattu formulation, validation, and regulatory compliance.

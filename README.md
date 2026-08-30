# SattuPro — Food Nutrition Formulation, Validation, Claim Checker & Label Generator

An end-to-end food formulation, nutrition science validation, FSSAI regulatory claim checking, and print-ready nutrition label generation platform built with **React 18 + Vite**.

---

## 🌟 Core Feature Suite

### 1. 🏷️ Statutory Label Generator & 300 DPI Exporter
- **13 Specialized Label Layouts**:
  - **Regulatory Statutory Panels**: Standard FSSAI Panel, FDA Vertical Format, Compact Strip.
  - **Marketing & Consumer Visualizations**: Boxed Banner, Curved Modern, Two-Tone Split, Minimalist Line, Hero Tiles, Dual Stat Cards, Dark Premium, Icon Row, RDA Ring Gauges, Editorial Masthead.
  - *Includes statutory disclaimer notifying users that marketing templates are promotional visualizations and not statutory panels.*
- **Physical Size Presets**: Standard (111 mm), Small pack (80 mm), Large pack (140 mm) rendered at crisp **300 DPI**.
- **Export Options**: Single PDF, High-Resolution PNG, 1-Click Clipboard Copy, and Batch Export (Multi-page PDF or PNG ZIP).
- **Missing ≠ Zero Contract**: Missing values are rendered as `—` (dash) across all 13 templates. `0.0` is reserved strictly for analytically measured zeros (e.g., Added Sugar: 0g).

---

### 2. 🧪 Food Nutrition Formulation Engine (`src/engine/nutritionEngine.js`)
- **Interactive Recipe Builder**: Create, edit, and save customized multi-ingredient formulations.
- **Batch Weight Normalization**: Supports flexible recipe batch weights with 1-click normalization to 100g.
- **Coverage & Data Provenance**: Tracks exact recipe-weight data coverage percentage for each nutrient. Differentiates 100% complete calculations from partial coverage (<100%) and missing values (`—`).
- **Salt & Sodium Balance Engine**: Accurately computes sodium contributions from added table salt ($\sim 393\text{ mg Na / g NaCl}$) vs natural matrix sodium.
- **⚡ 1-Click Label Transfer**: Seamlessly pushes calculated formulation results directly into the active Label Generator.

---

### 3. 🛡️ Food Science & Compliance Validation Engine (`src/engine/validationEngine.js`)
Automated 8-point food science audit that grades each recipe (0–100 Compliance Score) with clear status badges (**PASS**, **WARNING**, **FAIL**):
1. **Atwater Energy Sanity Check**: Compares stated energy against $(4 \times \text{Protein}) + (9 \times \text{Fat}) + (4 \times \text{Carb})$ with $\pm 7\%$ / $\pm 15\%$ analytical tolerance thresholds.
2. **Physical Mass-Balance Check**: Verifies that proximate sum $(\text{Protein} + \text{Fat} + \text{Carb} + \text{Moisture} + \text{Ash})$ does not exceed $100.5\text{g} / 100\text{g}$.
3. **Carbohydrate & Sugar Hierarchy**: Enforces $\text{Total Sugar} \le \text{Total Carbohydrates}$ and $\text{Added Sugar} \le \text{Total Sugars}$.
4. **Fat & Fatty Acid Hierarchy**: Enforces $\text{Saturated Fat} \le \text{Total Fat}$.
5. **Salt vs Sodium Consistency Audit**: Verifies that recipes with added salt reflect appropriate finished sodium levels.
6. **Data Provenance & Missing Nutrients Audit**: Warns about unanalyzed nutrients.
7. **Supplier COA Verification Advisory**: Flags ingredients with variable supplier specs (e.g., Pea Protein Isolate, Triphala).
8. **Statutory Allergen Check**: Automatically enforces mandatory allergen statements (e.g. `CONTAINS GLUTEN / BARLEY` for barley formulations).

---

### 4. ⚖️ FSSAI Claim Checker & Marketing Scanner (`src/engine/claimEngine.js`)
- **17 FSSAI Regulatory Claims**: Evaluates eligibility against statutory thresholds for Protein, Dietary Fibre, Low Fat, Trans Fat Free, Cholesterol Free, No Added Sugar, Low Sodium, No Added Salt, Iron, Calcium, and more.
- **Strict "No Added Salt" Rule**: Formulations containing added salt (e.g. Moringa, Beetroot, ABC, and Triphala Sattu) are strictly disqualified from "No Added Salt" claims.
- **Live Prohibited Marketing Scanner**: Scans promotional text in real-time to detect and prevent prohibited therapeutic or disease-cure claims (e.g., "cures diabetes", "prevents cancer", "medicinal").

---

### 5. 🧬 Amino Acid & BCAA Profile Engine (`src/engine/aminoAcidEngine.js`)
- Computes complete profiles for 9 Essential Amino Acids (Histidine, Isoleucine, Leucine, Lysine, Methionine, Phenylalanine, Threonine, Tryptophan, Valine) and 9 Non-Essential Amino Acids.
- Calculates total BCAAs (Leucine + Isoleucine + Valine), BCAA as % of total protein, Sulfur Amino Acids, and Aromatic Amino Acids.

---

### 6. 🥗 Master Ingredient Database (`src/data/ingredientMaster.js`)
- 16 Seed Ingredients with complete nutrient, amino acid, and provenance metadata (IFCT, USDA, COA).
- Master Table UI with category filters, detailed modal view, and custom ingredient creator.

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
npm test
```
All 20 tests verify:
- Weighted nutrient sums, partial coverage calculation, and serving size scaling.
- Food science validation rules (Atwater energy, mass balance, hierarchies, gluten allergen detection, supplier COA flags).
- Amino acid and BCAA totals.
- FSSAI claim evaluations and prohibited marketing text detection.

---

## 📂 Project Architecture

```
nutrtitional_label_react/
├── src/
│   ├── components/
│   │   ├── formulation/
│   │   │   ├── AminoAcidPanel.jsx        # Amino acid profile & BCAA metrics
│   │   │   ├── ClaimChecker.jsx          # FSSAI claim evaluator & text scanner
│   │   │   ├── DataSettings.jsx          # JSON backup, restore & factory reset
│   │   │   ├── FormulationReport.jsx     # Printable Technical Dossier
│   │   │   ├── FormulationWorkspace.jsx  # Formulation coordinator workspace
│   │   │   ├── IngredientContribution.jsx# Nutrient contribution breakdown
│   │   │   ├── IngredientMaster.jsx      # Master ingredient table & editor
│   │   │   ├── NutritionResults.jsx      # Per 100g & per serving formulation results
│   │   │   ├── RecipeBuilder.jsx         # Formulation editor & preset selector
│   │   │   └── ValidationPanel.jsx       # Food science compliance scorecard
│   │   ├── templates/                    # 13 Label visual templates
│   │   ├── NutritionLabel.jsx            # Dynamic template router
│   │   └── ProductSelect.jsx             # Searchable combobox
│   ├── data/
│   │   ├── claimRules.js                 # FSSAI statutory limits & prohibited keywords
│   │   ├── ingredientMaster.js           # 16 standard ingredients with provenance
│   │   └── productRecipes.js             # 10 standard Sattu formulations
│   ├── engine/
│   │   ├── aminoAcidEngine.js            # BCAA & amino acid calculators
│   │   ├── claimEngine.js                # FSSAI claims & marketing text scanner
│   │   ├── nutritionEngine.js            # Weighted sums, coverage & salt/sodium engine
│   │   └── validationEngine.js           # 8-point food science audit suite
│   ├── App.jsx                           # Top-level application coordinator
│   ├── constants.js                      # RDAs, template groupings & default values
│   ├── exportUtils.js                    # 300 DPI Canvas, PDF, PNG & ZIP exporters
│   ├── index.css                         # Clean Apple/editorial design system
│   ├── main.jsx                          # React 18 root
│   └── utils.js                          # Missing-safe formatters & CSV parsing
├── tests/
│   ├── engines.test.js                   # Validation, amino acid & claim tests
│   └── nutritionEngine.test.js           # Formulation calculation & coverage tests
└── package.json
```

---

## 📜 License
Private application developed for Sattu formulation, validation, and regulatory compliance.

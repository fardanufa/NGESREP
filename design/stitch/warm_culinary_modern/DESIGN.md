---
name: Warm Culinary Modern
colors:
  surface: '#fff8f6'
  surface-dim: '#f2d4c5'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#ffeae0'
  surface-container-high: '#ffe2d5'
  surface-container-highest: '#fbdcce'
  on-surface: '#28180f'
  on-surface-variant: '#5a4138'
  inverse-surface: '#3e2c23'
  inverse-on-surface: '#ffede5'
  outline: '#8e7166'
  outline-variant: '#e2bfb2'
  surface-tint: '#a63b00'
  primary: '#a23a00'
  on-primary: '#ffffff'
  primary-container: '#cb4a00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb598'
  secondary: '#006e24'
  on-secondary: '#ffffff'
  secondary-container: '#8af791'
  on-secondary-container: '#007326'
  tertiary: '#645a50'
  on-tertiary: '#ffffff'
  tertiary-container: '#7d7368'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb598'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#7f2b00'
  secondary-fixed: '#8dfa94'
  secondary-fixed-dim: '#71dd7a'
  on-secondary-fixed: '#002106'
  on-secondary-fixed-variant: '#005319'
  tertiary-fixed: '#eee0d3'
  tertiary-fixed-dim: '#d1c4b8'
  on-tertiary-fixed: '#211a13'
  on-tertiary-fixed-variant: '#4e453c'
  background: '#fff8f6'
  on-background: '#28180f'
  surface-variant: '#fbdcce'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system delivers a warm, hospitable, and vibrant culinary interface explicitly crafted for budget-conscious university students (*anak kos*) navigating life away from home. Grounded in the culinary culture of Semarang, the tone is approachable, energetic, and resourceful—instilling culinary confidence through meals that are *Nikmat, Gampang, Ekonomis, dan Sehat* (Delicious, Simple, Economical, and Healthy).

### Visual Metaphor & Design Style
The aesthetic fuses **Modern Culinary Tactility** with **Warm Soft-Minimalism**:
- **Warmth over Clinical White:** Surfaces rely on creamy tones reminiscent of fresh warm rice, pandan infusions, and kitchen terracotta rather than stark, cold grays.
- **Micro-Textures & Appetizing Clarity:** Imagery takes center stage with crisp food photography, paired with gentle, welcoming curved containers (`rounded-2xl`).
- **Playful Utility:** Visual hierarchy communicates pricing estimates (e.g., `< Rp 10.000`), prep times, and rice-cooker-only tags through clear, pill-shaped badges and conversational iconography.
- **Brand Identity:** The logo mark—featuring the vibrant orange rounded square with a cooking bowl base and leaf sprout—serves as the anchor for app header states, loading sequences, and empty state illustrations.

## Colors

The palette balances appetite stimulation, organic freshness, and soft contrast tailored for daily kitchen use on mobile screens.

### Core Swatches
- **Primary (`#E8590C` - Spiced Sambal Orange):** Drives hero actions, primary interaction states, active navigation tabs, and cooking timers. Evokes warmth, energy, and rich Indonesian seasoning.
- **Secondary (`#2F9E44` - Fresh Herb Green):** Applied deliberately for health indicators, budget badges (`Ekonomis`), vegetable/protein ratios, and success confirmations.
- **Tertiary & Border Accent (`#F3E5D8` - Warm Toasted Rice):** Serves as subtle division lines, structural card strokes, and neutral badge backgrounds to prevent harsh visual cuts.
- **Background (`#FFF8F0` - Warm Santan Cream):** The global canvas tone. Softens high-contrast glare during prolonged evening recipe browsing.
- **Surface Layer (`#FFFFFF` - Pure White):** Reserved for elevated cards, modal sheets, and recipe step trays to separate content from the canvas.
- **Neutral Primary (`#2B1B12` - Deep Roasted Cacao):** Headings, body copy, and iconography. Replaces standard harsh blacks (`#000000`) with high-contrast, warm organic legibility.
- **Neutral Muted (`#7A6A5F` - Spiced Cinnamon Sand):** Secondary metadata, cooking times, inactive tabs, and supporting recipe captions.

## Typography

The type hierarchy relies entirely on **Plus Jakarta Sans**, offering geometric clarity, generous x-height, and open apertures that maintain impeccable legibility on lower-end mobile devices and greasy kitchen screens.

- **Weight Pairing:** Bold and ExtraBold weights (`700`, `800`) are reserved for recipe titles, section headers, and price figures to enable fast scanning. Regular (`400`) and SemiBold (`600`) carry instructional prose and metric tags.
- **Numbers & Metrics:** Quantities (e.g., `15 Menit`, `Rp 8.500`, `2 Porsi`) use SemiBold/Bold styling to let student cooks skim ingredients rapidly while prepping at their kos desks.

## Layout & Spacing

A mobile-first fluid layout optimized for single-handed phone usage. 

### Grid & Canvas Structure
- **Mobile Handheld (360px - 428px):** Single-column content stack with standard `16px` outer margin. Multi-item sections (e.g., "Resep Hemat Kos Seminggu") use horizontal scroll rails snapping with `12px` gaps.
- **Tablet / Responsive Web (600px - 1024px):** Dual-column dynamic masonry cards with a `24px` gutter and maximum centered container width of `720px`.

### Spacing Cadence
- `space-xs` (4px): Micro-gaps between badge icons and textual labels.
- `space-sm` (8px): Gaps between pills, vertical separation of card meta lines.
- `space-md` (16px): Standard padding inside recipe cards, input fields, and bottom bar safe insets.
- `space-lg` (24px): Sectional rhythm separating grouped recipe categories.
- `space-xl` (32px): Deep breaks between major screen regions.

## Elevation & Depth

Visual hierarchy is maintained via gentle warm-tinted surface elevations rather than harsh gray drop shadows.

- **Resting Layer (Surface):** `#FFFFFF` cards sit over the `#FFF8F0` canvas supported by a 1px solid stroke in `#F3E5D8` and an ambient glow: `box-shadow: 0 4px 16px -2px rgba(43, 27, 18, 0.04)`.
- **Raised Interactive Layer (Hover / Active Card / Floating Action):** Elevated with `box-shadow: 0 8px 24px -4px rgba(232, 89, 12, 0.12)`.
- **Bottom Navigation Bar:** Fixed persistent surface rendered in `#FFFFFF` with top border `1px solid #F3E5D8` and elevation `box-shadow: 0 -4px 20px rgba(43, 27, 18, 0.05)`.
- **Overlays & Bottom Sheets:** Frosted backdrop tint using `rgba(43, 27, 18, 0.4)` with bottom sheets elevated via soft perimeter shading.

## Shapes

The design system incorporates friendly, inviting curvature across all containers:
- **Cards & Sheets (`rounded-2xl` / 16px):** All recipe cards, tips containers, category highlights, and bottom sheets adopt a 16px corner radius.
- **Badges, Tags, & Buttons (`rounded-full` / 9999px):** Filter pills, category selectors, budget tags, and primary action buttons utilize full pill shapes.
- **Image Frames:** Recipe header images and thumbnail cutouts inherit card radii or feature smooth organic 16px top corners when embedded in cards.

## Components

### 1. Buttons
- **Primary Button:** Filled `#E8590C` background, `#FFFFFF` text, `rounded-full`, height `48px`, font `label-lg`. Active tap state scales to `0.98` with `#C84807` fill.
- **Secondary / Ghost Button:** Transparent background, `1.5px` border in `#E8590C`, text `#E8590C`, `rounded-full`.
- **Floating Timer / Step Button:** High-prominence sticky button at bottom of recipe view (`#E8590C` pill with countdown icon and white text).

### 2. Badges & Chips (Pills)
- **Budget Badge:** Background `rgba(47, 158, 68, 0.12)`, text `#2F9E44`, 1px border `rgba(47, 158, 68, 0.25)`, `rounded-full`, padding `4px 12px`, `label-sm`.
- **Filter Chips:** Default state has `#FFFFFF` background with `1px solid #F3E5D8` and `#2B1B12` text. Selected state has `#E8590C` background with `#FFFFFF` text.

### 3. Recipe Cards
- **Structure:** Vertical container (`rounded-2xl`), pure `#FFFFFF` background, `1px solid #F3E5D8` stroke.
- **Media Asset:** Aspect ratio 16:10 top photo with a budget chip overlay (e.g., `Rp 7.500 / porsi`) anchored top-left and bookmark button anchored top-right.
- **Content:** Title in `headline-sm`, followed by a meta row showing cook time (`15 mnt`) and difficulty, capped with tag pills (`Rice Cooker`, `Anti Gagal`).

### 4. Input Fields & Search Bar
- **Search Header:** `#FFFFFF` fill with `1px solid #F3E5D8`, height `48px`, `rounded-full`, left magnifying glass icon, placeholder *"Cari resep telur, tempe, mie..."* in `#7A6A5F`. Focus ring: `2px solid #E8590C`.

### 5. Checkboxes & Cooking Step List
- **Checkboxes:** Smooth rounded-md (6px) box with `#F3E5D8` border when unchecked; filled `#2F9E44` with white checkmark when completed.
- **Step List:** Numbered circle badge (`28px` diameter, `#FFF8F0` fill, `#E8590C` bold text) placed adjacent to recipe instruction text. Striking through completed ingredients dims text to `#7A6A5F`.

### 6. Bottom Navigation Bar
- **Height & Inset:** `64px` height plus device safe area bottom padding.
- **4 App Tabs:** 
  1. **Beranda** (Home / Cooking pot icon)
  2. **Tips** (Lightbulb / Kitchen lifehacks icon)
  3. **Favorit** (Heart bookmark icon)
  4. **Profil** (User avatar icon)
- **Tab State:** Active tab shows `#E8590C` icon and label with an indicator micro-dot; inactive tabs display `#7A6A5F` with `label-md` font weight.
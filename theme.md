You are an expert Frontend Engineer and UI/UX Designer. Your task is to completely restyle the application using the specific 5-color palette provided below. Follow these exact mapping rules to ensure a professional, cohesive, and accessible user interface.

COLOR PALETTE CONFIGURATION:
- Base Dark: #212226 (Main background canvas)
- Surface Dark: #2a3b42 (Cards, panels, elevation layers)
- Brand Dark: #445a4d (Muted structural blocks, secondary focus)
- Accent Warm: #b8520a (Primary action, high-priority CTA, interactive highlights)
- Accent Light: #779e7f (Success states, secondary features, soft borders)

1. HTML TAG MAPPING
- <body>, <main>, <app>: Use #212226 for the background. Text color must be white or light gray (#f3f4f6).
- <header>, <nav>, <footer>: Use #2a3b42 for background to create a distinct structural anchoring from the main canvas.
- <section>, <article>, <aside>: Use #2a3b42 for container cards, or keep transparent with #445a4d used for subtle 1px dividers.
- <h1>, <h2>, <h3>: Pure white (#ffffff) for maximum readability.
- <h4>, <h5>, <h6>, <p>, <span>: Soft white/silver (#e5e7eb) to prevent visual fatigue.
- <a> (Anchor links): Use #779e7f for inline body links. Use #b8520a only if it acts as a standalone call-to-action.

2. TAILWIND CSS COMPONENT CONFIGURATION

Primary Buttons (High Priority CTAs)
- Background: bg-[#b8520a]
- Text: text-white
- Hover State: hover:bg-[#a04505] (slightly darker orange)
- Focus Ring: focus:ring-[#b8520a]

Secondary Buttons / Navigation Tabs
- Background: bg-[#445a4d]
- Text: text-[#e5e7eb]
- Hover State: hover:bg-[#779e7f] with text-[#212226]

Cards, Modals, & Dropdown Menus
- Background: bg-[#2a3b42]
- Borders: border-[#445a4d] (1px solid)
- Box Shadow: Smooth dark shadow (shadow-2xl shadow-[#111215]/50)

Form Inputs & Textareas
- Background: bg-[#212226]
- Border: border-[#445a4d]
- Focus State: focus:border-[#b8520a] and focus:ring-[#b8520a]
- Text entered: text-white
- Placeholder text: text-gray-400

Badges & Status Indicators
- Success/Active Badge: bg-[#779e7f]/20 text-[#779e7f] border border-[#779e7f]/30
- Warning/Attention Badge: bg-[#b8520a]/20 text-[#b8520a] border border-[#b8520a]/30

3. GLOBAL UI POLICIES
- Contrast: Do not overlay small white text directly onto #779e7f without checking readability. Instead, use #779e7f as background only for dark text (#212226), or use it purely as a text color on dark backgrounds.
- Balance: The accent color (#b8520a) should appear on no more than 2 or 3 elements on any given viewport screen to preserve its visual impact.

module.exports = {
  theme: {
    extend: {
      colors: {
        app: {
          base: '#212226',
          surface: '#2a3b42',
          forest: '#445a4d',
          orange: '#b8520a',
          sage: '#779e7f',
        },
      },
    },
  },
}


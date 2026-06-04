// Brand palette dùng CSS variables (RGB channels) → switch brand ở RUNTIME
// qua applyBrandTheme() (src/config/brand.config.ts). Fallback định nghĩa trong
// src/styles/globals.css :root. Dùng dạng `rgb(var(--brand-N) / <alpha-value>)`
// để vẫn hỗ trợ opacity modifier (vd: bg-brand-600/10).
const brandPalette = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((n) => [
    n,
    `rgb(var(--brand-${n}) / <alpha-value>)`,
  ]),
);

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html","./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
			boxShadow: {
				'surface-sm':
					'0 1px 2px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03)',
				'surface-md':
					'0 2px 6px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
				'surface-lg':
					'0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)',
				'brand-sm':
					'0 1px 3px var(--brand-glow)', // brand glow nhẹ
				'brand-md':
					'0 2px 8px var(--brand-glow), 0 1px 2px rgba(0,0,0,0.04)',
			},

  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
				brand: brandPalette,
				// emerald được dùng như "brand green" rải rác trong UI cũ →
				// alias sang palette brand để theo brand (Alliance/Quốc Nam).
				emerald: brandPalette,
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),    
    function ({ addUtilities }) {
      addUtilities({
        // Ẩn scrollbar hoàn toàn
        '.scrollbar-hide': {
          /* Firefox */
          'scrollbar-width': 'none',
          /* Safari and Chrome */
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        
        // Scrollbar mỏng cho desktop (optional)
        '.scrollbar-thin': {
          /* Firefox */
          'scrollbar-width': 'thin',
          /* Chrome, Safari */
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#cbd5e0',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover':  {
            background: '#a0aec0',
          },
        },
      });
    },
  ],
}

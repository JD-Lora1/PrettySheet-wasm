module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          900: '#1e293b',
        },
        blue: {
          600: '#2563eb',
        },
      },
      backgroundImage: {
        'gradient-to-br': 'linear-gradient(to bottom right, #f8fafc, #ebf8ff)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};
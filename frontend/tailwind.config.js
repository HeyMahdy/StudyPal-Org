export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        accent: '#7C3AED',
        appdark: '#0F172A'
      },
      fontFamily: {
        serif: ['Fraunces', 'serif']
      },
      borderRadius: {
        card: '22px'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
};
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // DevSuite Primary Orange
        'devsuite-primary': {
          50: '#FFF3E0',
          100: '#FFE8CC',
          200: '#FF8A65',
          300: '#FF7043',
          400: '#FC8019',
          500: '#E6722E',
          600: '#D84315',
          700: '#BF360C',
          DEFAULT: '#FC8019',
          hover: '#E6722E',
          active: '#D84315',
          light: '#FF7043',
          lighter: '#FF8A65',
          subtle: '#FFF3E0',
          'subtle-hover': '#FFE8CC'
        },
        // DevSuite Secondary Green
        'devsuite-secondary': {
          50: '#E8F5E8',
          100: '#C8E6C9',
          200: '#81C784',
          300: '#60B246',
          400: '#4CAF50',
          500: '#388E3C',
          600: '#2E7D32',
          700: '#1B5E20',
          DEFAULT: '#60B246',
          hover: '#388E3C',
          active: '#2E7D32',
          light: '#81C784',
          lighter: '#C8E6C9',
          subtle: '#E8F5E8',
          'subtle-hover': '#C8E6C9'
        },
        // DevSuite Tertiary Purple
        'devsuite-tertiary': {
          50: '#F3E5F5',
          100: '#CE93D8',
          200: '#AB47BC',
          300: '#8E24AA',
          400: '#7B1FA2',
          500: '#6A1B9A',
          600: '#4A148C',
          DEFAULT: '#8E24AA',
          hover: '#7B1FA2',
          active: '#6A1B9A',
          light: '#AB47BC',
          lighter: '#CE93D8',
          subtle: '#F3E5F5'
        },
        // Text Hierarchy
        text: {
          primary: '#1C1C1C',
          secondary: '#3E3E3E',
          tertiary: '#6B6B6B',
          quaternary: '#8E8E8E',
          quinary: '#B0B0B0',
          disabled: '#CCCCCC',
          placeholder: '#D3D3D3',
          inverse: '#FFFFFF'
        },
        // Background System
        bg: {
          primary: '#FFFFFF',
          secondary: '#FEFEFE',
          tertiary: '#FDFDFD',
          canvas: '#F8F8F8',
          muted: '#F5F5F5',
          subtle: '#F2F2F2',
          surface: '#EEEEEE',
          elevated: '#E8E8E8',
          overlay: 'rgba(28, 28, 28, 0.5)'
        },
        // Border System
        border: {
          subtle: '#F5F5F5',
          default: '#E0E0E0',
          strong: '#CCCCCC',
          interactive: '#BDBDBD',
          focus: '#FC8019'
        },
        // Semantic Colors
        success: {
          DEFAULT: '#4CAF50',
          light: '#E8F5E8',
          dark: '#2E7D32'
        },
        warning: {
          DEFAULT: '#FF9800',
          light: '#FFF3E0',
          dark: '#F57C00'
        },
        error: {
          DEFAULT: '#F44336',
          light: '#FFEBEE',
          dark: '#C62828'
        },
        info: {
          DEFAULT: '#2196F3',
          light: '#E3F2FD',
          dark: '#1565C0'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      boxShadow: {
        'devsuite': '0 2px 8px rgba(0,0,0,0.06)',
        'devsuite-hover': '0 4px 16px rgba(0,0,0,0.12)',
        'devsuite-modal': '0 20px 60px rgba(0, 0, 0, 0.3)'
      }
    },
  },
  plugins: [],
};
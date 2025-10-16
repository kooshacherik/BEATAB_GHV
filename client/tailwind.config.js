// client/tailwind.config.js

import plugin from 'tailwindcss/plugin';
import tailwindScrollbar from 'tailwind-scrollbar';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#050816",
        secondary: "#aaa6c3",
        tertiary: "#151030",
        "black100": "#100d25",
        "black200": "#090325",
        "white100": "#f3f3f3",
        cyan: {
          DEFAULT: '#00F6FF',
          '50': '#E0FFFF',
          '100': '#BFFFFF',
          '200': '#80FFFF',
          '300': '#40FFFF',
          '400': '#00FFFF',
          '500': '#00F6FF',
          '600': '#00CACA',
          '700': '#009595',
          '800': '#006060',
          '900': '#002B2B',
        },
        red: {
          '400': '#FF00FF',
        },
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translate3d(0, 30px, 0) scale(0.95)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 5px 0px var(--tw-shadow-color)' },
          '50%': { boxShadow: '0 0 15px 5px var(--tw-shadow-color)' },
        },
        fadeInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(100%)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.9)' }, to: { opacity: '1', transform: 'scale(1)' } },
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        floatOne: { '0%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(-20px) rotate(5deg)' }, '100%': { transform: 'translateY(0) rotate(0deg)' } },
        floatTwo: { '0%': { transform: 'translateY(0) rotate(0deg)' }, '50%': { transform: 'translateY(20px) rotate(-5deg)' }, '100%': { transform: 'translateY(0) rotate(0deg)' } },
        floatThree: { '0%': { transform: 'translateX(0) rotate(45deg)' }, '50%': { transform: 'translateX(20px) rotate(50deg)' }, '100%': { transform: 'translateX(0) rotate(45deg)' } },
        bounceOnce: { '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-10px)' }, '60%': { transform: 'translateY(-5px)' } },

        // New animation for pulse effect
        'pulse-light': {
          '0%': { boxShadow: '0 0 0 0 rgba(103, 232, 249, 0.7)' }, /* cyan-400 */
          '70%': { boxShadow: '0 0 0 10px rgba(103, 232, 249, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(103, 232, 249, 0)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.5s ease-out forwards',
        'pulse-glow': 'pulse-glow 2.5s infinite ease-in-out',
        fadeInRight: 'fadeInRight 0.5s ease-out forwards',
        slideDown: 'slideDown 0.3s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
        scaleIn: 'scaleIn 0.3s ease-out forwards',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        floatOne: 'floatOne 8s ease-in-out infinite',
        floatTwo: 'floatTwo 10s ease-in-out infinite reverse',
        floatThree: 'floatThree 12s ease-in-out infinite',
        bounceOnce: 'bounceOnce 1s ease-in-out',

        // Applying the new animation
        'pulse-light': 'pulse-light 1.5s infinite',
      },
    },
  },
  plugins: [
    tailwindScrollbar,
    plugin(function({ addComponents, theme }) {
      addComponents({
        '.sci-fi-button': {
          '@apply relative px-5 py-2 text-white uppercase tracking-widest transition-all duration-300 ease-in-out font-mono text-sm': {},
          background: `linear-gradient(45deg, rgba(0,246,255,0.1), rgba(0,100,255,0.1))`,
          border: `1px solid ${theme('colors.cyan.500')}80`,
          boxShadow: `0 0 5px ${theme('colors.cyan.500')}4D`,
          '&:hover': {
            background: `linear-gradient(45deg, rgba(0,246,255,0.2), rgba(0,100,255,0.2))`,
            borderColor: theme('colors.cyan.500'),
            boxShadow: `0 0 15px ${theme('colors.cyan.500')}`,
            transform: 'translateY(-2px)',
            animation: 'pulse-light 1.5s infinite', // Apply the pulse-light animation on hover
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: `0 0 5px ${theme('colors.cyan.500')}`,
          },
          '&::before, &::after': {
            content: "''",
            position: 'absolute',
            width: '10px',
            height: '10px',
            border: `1px solid ${theme('colors.cyan.500')}`,
            transition: 'all 0.3s ease-in-out',
          },
          '&::before': {
            top: '-3px',
            left: '-3px',
            borderRight: 'none',
            borderBottom: 'none',
          },
          '&::after': {
            bottom: '-3px',
            right: '-3px',
            borderLeft: 'none',
            borderTop: 'none',
          },
          '&:hover::before, &:hover::after': {
            width: 'calc(100% + 5px)',
            height: 'calc(100% + 5px)',
          },
        },
        '.sci-fi-button-round': {
          '@apply relative w-12 h-12 flex items-center justify-center rounded-full text-white text-xl transition-all duration-300 ease-in-out': {},
          background: `linear-gradient(45deg, rgba(0,246,255,0.1), rgba(0,100,255,0.1))`,
          border: `1px solid ${theme('colors.cyan.500')}80`,
          boxShadow: `0 0 5px ${theme('colors.cyan.500')}4D`,
          '&:hover': {
            background: `linear-gradient(45deg, rgba(0,246,255,0.2), rgba(0,100,255,0.2))`,
            borderColor: theme('colors.cyan.500'),
            boxShadow: `0 0 15px ${theme('colors.cyan.500')}`,
            transform: 'scale(1.05)',
            animation: 'pulse-light 1.5s infinite', // Apply the pulse-light animation on hover
          },
          '&:active': {
            transform: 'scale(1)',
            boxShadow: `0 0 5px ${theme('colors.cyan.500')}`,
          },
          '&::before, &::after': {
            content: "''",
            position: 'absolute',
            width: '8px',
            height: '8px',
            border: `1px solid ${theme('colors.cyan.500')}`,
            transition: 'all 0.3s ease-in-out',
          },
          '&::before': {
            top: '-2px',
            left: '-2px',
            borderRight: 'none',
            borderBottom: 'none',
            borderRadius: '4px 0 0 0',
          },
          '&::after': {
            bottom: '-2px',
            right: '-2px',
            borderLeft: 'none',
            borderTop: 'none',
            borderRadius: '0 0 4px 0',
          },
          '&:hover::before, &:hover::after': {
            width: '50%',
            height: '50%',
          },
        },
        '.sci-fi-input': {
          '@apply bg-black/30 border text-cyan-200 placeholder-cyan-500 rounded-md py-2 px-4 transition-all duration-300': {},
          borderColor: theme('colors.cyan.700'),
          '&:focus': {
            borderColor: theme('colors.cyan.400'),
            ring: '1px',
            ringColor: theme('colors.cyan.400'),
            boxShadow: `0 0 8px ${theme('colors.cyan.500')}80, inset 0 0 5px ${theme('colors.cyan.500')}33`,
            outline: 'none',
          },
        },
      });
    }),
  ],
};
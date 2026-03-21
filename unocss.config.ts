import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: {
    'bg-home': 'bg-[url("/src/assets/backgrounds/home.png")] bg-cover bg-center bg-no-repeat',
    'bg-shop': 'bg-[url("/src/assets/backgrounds/shop.png")] bg-cover bg-center bg-no-repeat',
    outlined: [
      'text-white',
      '[text-shadow:-1px_-1px_0_var(--outline),1px_-1px_0_var(--outline),-1px_1px_0_var(--outline),1px_1px_0_var(--outline)]',
    ],
    'shadow-card':
      'shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_0px_4px_2px_rgba(0,0,0,0.25)]',
    'btn-orange':
      'bg-[#fb7a38] shadow-[inset_0px_-3px_4px_rgba(0,0,0,0.25),inset_0px_1px_0px_rgba(255,255,255,0.25)]',
    'shop-card':
      'bg-[#fde7b8] border-8 border-[#cf8741] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_0px_4px_2px_rgba(0,0,0,0.25)] rounded-[32px]',
    'btn-gradient-orange':
      'bg-[linear-gradient(360deg,#fda109_0%,#f96a07_100%)] shadow-[inset_0px_-2px_2px_#ffe120,inset_0px_2px_2px_#ffe120] rounded-2xl',
  },
})

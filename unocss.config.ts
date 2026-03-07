import { defineConfig } from 'unocss'

export default defineConfig({
  shortcuts: {
    'bg-home': 'bg-[url("/src/assets/backgrounds/home.png")] bg-cover bg-center bg-no-repeat',
    'bg-shop': 'bg-[url("/src/assets/backgrounds/shop.png")] bg-cover bg-center bg-no-repeat',
    // 'outlined-text': [
    //   'text-white',
    //   '[text-shadow:-1px_-1px_0_#532b23,1px_-1px_0_#532b23,-1px_1px_0_#532b23,1px_1px_0_#532b23]',
    // ],
    outlined: [
      'text-white',
      '[text-shadow:-1px_-1px_0_var(--outline),1px_-1px_0_var(--outline),-1px_1px_0_var(--outline),1px_1px_0_var(--outline)]',
    ],
  },
})

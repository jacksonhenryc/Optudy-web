import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    base: '/Optudy-web/',
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                login: resolve(__dirname, 'login.html'),
                signup: resolve(__dirname, 'signup.html'),
            },
        },
    },
})

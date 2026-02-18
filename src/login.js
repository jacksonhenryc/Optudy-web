// Login page logic
import { signIn, redirectIfLoggedIn } from './auth.js'

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    redirectIfLoggedIn()

    const form = document.getElementById('login-form')
    const errorEl = document.getElementById('error-message')
    const btn = document.getElementById('login-btn')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        errorEl.classList.remove('visible')
        btn.disabled = true
        btn.textContent = 'Signing in...'

        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value

        const { data, error } = await signIn(email, password)

        if (error) {
            errorEl.textContent = error.message
            errorEl.classList.add('visible')
            btn.disabled = false
            btn.textContent = 'Sign In'
            return
        }

        // Success — redirect to dashboard
        window.location.href = '/index.html'
    })
})

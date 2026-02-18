// Signup page logic
import { signUp, redirectIfLoggedIn } from './auth.js'

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    redirectIfLoggedIn()

    const form = document.getElementById('signup-form')
    const errorEl = document.getElementById('error-message')
    const btn = document.getElementById('signup-btn')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        errorEl.classList.remove('visible')

        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value
        const confirmPassword = document.getElementById('confirm-password').value

        // Validate passwords match
        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match.'
            errorEl.classList.add('visible')
            return
        }

        btn.disabled = true
        btn.textContent = 'Creating account...'

        const { data, error } = await signUp(email, password)

        if (error) {
            errorEl.textContent = error.message
            errorEl.classList.add('visible')
            btn.disabled = false
            btn.textContent = 'Create Account'
            return
        }

        // Success — redirect to login with message
        // Supabase may require email confirmation depending on project settings
        errorEl.style.background = '#ecfdf5'
        errorEl.style.color = '#065f46'
        errorEl.style.borderColor = '#a7f3d0'
        errorEl.textContent = 'Account created! Check your email to confirm, then sign in.'
        errorEl.classList.add('visible')
        btn.disabled = false
        btn.textContent = 'Create Account'

        // Auto redirect after 3 seconds
        setTimeout(() => {
            window.location.href = import.meta.env.BASE_URL + 'login.html'
        }, 3000)
    })
})

// ============================================
// OptiStudy Engine — Dashboard App
// ============================================

import Chart from 'chart.js/auto'
import { requireAuth, signOut, getUser } from './auth.js'
import {
    saveSubjects, loadSubjects, saveSchedule, saveSettings, loadSettings,
    saveChapters, loadChapters, saveResources, loadResources,
    updateChapterTime, updateChapterNotes, updateChapterStatus
} from './db.js'

const CHART_COLORS = ['#e0b830', '#2d2d2d', '#e74c3c', '#3498db', '#9b59b6', '#4caf50', '#e67e22', '#1abc9c']

const state = {
    schedule: null,
    charts: { distribution: null, urgency: null },
    timer: { running: false, seconds: 0, interval: null, goalMinutes: 60 },
    // Subject detail state
    detail: {
        subjectIdx: null,
        subjectId: null,  // Supabase UUID or local key
        chapters: [],
        activeChapterIdx: null,
        chapterTimer: { running: false, seconds: 0, interval: null }
    }
}

let elements = {}

// Calendar page state
const calendarState = {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    selectedDate: null
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', async () => {
    const user = await requireAuth()

    elements = {
        userName: document.getElementById('user-name'),
        profileName: document.getElementById('profile-name'),
        profileEmail: document.getElementById('profile-email'),
        settingsEmail: document.getElementById('settings-email'),
        userAvatar: document.getElementById('user-avatar'),
        settingsToggle: document.getElementById('settings-toggle'),
        settingsOverlay: document.getElementById('settings-overlay'),
        settingsClose: document.getElementById('settings-close'),
        logoutBtn: document.getElementById('logout-btn'),
        totalHoursInput: document.getElementById('total-hours'),
        maxPerSubject: document.getElementById('max-per-subject'),
        startDate: document.getElementById('start-date'),
        subjectsContainer: document.getElementById('subjects-container'),
        addSubjectBtn: document.getElementById('add-subject-btn'),
        backToDash: document.getElementById('back-to-dash'),
        generateBtn: document.getElementById('generate-btn'),
        loadDemoBtn: document.getElementById('load-demo-btn'),
        statSubjects: document.getElementById('stat-subjects'),
        statNextExam: document.getElementById('stat-next-exam'),
        statTodayHours: document.getElementById('stat-today-hours'),
        statPreparedness: document.getElementById('stat-preparedness'),
        bigSubjects: document.getElementById('big-subjects'),
        bigExams: document.getElementById('big-exams'),
        bigHours: document.getElementById('big-hours'),
        psSubjects: document.getElementById('ps-subjects'),
        psTotalHours: document.getElementById('ps-total-hours'),
        weeklyHours: document.getElementById('weekly-hours'),
        weeklyBars: document.getElementById('weekly-bars'),
        timerDisplay: document.getElementById('timer-display'),
        timerRing: document.getElementById('timer-ring'),
        timerStart: document.getElementById('timer-start'),
        timerPause: document.getElementById('timer-pause'),
        timerReset: document.getElementById('timer-reset'),
        overallPrep: document.getElementById('overall-prep'),
        prepBars: document.getElementById('prep-bars'),
        calGrid: document.getElementById('cal-grid'),
        calMonth: document.getElementById('cal-month'),
        todayList: document.getElementById('today-list'),
        todayDone: document.getElementById('today-done'),
        todayTotal: document.getElementById('today-total'),
        scheduleContent: document.getElementById('schedule-content'),
        scheduleBadge: document.getElementById('schedule-badge'),
        explanationText: document.getElementById('explanation-text'),
        subjectTemplate: document.getElementById('subject-template'),

        navTabs: document.querySelectorAll('.nav-tab'),
        views: {
            dashboard: document.getElementById('view-dashboard'),
            subjects: document.getElementById('view-subjects'),
            schedule: document.getElementById('view-schedule'),
            analytics: document.getElementById('view-analytics'),
            'subject-detail': document.getElementById('view-subject-detail'),
            calendar: document.getElementById('view-calendar')
        },

        // Calendar elements
        calFullGrid: document.getElementById('cal-full-grid'),
        calFullMonth: document.getElementById('cal-full-month'),
        calFullPrev: document.getElementById('cal-full-prev'),
        calFullNext: document.getElementById('cal-full-next'),
        calDayDetails: document.getElementById('cal-day-details'),

        // AI Chat elements
        aiChatMessages: document.getElementById('ai-chat-messages'),
        aiChatInput: document.getElementById('ai-chat-input'),
        aiSendBtn: document.getElementById('ai-send-btn'),
        aiSuggestions: document.getElementById('ai-suggestions'),
        aiChatClear: document.getElementById('ai-chat-clear'),

        // Notifications
        notifList: document.getElementById('notif-list'),
        notifCount: document.getElementById('notif-count'),
        notifClearAll: document.getElementById('notif-clear-all'),

        // Subject Detail elements
        detailBackBtn: document.getElementById('detail-back-btn'),
        detailSubjectName: document.getElementById('detail-subject-name'),
        detailExamDate: document.getElementById('detail-exam-date'),
        detailDifficulty: document.getElementById('detail-difficulty'),
        detailPrepBadge: document.getElementById('detail-prep-badge'),
        detailProgressText: document.getElementById('detail-progress-text'),
        detailProgressFill: document.getElementById('detail-progress-fill'),
        addChapterBtn: document.getElementById('add-chapter-btn'),
        chapterList: document.getElementById('chapter-list'),
        contentPlaceholder: document.getElementById('content-placeholder'),
        activeChapterContent: document.getElementById('active-chapter-content'),
        contentChapterName: document.getElementById('content-chapter-name'),
        chapterStatusSelect: document.getElementById('chapter-status-select'),
        chTimeSpent: document.getElementById('ch-time-spent'),
        chTimerStart: document.getElementById('ch-timer-start'),
        chTimerStop: document.getElementById('ch-timer-stop'),
        chapterNotes: document.getElementById('chapter-notes'),
        resourcesList: document.getElementById('resources-list'),
        addResourceBtn: document.getElementById('add-resource-btn'),

        // Resource Modal
        resourceModal: document.getElementById('resource-modal'),
        resourceModalClose: document.getElementById('resource-modal-close'),
        resourceTitle: document.getElementById('resource-title'),
        resourceUrl: document.getElementById('resource-url'),
        resourceType: document.getElementById('resource-type'),
        resourceCancel: document.getElementById('resource-cancel'),
        resourceSave: document.getElementById('resource-save'),
        urlInputGroup: document.getElementById('url-input-group'),
        fileInputGroup: document.getElementById('file-input-group'),
        resourceFile: document.getElementById('resource-file'),
        fileUploadArea: document.getElementById('file-upload-area'),
        fileUploadContent: document.getElementById('file-upload-content'),
        fileUploadProgress: document.getElementById('file-upload-progress'),
        fileUploadName: document.getElementById('file-upload-name'),
        fileUploadSize: document.getElementById('file-upload-size'),
        fileUploadClear: document.getElementById('file-upload-clear')
    }

    if (user) {
        const name = user.email ? user.email.split('@')[0] : 'Student'
        elements.userName.textContent = name
        elements.profileName.textContent = name
        elements.profileEmail.textContent = user.email || ''
        elements.settingsEmail.textContent = user.email || ''
    }

    elements.startDate.value = getDateInDays(0)
    setupEventListeners()
    await loadSavedData()
    updateDashboardStats()
})

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Navigation
    elements.navTabs.forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view))
    })

    // Settings
    elements.settingsToggle.addEventListener('click', () => elements.settingsOverlay.classList.remove('hidden'))
    elements.settingsClose.addEventListener('click', () => elements.settingsOverlay.classList.add('hidden'))
    elements.settingsOverlay.addEventListener('click', (e) => {
        if (e.target === elements.settingsOverlay) elements.settingsOverlay.classList.add('hidden')
    })
    elements.logoutBtn.addEventListener('click', signOut)
    elements.userAvatar.addEventListener('click', () => elements.settingsOverlay.classList.remove('hidden'))

    // Subjects
    elements.addSubjectBtn.addEventListener('click', () => addSubject())
    elements.backToDash.addEventListener('click', () => switchView('dashboard'))

    // Generate
    elements.generateBtn.addEventListener('click', async () => {
        generateSchedule()
        await persistData()
        updateDashboardStats()
    })
    elements.loadDemoBtn.addEventListener('click', loadDemoScenario)

    // Subject container — delegated events
    elements.subjectsContainer.addEventListener('click', (e) => {
        // Remove subject
        const rmBtn = e.target.closest('.remove-btn')
        if (rmBtn) {
            const item = rmBtn.closest('.subject-item')
            item.style.opacity = '0'
            item.style.transform = 'translateY(-10px)'
            item.style.transition = 'all 0.25s ease'
            setTimeout(() => { item.remove(); persistData(); updateDashboardStats(); }, 250)
            return
        }
        // Open detail
        const openBtn = e.target.closest('.open-detail-btn')
        if (openBtn) {
            const item = openBtn.closest('.subject-item')
            const items = [...elements.subjectsContainer.querySelectorAll('.subject-item')]
            const idx = items.indexOf(item)
            openSubjectDetail(idx)
        }
    })

    // Range display + live title
    elements.subjectsContainer.addEventListener('input', (e) => {
        if (e.target.type === 'range') {
            const val = e.target.parentElement.querySelector('.range-val')
            if (val) val.textContent = e.target.value
        }
        if (e.target.classList.contains('subject-name')) {
            const title = e.target.closest('.subject-item').querySelector('.subject-title-display')
            title.textContent = e.target.value || 'New Subject'
        }
    })

    // Dashboard Timer
    elements.timerStart.addEventListener('click', startTimer)
    elements.timerPause.addEventListener('click', pauseTimer)
    elements.timerReset.addEventListener('click', resetTimer)

    // Auto-save
    elements.totalHoursInput.addEventListener('change', () => { persistData(); updateDashboardStats(); })
    elements.maxPerSubject.addEventListener('change', persistData)
    elements.startDate.addEventListener('change', persistData)

    // Notifications clear
    elements.notifClearAll.addEventListener('click', () => {
        elements.notifList.innerHTML = '<div class="notif-empty">No notifications — you\'re all caught up! 🎉</div>'
        elements.notifCount.textContent = '0'
        elements.notifCount.setAttribute('data-zero', 'true')
    })

    // AI Chat
    elements.aiSendBtn.addEventListener('click', sendAiMessage)
    elements.aiChatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage() }
    })
    elements.aiSuggestions.addEventListener('click', (e) => {
        const chip = e.target.closest('.ai-suggestion-chip')
        if (chip) {
            elements.aiChatInput.value = chip.textContent
            sendAiMessage()
        }
    })
    elements.aiChatClear.addEventListener('click', () => {
        elements.aiChatMessages.innerHTML = `
            <div class="ai-msg ai-msg-bot">
                <div class="ai-msg-avatar">\ud83e\udde0</div>
                <div class="ai-msg-bubble"><p>Chat cleared. How can I help you?</p></div>
            </div>
        `
    })

    // Calendar navigation
    elements.calFullPrev.addEventListener('click', () => {
        calendarState.month--
        if (calendarState.month < 0) { calendarState.month = 11; calendarState.year-- }
        renderFullCalendar()
    })
    elements.calFullNext.addEventListener('click', () => {
        calendarState.month++
        if (calendarState.month > 11) { calendarState.month = 0; calendarState.year++ }
        renderFullCalendar()
    })

    // ---- Subject Detail listeners ----
    elements.detailBackBtn.addEventListener('click', () => {
        stopChapterTimer()
        switchView('subjects')
    })

    elements.addChapterBtn.addEventListener('click', () => {
        const ch = {
            name: `Chapter ${state.detail.chapters.length + 1}`,
            notes: '',
            status: 'not_started',
            timeSpent: 0,
            resources: []
        }
        state.detail.chapters.push(ch)
        renderChapterList()
        saveCurrentChapters()
    })

    // Chapter status change
    elements.chapterStatusSelect.addEventListener('change', () => {
        const idx = state.detail.activeChapterIdx
        if (idx === null) return
        state.detail.chapters[idx].status = elements.chapterStatusSelect.value
        renderChapterList()
        updateDetailProgress()
        saveCurrentChapters()
    })

    // Notes auto-save
    let notesTimer = null
    elements.chapterNotes.addEventListener('input', () => {
        const idx = state.detail.activeChapterIdx
        if (idx === null) return
        state.detail.chapters[idx].notes = elements.chapterNotes.value
        clearTimeout(notesTimer)
        notesTimer = setTimeout(() => saveCurrentChapters(), 800)
    })

    // Chapter timer
    elements.chTimerStart.addEventListener('click', startChapterTimer)
    elements.chTimerStop.addEventListener('click', stopChapterTimer)

    // Resource modal
    elements.addResourceBtn.addEventListener('click', openResourceModal)
    elements.resourceModalClose.addEventListener('click', closeResourceModal)
    elements.resourceCancel.addEventListener('click', closeResourceModal)
    elements.resourceModal.addEventListener('click', (e) => {
        if (e.target === elements.resourceModal) closeResourceModal()
    })
    elements.resourceSave.addEventListener('click', addResource)

    // Type switcher — show/hide URL vs file upload
    elements.resourceType.addEventListener('change', () => {
        const isPdf = elements.resourceType.value === 'pdf'
        elements.urlInputGroup.classList.toggle('hidden', isPdf)
        elements.fileInputGroup.classList.toggle('hidden', !isPdf)
    })

    // File upload handlers
    elements.resourceFile.addEventListener('change', handleFileSelect)
    elements.fileUploadClear.addEventListener('click', (e) => {
        e.stopPropagation()
        clearFileUpload()
    })

    // Drag-and-drop
    const fua = elements.fileUploadArea
    fua.addEventListener('dragover', (e) => { e.preventDefault(); fua.classList.add('drag-over') })
    fua.addEventListener('dragleave', () => fua.classList.remove('drag-over'))
    fua.addEventListener('drop', (e) => {
        e.preventDefault()
        fua.classList.remove('drag-over')
        const file = e.dataTransfer.files[0]
        if (file && file.type === 'application/pdf') {
            elements.resourceFile.files = e.dataTransfer.files
            handleFileSelect()
        }
    })
}

// ============================================
// VIEW SWITCHING
// ============================================
function switchView(viewName) {
    elements.navTabs.forEach(t => t.classList.toggle('active', t.dataset.view === viewName))
    Object.entries(elements.views).forEach(([name, el]) => {
        if (el) el.classList.toggle('active-view', name === viewName)
    })
    if (viewName === 'calendar') renderFullCalendar()
}

// ============================================
// SUBJECT MANAGEMENT
// ============================================
function addSubject(data = null) {
    const clone = elements.subjectTemplate.content.cloneNode(true)
    if (data) {
        clone.querySelector('.subject-name').value = data.name || ''
        clone.querySelector('.subject-title-display').textContent = data.name || 'New Subject'
        clone.querySelector('.exam-date').value = data.examDate || ''
        const diff = clone.querySelector('.difficulty')
        diff.value = data.difficulty || 3
        diff.parentElement.querySelector('.range-val').textContent = data.difficulty || 3
        const prep = clone.querySelector('.preparedness')
        prep.value = data.preparedness || 3
        prep.parentElement.querySelector('.range-val').textContent = data.preparedness || 3
        clone.querySelector('.chapters').value = data.chapters || 5
    }
    elements.subjectsContainer.appendChild(clone)
    updateDashboardStats()
}

function getSubjectsFromDOM() {
    const items = document.querySelectorAll('.subject-item')
    const subjects = []
    items.forEach(item => {
        const name = item.querySelector('.subject-name').value || 'Untitled'
        const examDate = item.querySelector('.exam-date').value
        const difficulty = parseInt(item.querySelector('.difficulty').value)
        const preparedness = parseInt(item.querySelector('.preparedness').value)
        const chapters = parseInt(item.querySelector('.chapters').value)
        if (examDate && !isNaN(difficulty) && !isNaN(preparedness) && !isNaN(chapters)) {
            subjects.push({ name, examDate, difficulty, preparedness, chapters })
        }
    })
    return subjects
}

// ============================================
// SUBJECT DETAIL VIEW
// ============================================
async function openSubjectDetail(idx) {
    const items = [...elements.subjectsContainer.querySelectorAll('.subject-item')]
    const item = items[idx]
    if (!item) return

    const name = item.querySelector('.subject-name').value || 'Untitled'
    const examDate = item.querySelector('.exam-date').value || '—'
    const difficulty = item.querySelector('.difficulty').value || 3
    const preparedness = item.querySelector('.preparedness').value || 3
    const chaptersCount = parseInt(item.querySelector('.chapters').value) || 5

    state.detail.subjectIdx = idx
    state.detail.subjectId = `local_${idx}_${name.replace(/\s/g, '_')}`
    state.detail.activeChapterIdx = null

    // Header info
    elements.detailSubjectName.textContent = name
    elements.detailExamDate.textContent = `Exam: ${examDate}`
    elements.detailDifficulty.textContent = `Difficulty: ${difficulty}/5`
    elements.detailPrepBadge.textContent = `Prep: ${preparedness}/5`

    // Load chapters
    const saved = await loadChapters(state.detail.subjectId)
    if (saved && saved.length > 0) {
        state.detail.chapters = saved.map(ch => ({
            ...ch,
            resources: []
        }))
    } else {
        // Auto-generate chapters based on chapter count
        state.detail.chapters = []
        for (let i = 0; i < chaptersCount; i++) {
            state.detail.chapters.push({
                name: `Chapter ${i + 1}`,
                notes: '',
                status: 'not_started',
                timeSpent: 0,
                resources: []
            })
        }
        saveCurrentChapters()
    }

    // Reset content panel
    elements.contentPlaceholder.style.display = 'flex'
    elements.activeChapterContent.classList.add('hidden')

    renderChapterList()
    updateDetailProgress()
    switchView('subject-detail')
}

function renderChapterList() {
    const chapters = state.detail.chapters
    if (chapters.length === 0) {
        elements.chapterList.innerHTML = '<div class="empty-state" style="padding:20px">No chapters yet. Click + Add.</div>'
        return
    }

    elements.chapterList.innerHTML = ''
    chapters.forEach((ch, i) => {
        const card = document.createElement('div')
        card.className = `chapter-card${state.detail.activeChapterIdx === i ? ' active' : ''}`
        card.dataset.idx = i

        const timeStr = ch.timeSpent >= 60
            ? `${Math.floor(ch.timeSpent / 60)}h ${ch.timeSpent % 60}m`
            : `${ch.timeSpent}m`

        card.innerHTML = `
            <div class="chapter-num">${i + 1}</div>
            <div class="chapter-card-info">
                <div class="chapter-card-name">${ch.name}</div>
                <div class="chapter-card-meta">
                    <span>⏱ ${timeStr}</span>
                    <span>${ch.notes ? '📝' : ''}</span>
                </div>
            </div>
            <div class="chapter-card-status ${ch.status}"></div>
            <button class="chapter-remove" title="Remove chapter">✕</button>
        `

        // Click to open chapter content
        card.addEventListener('click', (e) => {
            if (e.target.closest('.chapter-remove')) return
            openChapterContent(i)
        })

        // Remove chapter
        card.querySelector('.chapter-remove').addEventListener('click', (e) => {
            e.stopPropagation()
            state.detail.chapters.splice(i, 1)
            if (state.detail.activeChapterIdx === i) {
                state.detail.activeChapterIdx = null
                elements.contentPlaceholder.style.display = 'flex'
                elements.activeChapterContent.classList.add('hidden')
            } else if (state.detail.activeChapterIdx > i) {
                state.detail.activeChapterIdx--
            }
            renderChapterList()
            updateDetailProgress()
            saveCurrentChapters()
        })

        elements.chapterList.appendChild(card)
    })
}

async function openChapterContent(idx) {
    stopChapterTimer() // Stop any running chapter timer
    state.detail.activeChapterIdx = idx
    const ch = state.detail.chapters[idx]

    // Highlight in list
    elements.chapterList.querySelectorAll('.chapter-card').forEach((c, i) => {
        c.classList.toggle('active', i === idx)
    })

    // Show content panel
    elements.contentPlaceholder.style.display = 'none'
    elements.activeChapterContent.classList.remove('hidden')

    // Fill content
    elements.contentChapterName.textContent = ch.name

    // Make chapter name editable
    elements.contentChapterName.contentEditable = true
    elements.contentChapterName.addEventListener('blur', () => {
        const newName = elements.contentChapterName.textContent.trim()
        if (newName && newName !== ch.name) {
            ch.name = newName
            renderChapterList()
            saveCurrentChapters()
        }
    }, { once: true })

    elements.chapterStatusSelect.value = ch.status
    elements.chapterNotes.value = ch.notes || ''
    elements.chTimeSpent.textContent = formatMinutes(ch.timeSpent)

    // Load resources for this chapter
    const chKey = `${state.detail.subjectId}_ch${idx}`
    const resources = await loadResources(chKey)
    ch.resources = resources || []
    renderResources()
}

function updateDetailProgress() {
    const total = state.detail.chapters.length
    const done = state.detail.chapters.filter(c => c.status === 'completed').length
    elements.detailProgressText.textContent = `${done} / ${total} completed`
    const pct = total > 0 ? (done / total) * 100 : 0
    elements.detailProgressFill.style.width = pct + '%'
}

// ============================================
// CHAPTER TIMER
// ============================================
function startChapterTimer() {
    const idx = state.detail.activeChapterIdx
    if (idx === null) return
    const ch = state.detail.chapters[idx]
    state.detail.chapterTimer.running = true
    state.detail.chapterTimer.seconds = 0

    elements.chTimerStart.classList.add('hidden')
    elements.chTimerStop.classList.remove('hidden')

    // Also update status to in_progress if not started
    if (ch.status === 'not_started') {
        ch.status = 'in_progress'
        elements.chapterStatusSelect.value = 'in_progress'
        renderChapterList()
        updateDetailProgress()
    }

    state.detail.chapterTimer.interval = setInterval(() => {
        state.detail.chapterTimer.seconds++
        // Update every 60 seconds
        if (state.detail.chapterTimer.seconds % 60 === 0) {
            ch.timeSpent++
            elements.chTimeSpent.textContent = formatMinutes(ch.timeSpent)
            renderChapterList()
            saveCurrentChapters()
        }
    }, 1000)
}

function stopChapterTimer() {
    if (!state.detail.chapterTimer.running) return
    state.detail.chapterTimer.running = false
    clearInterval(state.detail.chapterTimer.interval)

    elements.chTimerStart.classList.remove('hidden')
    elements.chTimerStop.classList.add('hidden')

    // Save partial minute
    const idx = state.detail.activeChapterIdx
    if (idx !== null && state.detail.chapterTimer.seconds > 0) {
        const extraMins = Math.ceil(state.detail.chapterTimer.seconds / 60)
        if (state.detail.chapterTimer.seconds % 60 !== 0) {
            // Don't double-count — only add the leftover fraction
        }
        saveCurrentChapters()
    }
    state.detail.chapterTimer.seconds = 0
}

// ============================================
// RESOURCES
// ============================================
function renderResources() {
    const idx = state.detail.activeChapterIdx
    if (idx === null) return
    const resources = state.detail.chapters[idx].resources || []

    if (resources.length === 0) {
        elements.resourcesList.innerHTML = '<p class="text-muted" style="font-size:0.82rem;color:var(--text-400);">No resources added yet.</p>'
        return
    }

    const typeIcons = { link: '🔗', video: '🎥', pdf: '📄', note: '📝' }

    elements.resourcesList.innerHTML = ''
    resources.forEach((r, ri) => {
        const item = document.createElement('div')
        item.className = 'resource-item'

        // For PDFs with data URL, show an Open button
        let actionHtml = ''
        if (r.type === 'pdf' && r.fileData) {
            actionHtml = `<a class="resource-open" href="#" data-ridx="${ri}">Open PDF</a>`
        } else if (r.url) {
            actionHtml = `<a href="${r.url}" target="_blank" class="resource-open">Open ↗</a>`
        }

        item.innerHTML = `
            <div class="resource-icon">${typeIcons[r.type] || '🔗'}</div>
            <div class="resource-info">
                <div class="resource-title">${r.title}</div>
                ${r.url && !r.fileData ? `<a href="${r.url}" target="_blank" class="resource-url">${r.url}</a>` : ''}
                ${r.fileName ? `<span class="resource-url">${r.fileName}</span>` : ''}
            </div>
            ${actionHtml}
            <button class="resource-remove" title="Remove">✕</button>
        `

        // Open PDF from data URL
        const openLink = item.querySelector('.resource-open[data-ridx]')
        if (openLink) {
            openLink.addEventListener('click', (e) => {
                e.preventDefault()
                const blob = dataURLtoBlob(r.fileData)
                const blobUrl = URL.createObjectURL(blob)
                window.open(blobUrl, '_blank')
            })
        }

        item.querySelector('.resource-remove').addEventListener('click', () => {
            resources.splice(ri, 1)
            renderResources()
            saveCurrentResources()
        })

        elements.resourcesList.appendChild(item)
    })
}

// --- Resource Modal ---
let pendingFileData = null
let pendingFileName = null

function openResourceModal() {
    elements.resourceModal.classList.remove('hidden')
    elements.resourceTitle.value = ''
    elements.resourceUrl.value = ''
    elements.resourceType.value = 'link'
    elements.urlInputGroup.classList.remove('hidden')
    elements.fileInputGroup.classList.add('hidden')
    clearFileUpload()
}

function closeResourceModal() {
    elements.resourceModal.classList.add('hidden')
    clearFileUpload()
}

function handleFileSelect() {
    const file = elements.resourceFile.files[0]
    if (!file) return

    // Auto-fill title if empty
    if (!elements.resourceTitle.value.trim()) {
        elements.resourceTitle.value = file.name.replace(/\.pdf$/i, '')
    }

    // Show file info
    elements.fileUploadContent.style.display = 'none'
    elements.fileUploadProgress.classList.remove('hidden')
    elements.fileUploadName.textContent = file.name
    elements.fileUploadSize.textContent = formatFileSize(file.size)

    // Read as data URL
    const reader = new FileReader()
    reader.onload = (e) => {
        pendingFileData = e.target.result
        pendingFileName = file.name
    }
    reader.readAsDataURL(file)
}

function clearFileUpload() {
    pendingFileData = null
    pendingFileName = null
    elements.resourceFile.value = ''
    elements.fileUploadContent.style.display = 'flex'
    elements.fileUploadProgress.classList.add('hidden')
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
}

function dataURLtoBlob(dataURL) {
    const parts = dataURL.split(',')
    const mime = parts[0].match(/:(.*?);/)[1]
    const raw = atob(parts[1])
    const arr = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
    return new Blob([arr], { type: mime })
}

function addResource() {
    const idx = state.detail.activeChapterIdx
    if (idx === null) return

    const title = elements.resourceTitle.value.trim()
    if (!title) {
        elements.resourceTitle.focus()
        return
    }

    const type = elements.resourceType.value

    const resource = { title, type, url: '', fileData: null, fileName: null }

    if (type === 'pdf' && pendingFileData) {
        resource.fileData = pendingFileData
        resource.fileName = pendingFileName
    } else {
        resource.url = elements.resourceUrl.value.trim()
    }

    if (!state.detail.chapters[idx].resources) {
        state.detail.chapters[idx].resources = []
    }
    state.detail.chapters[idx].resources.push(resource)
    renderResources()
    saveCurrentResources()
    closeResourceModal()
}

// ============================================
// PERSISTENCE HELPERS
// ============================================
function saveCurrentChapters() {
    const chaptersToSave = state.detail.chapters.map(ch => ({
        name: ch.name,
        notes: ch.notes,
        status: ch.status,
        timeSpent: ch.timeSpent
    }))
    saveChapters(state.detail.subjectId, chaptersToSave)
}

function saveCurrentResources() {
    const idx = state.detail.activeChapterIdx
    if (idx === null) return
    const chKey = `${state.detail.subjectId}_ch${idx}`
    saveResources(chKey, state.detail.chapters[idx].resources || [])
}

function formatMinutes(min) {
    if (min >= 60) return `${Math.floor(min / 60)}h ${min % 60}m`
    return `${min} min`
}

// ============================================
// DASHBOARD STATS
// ============================================
function updateDashboardStats() {
    const subjects = getSubjectsFromDOM()
    const totalHours = parseFloat(elements.totalHoursInput.value) || 6

    elements.statSubjects.textContent = subjects.length
    elements.bigSubjects.textContent = subjects.length
    elements.psSubjects.textContent = subjects.length

    if (subjects.length > 0) {
        const today = new Date()
        const daysArr = subjects.map(s => {
            const d = Math.ceil((new Date(s.examDate) - today) / (1000 * 60 * 60 * 24))
            return d > 0 ? d : Infinity
        })
        const minDays = Math.min(...daysArr)
        elements.statNextExam.textContent = minDays === Infinity ? '—' : `${minDays}d`
        elements.bigExams.textContent = subjects.filter(s => {
            const d = Math.ceil((new Date(s.examDate) - today) / (1000 * 60 * 60 * 24))
            return d > 0 && d <= 30
        }).length
    } else {
        elements.statNextExam.textContent = '—'
        elements.bigExams.textContent = '0'
    }

    elements.statTodayHours.textContent = totalHours + 'h'
    elements.bigHours.textContent = totalHours
    elements.psTotalHours.textContent = totalHours + 'h'

    if (subjects.length > 0) {
        const avgPrep = subjects.reduce((s, x) => s + x.preparedness, 0) / subjects.length
        const pct = Math.round((avgPrep / 5) * 100)
        elements.statPreparedness.textContent = pct + '%'
        elements.overallPrep.textContent = pct + '%'
        renderPreparedness(subjects)
    } else {
        elements.statPreparedness.textContent = '0%'
        elements.overallPrep.textContent = '0%'
        elements.prepBars.innerHTML = ''
    }

    renderWeeklyBars(totalHours)
    renderCalendar()
    if (state.schedule) renderTodaysPlan(state.schedule)
    renderNotifications(subjects)
}

function renderPreparedness(subjects) {
    const colors = ['#e0b830', '#2d2d2d', '#e74c3c', '#3498db', '#9b59b6', '#4caf50']
    elements.prepBars.innerHTML = ''
    subjects.slice(0, 5).forEach((s, i) => {
        const pct = Math.round((s.preparedness / 5) * 100)
        const row = document.createElement('div')
        row.className = 'prep-row'
        row.innerHTML = `
            <span class="prep-row-label">${s.name}</span>
            <div class="prep-row-bar"><div class="prep-row-fill" style="width:${pct}%;background:${colors[i % colors.length]}"></div></div>
            <span class="prep-row-pct">${pct}%</span>
        `
        elements.prepBars.appendChild(row)
    })
}

// ---- Notifications ----
function renderNotifications(subjects) {
    const notifications = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    subjects.forEach(s => {
        const examDate = new Date(s.examDate)
        examDate.setHours(0, 0, 0, 0)
        const daysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
        const examStr = examDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

        // Overdue — exam already passed
        if (daysLeft < 0) {
            notifications.push({
                type: 'urgent', icon: '🚨',
                msg: `<strong>${s.name}</strong> exam was on ${examStr} — ${Math.abs(daysLeft)} day${Math.abs(daysLeft) > 1 ? 's' : ''} ago!`,
                time: 'Overdue',
                priority: 0
            })
        }
        // Exam tomorrow or today
        else if (daysLeft <= 1) {
            notifications.push({
                type: 'urgent', icon: '🔴',
                msg: `<strong>${s.name}</strong> exam is ${daysLeft === 0 ? '<strong>TODAY</strong>' : '<strong>tomorrow</strong>'}!`,
                time: examStr,
                priority: 1
            })
        }
        // Exam within 3 days
        else if (daysLeft <= 3) {
            notifications.push({
                type: 'warning', icon: '⚠️',
                msg: `<strong>${s.name}</strong> exam in <strong>${daysLeft} days</strong> — make sure you're prepared!`,
                time: examStr,
                priority: 2
            })
        }
        // Exam within 7 days
        else if (daysLeft <= 7) {
            notifications.push({
                type: 'info', icon: '📅',
                msg: `<strong>${s.name}</strong> exam coming up in <strong>${daysLeft} days</strong>`,
                time: examStr,
                priority: 3
            })
        }

        // Low preparedness (1 or 2 out of 5)
        if (s.preparedness <= 2 && daysLeft > 0 && daysLeft <= 14) {
            notifications.push({
                type: 'warning', icon: '📉',
                msg: `<strong>${s.name}</strong> has low preparedness (${s.preparedness}/5) — consider studying more`,
                time: `Exam in ${daysLeft}d`,
                priority: 4
            })
        }

        // High difficulty + low prep combo
        if (s.difficulty >= 4 && s.preparedness <= 2 && daysLeft > 0 && daysLeft <= 10) {
            notifications.push({
                type: 'urgent', icon: '🔥',
                msg: `<strong>${s.name}</strong> is high difficulty + low prep — needs urgent attention!`,
                time: `${daysLeft}d left`,
                priority: 1.5
            })
        }
    })

    // Sort by priority (lower = more urgent)
    notifications.sort((a, b) => a.priority - b.priority)

    // Update count badge
    const count = notifications.length
    elements.notifCount.textContent = count
    elements.notifCount.setAttribute('data-zero', count === 0 ? 'true' : 'false')

    // Render
    if (count === 0) {
        elements.notifList.innerHTML = '<div class="notif-empty">No notifications — you\'re all caught up! 🎉</div>'
        return
    }

    elements.notifList.innerHTML = ''
    notifications.forEach(n => {
        const item = document.createElement('div')
        item.className = 'notif-item'
        item.innerHTML = `
            <div class="notif-icon ${n.type}">${n.icon}</div>
            <div class="notif-body">
                <div class="notif-msg">${n.msg}</div>
                <div class="notif-time">${n.time}</div>
            </div>
            <button class="notif-dismiss" title="Dismiss">✕</button>
        `

        item.querySelector('.notif-dismiss').addEventListener('click', () => {
            item.style.opacity = '0'
            item.style.transform = 'translateX(20px)'
            item.style.transition = 'all 0.25s ease'
            setTimeout(() => {
                item.remove()
                // Update count
                const remaining = elements.notifList.querySelectorAll('.notif-item').length
                elements.notifCount.textContent = remaining
                elements.notifCount.setAttribute('data-zero', remaining === 0 ? 'true' : 'false')
                if (remaining === 0) {
                    elements.notifList.innerHTML = '<div class="notif-empty">No notifications — you\'re all caught up! 🎉</div>'
                }
            }, 250)
        })

        elements.notifList.appendChild(item)
    })
}

// ============================================
// FULL CALENDAR PAGE
// ============================================
function renderFullCalendar() {
    const { month, year } = calendarState
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Update month title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December']
    elements.calFullMonth.textContent = `${monthNames[month]} ${year}`

    // Build event map: dateKey -> [{ type, label, hours?, subject? }]
    const eventMap = {}
    const addEvent = (dateStr, event) => {
        if (!eventMap[dateStr]) eventMap[dateStr] = []
        eventMap[dateStr].push(event)
    }

    // Get subjects from DOM
    const subjects = getSubjectsFromDOM()

    // Add exam dates
    subjects.forEach(s => {
        if (s.examDate) {
            const d = new Date(s.examDate)
            const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            addEvent(key, { type: 'exam', label: `📝 ${s.name} Exam`, subject: s.name })
        }
    })

    // Add daily study sessions from schedule
    if (state.schedule && state.schedule.length > 0) {
        // The schedule represents daily allocations.
        // Show study sessions for today and every day from start date until each exam.
        const startDateStr = document.getElementById('start-date')?.value
        const startDate = startDateStr ? new Date(startDateStr) : new Date()
        startDate.setHours(0, 0, 0, 0)

        state.schedule.forEach(s => {
            if (!s.examDate || s.hours <= 0) return
            const examDate = new Date(s.examDate)
            examDate.setHours(0, 0, 0, 0)

            // Fill study sessions from start to exam-1
            const cursor = new Date(startDate)
            while (cursor < examDate) {
                const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`
                addEvent(key, {
                    type: 'study',
                    label: `${s.name}`,
                    hours: s.hours,
                    subject: s.name
                })
                cursor.setDate(cursor.getDate() + 1)
            }
        })
    }

    // Build calendar grid
    const firstDay = new Date(year, month, 1).getDay()           // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    elements.calFullGrid.innerHTML = ''

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
        const dayNum = prevMonthDays - i
        const cell = createDayCell(dayNum, true, null, [])
        elements.calFullGrid.appendChild(cell)
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d)
        const key = `${year}-${month}-${d}`
        const events = eventMap[key] || []
        const isToday = dateObj.getTime() === today.getTime()
        const cell = createDayCell(d, false, isToday, events, dateObj)
        elements.calFullGrid.appendChild(cell)
    }

    // Next month filler days (fill to 42 cells for 6 rows)
    const totalCells = elements.calFullGrid.children.length
    const remaining = (totalCells <= 35 ? 35 : 42) - totalCells
    for (let i = 1; i <= remaining; i++) {
        const cell = createDayCell(i, true, false, [])
        elements.calFullGrid.appendChild(cell)
    }

    // Reset day details
    elements.calDayDetails.innerHTML = '<p class="text-muted" style="font-size:0.82rem;color:var(--text-400)">Click a day to see details</p>'
}

function createDayCell(dayNum, isOutside, isToday, events, dateObj) {
    const cell = document.createElement('div')
    cell.className = 'cal-day'
    if (isOutside) cell.classList.add('outside')
    if (isToday) cell.classList.add('today')

    let eventsHtml = ''
    const maxVisible = 3
    const visible = events.slice(0, maxVisible)
    visible.forEach(ev => {
        const cls = ev.type === 'exam' ? 'exam' : 'study'
        const label = ev.type === 'study' ? `${ev.label} · ${ev.hours?.toFixed(1)}h` : ev.label
        eventsHtml += `<div class="cal-event ${cls}">${label}</div>`
    })
    if (events.length > maxVisible) {
        eventsHtml += `<div class="cal-event-more">+${events.length - maxVisible} more</div>`
    }

    cell.innerHTML = `
        <div class="cal-day-num">${dayNum}</div>
        <div class="cal-day-events">${eventsHtml}</div>
    `

    if (!isOutside && dateObj) {
        cell.addEventListener('click', () => {
            // Deselect previous
            document.querySelectorAll('.cal-day.selected').forEach(c => c.classList.remove('selected'))
            cell.classList.add('selected')
            showDayDetails(dateObj, events)
        })
    }

    return cell
}

function showDayDetails(dateObj, events) {
    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    if (events.length === 0) {
        elements.calDayDetails.innerHTML = `
            <p style="font-size:0.82rem;font-weight:600;color:var(--text-700);margin-bottom:4px">${dateStr}</p>
            <p class="text-muted" style="font-size:0.78rem;color:var(--text-400)">No events scheduled</p>
        `
        return
    }

    let html = `<p style="font-size:0.82rem;font-weight:600;color:var(--text-700);margin-bottom:6px">${dateStr}</p>`

    events.forEach(ev => {
        const icon = ev.type === 'exam' ? '📝' : '📚'
        const badge = ev.type === 'exam'
            ? '<span class="cal-detail-badge exam-badge">EXAM</span>'
            : `<span class="cal-detail-badge study-badge">${ev.hours?.toFixed(1)}h</span>`
        const meta = ev.type === 'exam' ? 'Exam day' : 'Study session'

        html += `
            <div class="cal-detail-item">
                <div class="cal-detail-icon">${icon}</div>
                <div class="cal-detail-info">
                    <div class="cal-detail-name">${ev.subject || ev.label}</div>
                    <div class="cal-detail-meta">${meta}</div>
                </div>
                ${badge}
            </div>
        `
    })

    elements.calDayDetails.innerHTML = html
}

function renderWeeklyBars(totalHours) {
    const cols = elements.weeklyBars.querySelectorAll('.wbar')
    const today = new Date().getDay()
    cols.forEach((bar, i) => {
        let h = 0
        if (state.schedule && i <= today) {
            h = totalHours * (0.5 + Math.random() * 0.5)
        }
        const height = Math.max(6, (h / 10) * 90)
        bar.style.height = height + 'px'
        bar.classList.toggle('highlight', i === today)
    })
    const weekH = state.schedule ? totalHours * (today + 1) : 0
    elements.weeklyHours.textContent = weekH.toFixed(1) + 'h'
}

// ============================================
// CALENDAR
// ============================================
function renderCalendar() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1)

    elements.calMonth.textContent = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

    let html = '<div class="cal-day-header"></div>'
    days.forEach((d, i) => {
        const date = new Date(startOfWeek)
        date.setDate(startOfWeek.getDate() + i)
        html += `<div class="cal-day-header">${d}<br>${date.getDate()}</div>`
    })

    const times = ['8:00 am', '9:00 am', '10:00 am', '11:00 am', '12:00 pm']

    if (state.schedule && state.schedule.length > 0) {
        times.forEach((time, ti) => {
            html += `<div class="cal-time">${time}</div>`
            for (let d = 0; d < 6; d++) {
                const subIdx = (ti + d) % state.schedule.length
                const sub = state.schedule[subIdx]
                if (sub && ti < state.schedule.length && d % 3 === 0) {
                    const isGold = ti % 2 === 0
                    html += `<div class="cal-event ${isGold ? 'gold-event' : 'cream-event'}">${sub.name}<br>${sub.hours.toFixed(1)}h</div>`
                    d++
                } else {
                    html += `<div></div>`
                }
            }
        })
    } else {
        html += `<div class="cal-empty" style="grid-column: 1 / -1; padding: 30px;">Generate a schedule to see your weekly calendar</div>`
    }

    elements.calGrid.innerHTML = html
}

// ============================================
// TODAY'S PLAN
// ============================================
function renderTodaysPlan(schedule) {
    if (!schedule || schedule.length === 0) {
        elements.todayList.innerHTML = '<div class="today-empty">Generate a schedule to see today\'s plan</div>'
        elements.todayDone.textContent = '0'
        elements.todayTotal.textContent = '0'
        return
    }

    elements.todayTotal.textContent = schedule.length
    elements.todayDone.textContent = '0'

    const colors = CHART_COLORS
    const now = new Date()
    let startHour = 8
    let doneCount = 0

    elements.todayList.innerHTML = ''
    schedule.forEach((s, i) => {
        const endHour = startHour + s.hours
        const startTime = formatTime(startHour)
        const endTime = formatTime(endHour)
        const isPast = now.getHours() >= endHour

        const item = document.createElement('div')
        item.className = 'today-item'
        item.innerHTML = `
            <div class="today-dot" style="background:${colors[i % colors.length]}20;color:${colors[i % colors.length]};">📚</div>
            <div class="today-info">
                <div class="today-name">${s.name}</div>
                <div class="today-time">${startTime} — ${endTime} · ${s.hours.toFixed(1)}h</div>
            </div>
            <div class="today-check${isPast ? ' done' : ''}" data-idx="${i}"></div>
        `
        elements.todayList.appendChild(item)
        if (isPast) doneCount++
        startHour = endHour
    })

    elements.todayDone.textContent = doneCount

    elements.todayList.querySelectorAll('.today-check').forEach(check => {
        check.addEventListener('click', () => {
            check.classList.toggle('done')
            const done = elements.todayList.querySelectorAll('.today-check.done').length
            elements.todayDone.textContent = done
        })
    })
}

function formatTime(h) {
    const hr = Math.floor(h)
    const min = Math.round((h - hr) * 60)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const h12 = hr > 12 ? hr - 12 : (hr === 0 ? 12 : hr)
    return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`
}

// ============================================
// DASHBOARD TIMER
// ============================================
function startTimer() {
    if (state.timer.running) return
    state.timer.running = true
    elements.timerStart.style.display = 'none'
    elements.timerPause.style.display = 'flex'
    state.timer.interval = setInterval(() => {
        state.timer.seconds++
        updateTimerDisplay()
    }, 1000)
}

function pauseTimer() {
    state.timer.running = false
    clearInterval(state.timer.interval)
    elements.timerStart.style.display = 'flex'
    elements.timerPause.style.display = 'none'
}

function resetTimer() {
    pauseTimer()
    state.timer.seconds = 0
    updateTimerDisplay()
}

function updateTimerDisplay() {
    const mins = Math.floor(state.timer.seconds / 60)
    const secs = state.timer.seconds % 60
    elements.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    const progress = Math.min(state.timer.seconds / (state.timer.goalMinutes * 60), 1)
    elements.timerRing.style.strokeDashoffset = 314.16 * (1 - progress)
}

// ============================================
// OPTIMIZATION ALGORITHM
// ============================================
function calculatePriorityScore(subject) {
    const today = new Date()
    const examDate = new Date(subject.examDate)
    let daysRemaining = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24))
    if (daysRemaining < 1) daysRemaining = 1
    const urgency = 1 / daysRemaining
    const weaknessFactor = subject.difficulty - subject.preparedness
    const workloadFactor = subject.chapters
    const score = (urgency * 0.5) + (weaknessFactor * 0.3) + (workloadFactor * 0.2)
    return { score: Math.max(0.01, score), urgency, weaknessFactor, workloadFactor, daysRemaining }
}

function generateSchedule() {
    const subjects = getSubjectsFromDOM()
    const totalHours = parseFloat(elements.totalHoursInput.value) || 6
    const userMaxPerSubject = parseFloat(elements.maxPerSubject.value) || (totalHours * 0.4)
    if (subjects.length === 0) return

    subjects.forEach(sub => {
        const r = calculatePriorityScore(sub)
        Object.assign(sub, { rawScore: r.score, urgency: r.urgency, weaknessFactor: r.weaknessFactor, workloadFactor: r.workloadFactor, daysRemaining: r.daysRemaining })
    })

    const totalScore = subjects.reduce((s, x) => s + x.rawScore, 0)
    subjects.forEach(s => { s.normalizedScore = s.rawScore / totalScore })

    let allocations = subjects.map(s => ({ ...s, hours: 0, locked: false }))
    const minHours = 0.5
    const maxHours = Math.min(totalHours * 0.4, userMaxPerSubject)
    let remaining = totalHours

    for (let pass = 0; pass < 10; pass++) {
        const unlocked = allocations.filter(a => !a.locked)
        const uSum = unlocked.reduce((s, a) => s + a.rawScore, 0)
        if (uSum === 0 || unlocked.length === 0) break
        unlocked.forEach(a => { a.hours = (a.rawScore / uSum) * remaining })
        let changed = false
        allocations.forEach(a => {
            if (!a.locked) {
                if (a.hours < minHours) { a.hours = minHours; a.locked = true; changed = true; }
                else if (a.hours > maxHours) { a.hours = maxHours; a.locked = true; changed = true; }
            }
        })
        if (!changed) break
        const lockedSum = allocations.filter(a => a.locked).reduce((s, a) => s + a.hours, 0)
        remaining = totalHours - lockedSum
        if (remaining <= 0) break
    }

    const curSum = allocations.reduce((s, a) => s + a.hours, 0)
    if (Math.abs(curSum - totalHours) > 0.01) {
        const diff = totalHours - curSum
        const unlocked = allocations.filter(a => !a.locked)
        if (unlocked.length > 0) {
            const uS = unlocked.reduce((s, a) => s + a.rawScore, 0)
            unlocked.forEach(a => { a.hours += diff * (a.rawScore / uS) })
        } else {
            allocations.sort((a, b) => b.rawScore - a.rawScore)
            allocations[0].hours += diff
        }
    }

    allocations.forEach(a => { a.hours = Math.max(0, a.hours) })
    allocations.sort((a, b) => b.hours - a.hours)

    state.schedule = allocations
    renderTodaysPlan(allocations)
    renderScheduleView(allocations, totalHours)
    renderCharts(allocations)
    generateExplanation(allocations)
    updateDashboardStats()
    // If calendar is visible, re-render it
    if (elements.views.calendar && elements.views.calendar.classList.contains('active-view')) {
        renderFullCalendar()
    }
}

// ============================================
// SCHEDULE VIEW
// ============================================
function getSubjectIcon(name) {
    const n = name.toLowerCase()
    if (n.includes('math') || n.includes('calc') || n.includes('algebra')) return '📐'
    if (n.includes('phys')) return '⚛️'
    if (n.includes('chem')) return '🧪'
    if (n.includes('bio')) return '🧬'
    if (n.includes('hist') || n.includes('gov')) return '🏛️'
    if (n.includes('eng') || n.includes('lit')) return '📚'
    if (n.includes('comp') || n.includes('code') || n.includes('cs')) return '💻'
    if (n.includes('geo')) return '🌍'
    if (n.includes('art') || n.includes('music')) return '🎨'
    if (n.includes('econ') || n.includes('fin')) return '📈'
    return '📓'
}

function renderScheduleView(schedule, totalHours) {
    elements.scheduleBadge.style.display = 'inline-flex'
    const maxHrs = Math.max(...schedule.map(s => s.hours))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let html = '<div class="schedule-grid">'
    schedule.forEach((item, i) => {
        const pct = maxHrs > 0 ? (item.hours / maxHrs) * 100 : 0
        const color = CHART_COLORS[i % CHART_COLORS.length]

        // Meta calculations
        let examStr = 'No exam date'
        let urgencyClass = 'safe'
        if (item.examDate) {
            const d = new Date(item.examDate)
            d.setHours(0, 0, 0, 0)
            const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
            if (diff < 0) { examStr = 'Exam passed'; urgencyClass = 'safe' }
            else if (diff === 0) { examStr = 'Exam TODAY!'; urgencyClass = 'urgent' }
            else if (diff === 1) { examStr = 'Exam Tomorrow!'; urgencyClass = 'urgent' }
            else { examStr = `Exam in ${diff} days`; urgencyClass = diff <= 3 ? 'urgent' : diff <= 7 ? 'moderate' : 'safe' }
        }

        const diffLabel = ['Easy', 'Medium', 'Hard', 'Expert', 'Nightmare'][item.difficulty - 1] || 'Medium'
        const icon = getSubjectIcon(item.name)

        html += `
            <div class="schedule-card" style="border-top: 3px solid ${color}">
                <div class="sc-header">
                    <div class="sc-title-wrap">
                        <div class="sc-icon">${icon}</div>
                        <div class="sc-info">
                            <h4>${item.name}</h4>
                            <span class="sc-badge ${urgencyClass}">${examStr}</span>
                        </div>
                    </div>
                    <div class="sc-hours-badge">${item.hours.toFixed(1)}h</div>
                </div>
                
                <div class="sc-meta-grid">
                    <div class="sc-meta-item" title="Preparedness">
                        <span class="sc-meta-icon">🧠</span> Prep: <strong>${item.preparedness}/5</strong>
                    </div>
                    <div class="sc-meta-item" title="Difficulty">
                        <span class="sc-meta-icon">⚡</span> Diff: <strong>${diffLabel}</strong>
                    </div>
                </div>

                <div class="sc-progress-wrap">
                    <div class="sc-progress-label">
                        <span>Daily Focus</span>
                        <span>${Math.round(pct)}% of max</span>
                    </div>
                    <div class="sc-progress-bar">
                        <div class="sc-progress-fill" style="width:${pct}%; background:${color}"></div>
                    </div>
                </div>
            </div>`
    })

    const usedH = schedule.reduce((s, x) => s + x.hours, 0)
    html += `
        <div class="sc-total-footer">
            <span class="sc-total-label">Total Daily Allocation</span>
            <span class="sc-total-val">${usedH.toFixed(1)}h / ${totalHours}h</span>
        </div>
    </div>`

    elements.scheduleContent.innerHTML = html
}

// ============================================
// CHARTS
// ============================================
function renderCharts(schedule) {
    if (state.charts.distribution) state.charts.distribution.destroy()
    if (state.charts.urgency) state.charts.urgency.destroy()
    const colors = schedule.map((_, i) => CHART_COLORS[i % CHART_COLORS.length])

    const ctxPie = document.getElementById('distributionChart')
    if (ctxPie) {
        state.charts.distribution = new Chart(ctxPie.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: schedule.map(s => s.name),
                datasets: [{ data: schedule.map(s => parseFloat(s.hours.toFixed(2))), backgroundColor: colors, borderWidth: 2, borderColor: '#fffdf8' }]
            },
            options: { responsive: true, maintainAspectRatio: true, cutout: '55%', plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyleWidth: 10, font: { family: 'Inter', size: 11, weight: '500' } } } } }
        })
    }

    const ctxBar = document.getElementById('urgencyChart')
    if (ctxBar) {
        state.charts.urgency = new Chart(ctxBar.getContext('2d'), {
            type: 'bar',
            data: {
                labels: schedule.map(s => s.name),
                datasets: [{ label: 'Priority Score', data: schedule.map(s => parseFloat(s.rawScore.toFixed(3))), backgroundColor: colors.map(c => c + 'cc'), borderColor: colors, borderWidth: 1.5, borderRadius: 6 }]
            },
            options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
        })
    }
}

function generateExplanation(schedule) {
    if (!schedule.length) return
    const top = schedule[0]
    const reasons = getReasons(top)
    let html = `<p><strong>${top.name}</strong> received the highest allocation (<strong>${top.hours.toFixed(1)} hours</strong>) due to:</p>`
    html += `<ul>${reasons.map(r => `<li>${r}</li>`).join('')}</ul>`
    if (schedule.length > 1) {
        html += `<p style="margin-top:14px"><strong>Other subjects:</strong></p><ul>`
        for (let i = 1; i < schedule.length; i++) {
            const s = schedule[i]
            html += `<li><strong>${s.name}</strong> (${s.hours.toFixed(1)}h) — ${getPrimaryReason(s)}</li>`
        }
        html += `</ul>`
    }
    html += `<p style="margin-top:14px">The schedule enforces a <strong>40% max cap</strong> and <strong>30-minute minimum</strong> per subject to prevent burnout.</p>`
    elements.explanationText.innerHTML = html
}

function getReasons(s) {
    const r = []
    if (s.daysRemaining <= 3) r.push(`Exam imminent (${s.daysRemaining}d away)`)
    else if (s.daysRemaining <= 7) r.push(`Near exam date (${s.daysRemaining}d)`)
    if (s.difficulty >= 4) r.push(`High difficulty (${s.difficulty}/5)`)
    if (s.preparedness <= 2) r.push(`Low preparedness (${s.preparedness}/5)`)
    if (s.weaknessFactor >= 2) r.push(`Large weakness gap`)
    if (s.chapters >= 6) r.push(`Heavy workload (${s.chapters} chapters)`)
    if (r.length === 0) r.push('Balanced across all metrics')
    return r
}

function getPrimaryReason(s) {
    if (s.daysRemaining <= 3) return `exam very soon (${s.daysRemaining}d)`
    if (s.weaknessFactor >= 2) return `weakness gap`
    if (s.chapters >= 6) return `heavy workload (${s.chapters} ch.)`
    if (s.daysRemaining <= 7) return `exam in ${s.daysRemaining}d`
    return `balanced priority`
}

// ============================================
// DEMO MODE
// ============================================
function loadDemoScenario() {
    elements.subjectsContainer.innerHTML = ''
    const demoData = [
        { name: 'Calculus', examDate: getDateInDays(3), difficulty: 5, preparedness: 2, chapters: 8 },
        { name: 'Physics', examDate: getDateInDays(5), difficulty: 4, preparedness: 3, chapters: 6 },
        { name: 'Chemistry', examDate: getDateInDays(7), difficulty: 4, preparedness: 4, chapters: 5 },
        { name: 'Comp Science', examDate: getDateInDays(2), difficulty: 3, preparedness: 2, chapters: 4 },
        { name: 'History', examDate: getDateInDays(10), difficulty: 2, preparedness: 4, chapters: 3 },
        { name: 'English', examDate: getDateInDays(14), difficulty: 1, preparedness: 5, chapters: 2 }
    ]
    elements.totalHoursInput.value = 6
    elements.maxPerSubject.value = 3
    elements.startDate.value = getDateInDays(0)
    demoData.forEach(d => addSubject(d))

    setTimeout(async () => {
        generateSchedule()
        await persistData()
        switchView('dashboard')
    }, 300)
}

// ============================================
// PERSISTENCE
// ============================================
async function persistData() {
    const subjects = getSubjectsFromDOM()
    await saveSubjects(subjects)
    if (state.schedule) {
        const totalHours = parseFloat(elements.totalHoursInput.value) || 6
        await saveSchedule(totalHours, state.schedule)
    }
    saveSettings({
        totalHours: elements.totalHoursInput.value,
        maxPerSubject: elements.maxPerSubject.value,
        startDate: elements.startDate.value
    })
}

async function loadSavedData() {
    const settings = loadSettings()
    if (settings) {
        if (settings.totalHours) elements.totalHoursInput.value = settings.totalHours
        if (settings.maxPerSubject) elements.maxPerSubject.value = settings.maxPerSubject
        if (settings.startDate) elements.startDate.value = settings.startDate
    }
    const subjects = await loadSubjects()
    elements.subjectsContainer.innerHTML = ''
    if (subjects && subjects.length > 0) {
        subjects.forEach(s => addSubject(s))
        setTimeout(() => { generateSchedule(); updateDashboardStats(); }, 200)
    } else {
        addSubject()
    }
}

// ============================================
// AI CHAT
// ============================================
function sendAiMessage() {
    const input = elements.aiChatInput.value.trim()
    if (!input) return

    // Add user message
    appendChatMessage('user', input)
    elements.aiChatInput.value = ''

    // Hide suggestions after first message
    elements.aiSuggestions.style.display = 'none'

    // Show typing indicator
    const typingEl = document.createElement('div')
    typingEl.className = 'ai-msg ai-msg-bot'
    typingEl.innerHTML = `
        <div class="ai-msg-avatar">\ud83e\udde0</div>
        <div class="ai-msg-bubble">
            <div class="ai-typing">
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
                <div class="ai-typing-dot"></div>
            </div>
        </div>
    `
    elements.aiChatMessages.appendChild(typingEl)
    elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight

    // Simulate AI response
    setTimeout(() => {
        typingEl.remove()
        const response = generateAiResponse(input)
        appendChatMessage('bot', response)
    }, 800 + Math.random() * 800)
}

function appendChatMessage(role, content) {
    const msg = document.createElement('div')
    msg.className = `ai-msg ai-msg-${role}`
    const avatar = role === 'bot' ? '\ud83e\udde0' : '\ud83d\udc64'
    msg.innerHTML = `
        <div class="ai-msg-avatar">${avatar}</div>
        <div class="ai-msg-bubble">${content}</div>
    `
    elements.aiChatMessages.appendChild(msg)
    elements.aiChatMessages.scrollTop = elements.aiChatMessages.scrollHeight
}

function generateAiResponse(question) {
    const q = question.toLowerCase()
    const subjects = getSubjectsFromDOM()
    const schedule = state.schedule
    const today = new Date()

    // Context: build subject summaries
    const subjectSummaries = subjects.map(s => {
        const exam = new Date(s.examDate)
        const days = Math.ceil((exam - today) / (1000 * 60 * 60 * 24))
        return { ...s, daysLeft: days }
    })

    const sortedByUrgency = [...subjectSummaries].sort((a, b) => a.daysLeft - b.daysLeft)
    const weakest = [...subjectSummaries].sort((a, b) => a.preparedness - b.preparedness)

    // --- Priority questions ---
    if (q.includes('priorit') || q.includes('focus') || q.includes('important')) {
        if (subjects.length === 0) return '<p>You haven\'t added any subjects yet. Add some on the <strong>Subjects</strong> tab and I can help you prioritize!</p>'
        const top3 = sortedByUrgency.slice(0, 3)
        let html = '<p>Based on your exam dates and preparedness levels, here\'s my priority ranking:</p><ol>'
        top3.forEach((s, i) => {
            const urgency = s.daysLeft <= 3 ? '\ud83d\udd34 Critical' : s.daysLeft <= 7 ? '\ud83d\udfe1 Moderate' : '\ud83d\udfe2 Low'
            html += `<li><strong>${s.name}</strong> — ${s.daysLeft}d left, prep ${s.preparedness}/5 (${urgency})</li>`
        })
        html += '</ol><p>Focus your energy on subjects with the least time remaining and lowest preparedness.</p>'
        return html
    }

    // --- Weak subject ---
    if (q.includes('weak') || q.includes('worst') || q.includes('struggling') || q.includes('behind')) {
        if (subjects.length === 0) return '<p>No subjects to analyze yet! Add them on the <strong>Subjects</strong> tab.</p>'
        const w = weakest[0]
        return `<p>Your weakest subject is <strong>${w.name}</strong> with a preparedness of <strong>${w.preparedness}/5</strong> and the exam is in <strong>${w.daysLeft} days</strong>.</p>
        <p>\ud83d\udca1 Suggestion: Allocate extra study blocks for ${w.name} and focus on the core concepts first.</p>`
    }

    // --- Study enough? ---
    if (q.includes('enough') || q.includes('daily') || q.includes('hours')) {
        const totalHours = parseFloat(document.getElementById('total-hours')?.value) || 0
        if (totalHours === 0) return '<p>You haven\'t set your daily study hours yet. Configure it in the dashboard settings!</p>'
        const optimal = subjects.length >= 5 ? 8 : subjects.length >= 3 ? 6 : 4
        const verdict = totalHours >= optimal
            ? `<p>\u2705 You're studying <strong>${totalHours}h/day</strong> which looks good for ${subjects.length} subjects!</p>`
            : `<p>\u26a0\ufe0f You're studying <strong>${totalHours}h/day</strong>, but with ${subjects.length} subjects I'd recommend at least <strong>${optimal}h/day</strong>.</p>`
        return `${verdict}<p>\ud83d\udca1 Tip: Break sessions into 45-minute focused blocks with 10-minute breaks for best retention.</p>`
    }

    // --- Tips for exams ---
    if (q.includes('tip') || q.includes('upcoming') || q.includes('exam') || q.includes('advice')) {
        const upcoming = sortedByUrgency.filter(s => s.daysLeft > 0 && s.daysLeft <= 7)
        if (upcoming.length === 0) return '<p>No exams within the next 7 days \u2014 keep up the steady pace! \ud83d\ude0a</p><p>\ud83d\udca1 Use this time to review weak areas and build strong foundations.</p>'
        let html = `<p>You have <strong>${upcoming.length} exam${upcoming.length > 1 ? 's' : ''}</strong> coming up this week:</p><ul>`
        upcoming.forEach(s => {
            html += `<li><strong>${s.name}</strong> in ${s.daysLeft}d (prep: ${s.preparedness}/5)</li>`
        })
        html += '</ul><p>\ud83d\udca1 My tips:</p><ul>'
        html += '<li>\ud83c\udfaf Focus on high-weight topics first</li>'
        html += '<li>\ud83d\uddd3\ufe0f Do practice tests under timed conditions</li>'
        html += '<li>\ud83d\ude34 Get 7-8 hours of sleep before exam day</li>'
        html += '<li>\ud83d\udcdd Review your chapter notes on the Subjects page</li>'
        html += '</ul>'
        return html
    }

    // --- Schedule related ---
    if (q.includes('schedule') || q.includes('plan') || q.includes('allocat')) {
        if (!schedule || schedule.length === 0) return '<p>No schedule generated yet! Click <strong>Generate</strong> on the dashboard to create your optimized study plan.</p>'
        let html = '<p>Here\'s your current study allocation:</p><ul>'
        schedule.forEach(s => {
            html += `<li><strong>${s.name}</strong>: ${s.hours.toFixed(1)}h/day</li>`
        })
        const total = schedule.reduce((sum, s) => sum + s.hours, 0)
        html += `</ul><p>Total: <strong>${total.toFixed(1)}h/day</strong>. The schedule prioritizes subjects with closer exams and lower preparedness.</p>`
        return html
    }

    // --- Motivation ---
    if (q.includes('motivat') || q.includes('tired') || q.includes('burnout') || q.includes('stress')) {
        return `<p>\ud83d\udcaa You've got this! Here are some motivation tips:</p>
        <ul>
            <li>\ud83c\udfaf Set small, achievable goals for each study session</li>
            <li>\ud83c\udfc6 Reward yourself after completing a chapter</li>
            <li>\ud83e\uddd8 Take breaks \u2014 the Pomodoro technique works great</li>
            <li>\ud83d\udc6b Study with friends for accountability</li>
            <li>\ud83c\udf1f Visualize how great you'll feel after acing your exams!</li>
        </ul>`
    }

    // --- Fallback ---
    const fallbacks = [
        `<p>That's a great question! While I work on getting smarter, here's what I can tell you:</p>
        <p>You have <strong>${subjects.length} subject${subjects.length !== 1 ? 's' : ''}</strong> to study for. Try asking me about your <strong>priorities</strong>, <strong>weakest subject</strong>, or <strong>study tips</strong> for more specific help!</p>`,

        `<p>\ud83e\udd14 I'm still learning, but I can help with:</p>
        <ul>
            <li>Subject prioritization</li>
            <li>Identifying weak areas</li>
            <li>Study time analysis</li>
            <li>Exam preparation tips</li>
        </ul>
        <p>Try asking about one of these topics!</p>`,

        `<p>Interesting question! Currently I can analyze your study data and give recommendations. In future updates, I'll be powered by a real AI model for even deeper insights! \ud83d\ude80</p>
        <p>For now, try asking about your <strong>schedule</strong>, <strong>priorities</strong>, or <strong>exam tips</strong>.</p>`
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

// ============================================
// UTILITY
// ============================================
function getDateInDays(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}

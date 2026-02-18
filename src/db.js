// ============================================
// Database Operations (Supabase + LocalStorage fallback)
// ============================================

import { supabase, isSupabaseConfigured } from './supabase.js'
import { getUser } from './auth.js'

// =========== SUBJECTS ===========

export async function saveSubjects(subjects) {
    localStorage.setItem('optiStudy_subjects', JSON.stringify(subjects))
    if (!isSupabaseConfigured()) return
    const user = await getUser()
    if (!user) return
    try {
        await supabase.from('subjects').delete().eq('user_id', user.id)
        if (subjects.length > 0) {
            const rows = subjects.map(s => ({
                user_id: user.id,
                subject_name: s.name,
                exam_date: s.examDate,
                difficulty: s.difficulty,
                preparedness: s.preparedness,
                chapters_remaining: s.chapters
            }))
            const { data } = await supabase.from('subjects').insert(rows).select()
            // Return the IDs so we can link chapters
            return data
        }
    } catch (e) {
        console.warn('Supabase subjects save failed:', e)
    }
}

export async function loadSubjects() {
    if (!isSupabaseConfigured()) return loadSubjectsFromLocalStorage()
    const user = await getUser()
    if (!user) return loadSubjectsFromLocalStorage()
    try {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
        if (error) throw error
        if (data && data.length > 0) {
            return data.map(row => ({
                id: row.id,
                name: row.subject_name,
                examDate: row.exam_date,
                difficulty: row.difficulty,
                preparedness: row.preparedness,
                chapters: row.chapters_remaining
            }))
        }
    } catch (e) {
        console.warn('Supabase load failed:', e)
    }
    return loadSubjectsFromLocalStorage()
}

// =========== CHAPTERS ===========

export async function saveChapters(subjectId, chapters) {
    const key = `optiStudy_chapters_${subjectId}`
    localStorage.setItem(key, JSON.stringify(chapters))
    if (!isSupabaseConfigured()) return
    const user = await getUser()
    if (!user) return
    try {
        await supabase.from('chapters').delete().eq('subject_id', subjectId).eq('user_id', user.id)
        if (chapters.length > 0) {
            const rows = chapters.map((ch, i) => ({
                subject_id: subjectId,
                user_id: user.id,
                chapter_name: ch.name,
                chapter_number: i + 1,
                notes: ch.notes || '',
                status: ch.status || 'not_started',
                time_spent_minutes: ch.timeSpent || 0
            }))
            const { data } = await supabase.from('chapters').insert(rows).select()
            return data
        }
    } catch (e) {
        console.warn('Supabase chapters save failed:', e)
    }
}

export async function loadChapters(subjectId) {
    if (!isSupabaseConfigured()) return loadChaptersFromLocalStorage(subjectId)
    const user = await getUser()
    if (!user) return loadChaptersFromLocalStorage(subjectId)
    try {
        const { data, error } = await supabase
            .from('chapters')
            .select('*')
            .eq('subject_id', subjectId)
            .eq('user_id', user.id)
            .order('chapter_number', { ascending: true })
        if (error) throw error
        if (data && data.length > 0) {
            return data.map(row => ({
                id: row.id,
                name: row.chapter_name,
                number: row.chapter_number,
                notes: row.notes || '',
                status: row.status || 'not_started',
                timeSpent: row.time_spent_minutes || 0
            }))
        }
    } catch (e) {
        console.warn('Supabase chapters load failed:', e)
    }
    return loadChaptersFromLocalStorage(subjectId)
}

export async function updateChapterTime(chapterId, minutes) {
    if (!isSupabaseConfigured()) return
    const user = await getUser()
    if (!user) return
    try {
        await supabase.from('chapters').update({ time_spent_minutes: minutes }).eq('id', chapterId).eq('user_id', user.id)
    } catch (e) {
        console.warn('Chapter time update failed:', e)
    }
}

export async function updateChapterNotes(chapterId, notes) {
    if (!isSupabaseConfigured()) return
    const user = await getUser()
    if (!user) return
    try {
        await supabase.from('chapters').update({ notes }).eq('id', chapterId).eq('user_id', user.id)
    } catch (e) {
        console.warn('Chapter notes update failed:', e)
    }
}

export async function updateChapterStatus(chapterId, status) {
    if (!isSupabaseConfigured()) return
    const user = await getUser()
    if (!user) return
    try {
        await supabase.from('chapters').update({ status }).eq('id', chapterId).eq('user_id', user.id)
    } catch (e) {
        console.warn('Chapter status update failed:', e)
    }
}

// =========== RESOURCES ===========

export async function saveResources(chapterId, resources) {
    const key = `optiStudy_resources_${chapterId}`
    localStorage.setItem(key, JSON.stringify(resources))
    if (!isSupabaseConfigured()) return
    const user = await getUser()
    if (!user) return
    try {
        await supabase.from('resources').delete().eq('chapter_id', chapterId).eq('user_id', user.id)
        if (resources.length > 0) {
            const rows = resources.map(r => ({
                chapter_id: chapterId,
                user_id: user.id,
                title: r.title,
                url: r.url || '',
                resource_type: r.type || 'link'
            }))
            await supabase.from('resources').insert(rows)
        }
    } catch (e) {
        console.warn('Supabase resources save failed:', e)
    }
}

export async function loadResources(chapterId) {
    if (!isSupabaseConfigured()) return loadResourcesFromLocalStorage(chapterId)
    const user = await getUser()
    if (!user) return loadResourcesFromLocalStorage(chapterId)
    try {
        const { data, error } = await supabase
            .from('resources')
            .select('*')
            .eq('chapter_id', chapterId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
        if (error) throw error
        if (data && data.length > 0) {
            return data.map(row => ({
                id: row.id,
                title: row.title,
                url: row.url || '',
                type: row.resource_type || 'link'
            }))
        }
    } catch (e) {
        console.warn('Supabase resources load failed:', e)
    }
    return loadResourcesFromLocalStorage(chapterId)
}

// =========== SCHEDULES ===========

export async function saveSchedule(totalHours, allocations) {
    localStorage.setItem('optiStudy_schedule', JSON.stringify({ totalHours, allocations }))
    if (!isSupabaseConfigured()) return
    const user = await getUser()
    if (!user) return
    try {
        await supabase.from('schedules').insert({
            user_id: user.id,
            total_hours: totalHours,
            allocation_json: allocations
        })
    } catch (e) {
        console.warn('Schedule save to Supabase failed:', e)
    }
}

// =========== SETTINGS ===========

export function saveSettings(settings) {
    localStorage.setItem('optiStudy_settings', JSON.stringify(settings))
}

export function loadSettings() {
    try {
        return JSON.parse(localStorage.getItem('optiStudy_settings')) || null
    } catch { return null }
}

// =========== Internal / LocalStorage fallbacks ===========

function loadSubjectsFromLocalStorage() {
    try { return JSON.parse(localStorage.getItem('optiStudy_subjects')) || [] }
    catch { return [] }
}

function loadChaptersFromLocalStorage(subjectId) {
    try { return JSON.parse(localStorage.getItem(`optiStudy_chapters_${subjectId}`)) || [] }
    catch { return [] }
}

function loadResourcesFromLocalStorage(chapterId) {
    try { return JSON.parse(localStorage.getItem(`optiStudy_resources_${chapterId}`)) || [] }
    catch { return [] }
}

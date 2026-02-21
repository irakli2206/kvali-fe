'use client'

import { useCallback, useEffect, useState } from 'react'
import { useMapStore } from '@/store/use-map-store'
import type { Sample } from '@/types'

const STORAGE_KEY = 'kvali_saved_session'

export interface SavedSession {
  timeWindow: [number, number]
  sampleFilter: 'ancient' | 'modern' | 'all'
  mapMode: 'neutral' | 'ydna' | 'distance'
  selectedYDNA: string[]
  selectedSampleId: string | null
  targetSampleId: string | null
  mapCenter: [number, number] | null
  mapZoom: number | null
}

export function useSavedSession() {
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    try {
      setHasSaved(!!localStorage.getItem(STORAGE_KEY))
    } catch {
      setHasSaved(false)
    }
  }, [])

  const saveSession = useCallback(() => {
    const s = useMapStore.getState()
    const session: SavedSession = {
      timeWindow: s.timeWindow,
      sampleFilter: s.sampleFilter,
      mapMode: s.mapMode,
      selectedYDNA: s.selectedYDNA,
      selectedSampleId: s.selectedSample?.id ?? null,
      targetSampleId: s.targetSample?.id ?? null,
      mapCenter: s.mapCenter,
      mapZoom: s.mapZoom,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setHasSaved(true)
    } catch (e) {
      console.warn('Could not save session', e)
    }
  }, [])

  const restoreSession = useCallback((samples: Partial<Sample>[]) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const session = JSON.parse(raw) as SavedSession
      const {
        setTimeWindow,
        setSampleFilter,
        setMapMode,
        setSelectedYDNA,
        setSelectedSample,
        setDemoSampleId,
        setMapView,
        setRestorePendingView,
      } = useMapStore.getState()
      setTimeWindow(session.timeWindow)
      setSampleFilter(session.sampleFilter)
      setMapMode(session.mapMode)
      setSelectedYDNA(session.selectedYDNA ?? [])
      if (session.selectedSampleId && samples.length) {
        const sample = samples.find((s) => s.id === session.selectedSampleId)
        if (sample) setSelectedSample(sample as Sample)
      }
      if (session.mapCenter && session.mapZoom != null) {
        setMapView(session.mapCenter, session.mapZoom)
        setRestorePendingView({ center: session.mapCenter, zoom: session.mapZoom })
      }
      if (session.targetSampleId) setDemoSampleId(session.targetSampleId)
    } catch (e) {
      console.warn('Could not restore session', e)
    }
  }, [])

  return { saveSession, restoreSession, hasSavedSession: hasSaved }
}

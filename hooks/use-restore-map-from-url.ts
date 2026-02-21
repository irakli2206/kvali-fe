'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Map } from 'mapbox-gl'
import { useMapStore } from '@/store/use-map-store'
import { parseShareMapParams } from '@/lib/share-map-url'
import type { Sample } from '@/types'

interface UseRestoreMapFromUrlProps {
  mapRef: React.RefObject<Map | null>
  isMapReady: boolean
  samples: Partial<Sample>[]
  /** When tid is in URL, call with that id to run distance (e.g. fetch sample + handleCalculateDists). */
  onRestoreTargetId?: (id: string) => void
}

/** Restore map state from URL query params once (on mount / first ready). */
export function useRestoreMapFromUrl({ mapRef, isMapReady, samples, onRestoreTargetId }: UseRestoreMapFromUrlProps) {
  const searchParams = useSearchParams()
  const restored = useRef(false)
  const {
    setTimeWindow,
    setSampleFilter,
    setMapMode,
    setSelectedYDNA,
    setSelectedSample,
    setTargetSample,
    setMapView,
  } = useMapStore()

  useEffect(() => {
    if (!isMapReady || restored.current) return
    const params = parseShareMapParams(searchParams)
    if (!params) return
    restored.current = true

    if (params.t0 != null || params.t1 != null) {
      const t0 = params.t0 ?? -50000
      const t1 = params.t1 ?? 2000
      setTimeWindow([t0, t1])
    }
    if (params.f) setSampleFilter(params.f)
    if (params.m) setMapMode(params.m)
    if (params.ydna) setSelectedYDNA(params.ydna.split(',').filter(Boolean))
    if (params.sid && samples.length) {
      const sample = samples.find((s) => s.id === params.sid)
      if (sample) setSelectedSample(sample as Sample)
    }
    if (params.lat != null && params.lng != null && params.z != null) {
      setMapView([params.lng, params.lat], params.z)
      const map = mapRef?.current
      if (map) map.flyTo({ center: [params.lng!, params.lat!], zoom: params.z!, duration: 0 })
    } else if (params.lat != null && params.lng != null) {
      const z = params.z ?? 5
      setMapView([params.lng, params.lat], z)
      const map = mapRef?.current
      if (map) map.flyTo({ center: [params.lng, params.lat], zoom: z, duration: 0 })
    }
    if (params.tid && onRestoreTargetId) onRestoreTargetId(params.tid)
  }, [
    isMapReady,
    searchParams,
    samples,
    mapRef,
    setTimeWindow,
    setSampleFilter,
    setMapMode,
    setSelectedYDNA,
    setSelectedSample,
    setMapView,
    onRestoreTargetId,
  ])
}

/**
 * Share map view: encode/decode map state in URL query params.
 * Keys kept short for share links.
 */
import { MapMode, SampleFilter } from '@/types'

export interface ShareMapParams {
  t0?: number
  t1?: number
  f?: SampleFilter
  m?: MapMode
  ydna?: string
  sid?: string
  tid?: string
  lat?: number
  lng?: number
  z?: number
}

const DEFAULT_T0 = -50000
const DEFAULT_T1 = 2000

export function buildShareMapParams(state: {
  timeWindow: [number, number]
  sampleFilter: SampleFilter
  mapMode: MapMode
  selectedYDNA: string[]
  selectedSampleId: string | null
  targetSampleId: string | null
  mapCenter: [number, number] | null
  mapZoom: number | null
}): ShareMapParams {
  const p: ShareMapParams = {}
  if (state.timeWindow[0] !== DEFAULT_T0) p.t0 = state.timeWindow[0]
  if (state.timeWindow[1] !== DEFAULT_T1) p.t1 = state.timeWindow[1]
  if (state.sampleFilter !== 'ancient') p.f = state.sampleFilter
  if (state.mapMode !== 'neutral') p.m = state.mapMode
  if (state.selectedYDNA?.length) p.ydna = state.selectedYDNA.join(',')
  if (state.selectedSampleId) p.sid = state.selectedSampleId
  if (state.targetSampleId) p.tid = state.targetSampleId
  if (state.mapCenter) {
    p.lat = state.mapCenter[1]
    p.lng = state.mapCenter[0]
  }
  if (state.mapZoom != null) p.z = state.mapZoom
  return p
}

export function shareMapParamsToQuery(params: ShareMapParams): string {
  const search = new URLSearchParams()
  if (params.t0 != null) search.set('t0', String(params.t0))
  if (params.t1 != null) search.set('t1', String(params.t1))
  if (params.f) search.set('f', params.f)
  if (params.m) search.set('m', params.m)
  if (params.ydna) search.set('ydna', params.ydna)
  if (params.sid) search.set('sid', params.sid)
  if (params.tid) search.set('tid', params.tid)
  if (params.lat != null) search.set('lat', String(params.lat))
  if (params.lng != null) search.set('lng', String(params.lng))
  if (params.z != null) search.set('z', String(params.z))
  const q = search.toString()
  return q ? `?${q}` : ''
}

export function parseShareMapParams(searchParams: URLSearchParams): ShareMapParams | null {
  const t0 = searchParams.get('t0')
  const t1 = searchParams.get('t1')
  const f = searchParams.get('f')
  const m = searchParams.get('m')
  const ydna = searchParams.get('ydna')
  const sid = searchParams.get('sid')
  const tid = searchParams.get('tid')
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const z = searchParams.get('z')
  if (!t0 && !t1 && !f && !m && !ydna && !sid && !tid && !lat && !lng && !z) return null
  const params: ShareMapParams = {}
  if (t0 != null) params.t0 = Number(t0)
  if (t1 != null) params.t1 = Number(t1)
  if (f === 'ancient' || f === 'modern' || f === 'all') params.f = f
  if (m === 'neutral' || m === 'ydna' || m === 'distance') params.m = m
  if (ydna) params.ydna = ydna
  if (sid) params.sid = sid
  if (tid) params.tid = tid
  if (lat != null) params.lat = Number(lat)
  if (lng != null) params.lng = Number(lng)
  if (z != null) params.z = Number(z)
  return params
}

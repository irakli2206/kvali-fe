'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

/**
 * Shows a success toast when user returns from checkout (?dna_purchased=1).
 */
export default function DnaPurchaseToast() {
  const searchParams = useSearchParams()
  const shown = useRef(false)

  useEffect(() => {
    if (shown.current) return
    if (searchParams.get('dna_purchased') === '1') {
      shown.current = true
      toast.success('Purchase complete! You can now upload your raw DNA.')
    }
  }, [searchParams])

  return null
}

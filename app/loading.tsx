// app/your-route/loading.tsx
export default function Loading() {
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-600"></div>
            <p className="ml-4">Loading Kvali...</p>
        </div>
    )
}
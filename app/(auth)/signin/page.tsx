import { GalleryVerticalEnd } from "lucide-react"
import { SigninForm } from "@/components/views/signin/signin-form"
import Logo from '@/assets/kvali logo.png'
import Image from "next/image"


export default function SigninPage() {
    return (

        <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">

            <div className="w-full max-w-sm md:max-w-4xl">
                <SigninForm />
            </div>
        </div>
    )
}








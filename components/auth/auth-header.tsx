
import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/assets/kvali logo.png'
import KvaliLogo from '@/assets/logo'

const AuthHeader = () => {

    return (
        <div className='w-full h-auto fixed p-4  '>


            <Link href='/'>
                <KvaliLogo className="h-8 w-auto" />
            </Link>
        </div>
    )
}

export default AuthHeader
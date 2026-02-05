
import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import Logo from '@/assets/kvali logo.png'

const AuthHeader = () => {

    return (
        <div className='w-full h-auto fixed p-4  '>


            <Link href='/'>
                <Image src={Logo} alt='' width={128} height={128} className='h-8 w-auto absolute left-1/2 -translate-x-1/2 top-4' />
            </Link>
        </div>
    )
}

export default AuthHeader
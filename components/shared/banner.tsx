import React from 'react'

const Banner = ({ children }: { children: string }) => {
    return (
        <div className='w-full fixed bg-muted p-2 flex items-center justify-center border-b text-xs'>{children}</div>
    )
}

export default Banner
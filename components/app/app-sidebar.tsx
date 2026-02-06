import { signout } from "@/app/(auth)/actions"
import Logo from "@/assets/kvali logo.png"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Earth, Footprints, Home, LogOut, Map, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function AppSidebar() {
  const { open, setOpen, setOpenMobile, isMobile } = useSidebar()

  // We only want hover behavior on Desktop
  const handleMouseEnter = () => {
    if (!isMobile) setOpen(true)
  }

  const handleMouseLeave = () => {
    if (!isMobile) setOpen(false)
  }


  return (
    <Sidebar
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="transition-all duration-100 ease-in-out " // Smooth cinematic slide
    >
      <SidebarHeader>
        {/* Kvali Logo */}
        {/* {open && <Image src={Logo} alt='' width={128} height={128} className='h-8 w-fit' />} */}
      </SidebarHeader>
      <SidebarContent className='justify-between'>
        <SidebarGroup></SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem >
              <SidebarMenuButton asChild>
                <Link href={'/app'}>
                  <Earth />
                  <span>Journey</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem >
              <SidebarMenuButton asChild>
                <Link href={'/app/g25'}>
                  <Earth />
                  <span>G25</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem >
              <SidebarMenuButton asChild onClick={() => signout()}>
                <Link href={'/app'}>
                  <LogOut className="rotate-180" />
                  <span>Sign out</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        {/* Your Navigation Items */}
      </SidebarContent>
    </Sidebar>
  )
}
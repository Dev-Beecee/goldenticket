"use client";

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const getNavData = (userRole: string | null) => {
  const allItems = [
    {
      title: "Dashboard",
      url: "/ghost-dashboard",
    },
    {
      title: "Inscriptions",
      url: "/ghost-dashboard/inscriptions",
    },
    {
      title: "Participations",
      url: "/ghost-dashboard/participations",
    },
    {
      title: "Participations invalide",
      url: "/ghost-dashboard/participation-invalide",
    },
    {
      title: "Gagnants",
      url: "/ghost-dashboard/gagnants",
    },
    {
      title: "Statistiques",
      url: "/ghost-dashboard/statistiques",
    },
    {
      title: "Création des lots",
      url: "/ghost-dashboard/createlots",
    },
    {
      title: "Répartition des lots",
      url: "/ghost-dashboard/repartlots",
    },
    {
      title: "Restaurants",
      url: "/ghost-dashboard/restaurants",
    },
    {
      title: "Création utilisateur",
      url: "/ghost-dashboard/creer-utilisateur",
    },
    {
      title: "Réglages",
      url: "/ghost-dashboard/reglage",
    },
  ];

  // Si l'utilisateur est admin-mcdo, masquer certains éléments
  if (userRole === "admin-mcdo") {
    const restrictedItems = [
      "Création des lots",
      "Répartition des lots", 
      "Restaurants",
      "Création utilisateur",
      "Réglages"
    ];
    
    return allItems.filter(item => !restrictedItems.includes(item.title));
  }

  // Pour admin ou autres rôles, afficher tout
  return allItems;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && user.user_metadata?.role) {
        setUserRole(user.user_metadata.role);
      }
      setLoading(false);
    };
    fetchUserRole();
  }, []);

  const navItems = getNavData(userRole);

  const data = {
    navMain: [
      {
        title: "Réglage",
        isActive: true,
        url: "#",
        items: navItems,
      },
    ],
  };

  if (loading) {
    return (
      <Sidebar {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Image src="/Rubeez.svg" alt="Logo Rubeez" width={24} height={24} />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Rubeez</span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <div className="p-4 text-center text-gray-500">Chargement...</div>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    );
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Image src="/Rubeez.svg" alt="Logo Rubeez" width={24} height={24} />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Rubeez</span>

                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <a href={item.url} className="font-medium">
                    {item.title}
                  </a>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub>
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild >
                          <a href={item.url}>{item.title}</a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

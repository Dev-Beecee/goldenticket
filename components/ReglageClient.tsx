"use client";

import PeriodeJeuForm from "@/components/PeriodeJeuForm";
import ShareButtonConfigurator from "@/components/ShareButtonConfigurator";
import GameConfigForm from "@/components/GameConfigForm";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DangerZone from "@/components/DangerZone";

export default function ReglageClient({ userId, baseShareUrl }: { userId: string, baseShareUrl: string }) {
    return (
        <Tabs defaultValue="periode">
            <TabsList>
                <TabsTrigger value="periode">Période du jeu</TabsTrigger>
                <TabsTrigger value="partage">Bouton de partage</TabsTrigger>
                <TabsTrigger value="config">Configuration du jeu</TabsTrigger>
                <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>
            <TabsContent value="periode">
                <PeriodeJeuForm />
            </TabsContent>
            <TabsContent value="partage">
                <ShareButtonConfigurator userId={userId} baseShareUrl={baseShareUrl} />
            </TabsContent>
            <TabsContent value="config">
                <GameConfigForm />
            </TabsContent>
            <TabsContent value="danger">
                <DangerZone />
            </TabsContent>
        </Tabs>
    );
} 
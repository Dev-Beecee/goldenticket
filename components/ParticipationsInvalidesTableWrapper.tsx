"use client";

import { useState } from "react";
import ParticipationsInvalidesTable from "./participation-table/ParticipationsInvalidesTable";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function ParticipationsInvalidesTableWrapper({ 
    participations: initialParticipations 
}: { 
    participations: any[] 
}) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <ParticipationsInvalidesTable
                participations={initialParticipations}
                setSelectedImage={setSelectedImage}
                setIsModalOpen={setIsModalOpen}
            />

            {isModalOpen && selectedImage && (
                <Lightbox
                    open={isModalOpen}
                    close={() => setIsModalOpen(false)}
                    slides={[{ src: selectedImage }]}
                />
            )}
        </>
    );
} 
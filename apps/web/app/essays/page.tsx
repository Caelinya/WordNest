"use client";

import { EssayAnalysis } from "@/components/features/EssayAnalysis";
import { useSearchParams } from "next/navigation";

export default function EssaysPage() {
    const searchParams = useSearchParams();
    const editEssayId = searchParams?.get('edit');

    return (
        <EssayAnalysis 
            initialEssayId={editEssayId ? parseInt(editEssayId) : undefined}
        />
    );
}

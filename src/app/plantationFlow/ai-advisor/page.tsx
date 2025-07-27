"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AppLayout from "@/components/agrimitra/app-layout";
import { AiPlantationAdvisor } from "@/components/ai-plantation-advisor";
import { plantationFlowService } from "@/firebaseStore/services";
import { useAuth } from "@/contexts/auth-context";
import { PlantationFlowData } from "@/ai/flows/plantation-flow";
import { useToast } from "@/hooks/use-toast";

export default function AiAdvisorPage() {
	const router = useRouter();
	const { user } = useAuth();
	const { toast } = useToast();
	const [isLoading, setIsLoading] = useState(false);

	const handleSavePlan = async (plan: PlantationFlowData) => {
		if (!user?.uid) {
			toast({
				title: "Authentication Required",
				description: "Please sign in to save your plantation plan",
				variant: "destructive",
			});
			return;
		}

		setIsLoading(true);
		try {
			// Add user ID to the plan
			const plantationFlow: PlantationFlowData = {
				...plan,
				id: Date.now().toString(),
				userId: user.uid,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			await plantationFlowService.storePlantationFlow(plantationFlow);

			toast({
				title: "Success",
				description: "Plantation plan saved successfully!",
			});

			// Navigate to the plantation flow list
			router.push("/plantationFlow");
		} catch (error) {
			console.error("Error saving plan:", error);
			toast({
				title: "Error",
				description: "Failed to save plantation plan",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AppLayout
			title="AI Plantation Advisor"
			subtitle="Get AI-powered recommendations for your plantation"
			showBackButton={true}
		>
			<div className="max-w-4xl container mx-auto p-6">
				<div className="mb-6">
					<Button
						variant="ghost"
						onClick={() => router.push("/plantationFlow")}
						className="gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Plantation Flows
					</Button>
				</div>

				<AiPlantationAdvisor onSavePlan={handleSavePlan} />
			</div>
		</AppLayout>
	);
}

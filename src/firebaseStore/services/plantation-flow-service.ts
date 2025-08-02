import { DBCollectionKeys, FirestoreService } from "../firestore-service";

export interface PlantationStep {
	id: string;
	name: string;
	description: string;
	startDate: Date;
	endDate: Date;
	status: "Pending" | "Ongoing" | "Completed" | "Skipped";
}

export interface PlantationCycle {
	id: string;
	name: string;
	area: string;
	expectedIncome: string;
	description: string;
	startDate: Date;
	endDate: Date;
	cycle: PlantationStep[];
	status: "Pending" | "Ongoing" | "Completed" | "Aborted";
}

export interface PlantationFlowData {
	id: string;
	name: string;
	description?: string;
	crops: PlantationCycle[];
	aiSuggestedDeviation: PlantationCycle[];
	userId: string;
	status: "Pending" | "Ongoing" | "Aborted" | "Completed";
	startDate: Date;
	endDate: Date;
	createdAt: Date;
	updatedAt: Date;
}

export class PlantationFlowService extends FirestoreService<PlantationFlowData> {
	constructor() {
		super(DBCollectionKeys.PlantationFlows);
	}

	async createPlantationFlow(
		plantationFlowData: Omit<PlantationFlowData, "createdAt" | "updatedAt">,
	): Promise<string> {
		const id = plantationFlowData.id || Date.now().toString();
		const data = {
			...plantationFlowData,
			id,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		await this.upsert(id, data);
		return id;
	}

	async storePlantationFlow(
		plantationFlowData: PlantationFlowData,
	): Promise<string> {
		const id = plantationFlowData.id || Date.now().toString();
		const data = {
			...plantationFlowData,
			id,
			createdAt: plantationFlowData.createdAt || new Date(),
			updatedAt: new Date(),
		};
		await this.upsert(id, data);
		return id;
	}

	async updatePlantationFlow(
		id: string,
		plantationFlowData: Partial<PlantationFlowData>,
	): Promise<void> {
		const data = {
			...plantationFlowData,
			updatedAt: new Date(),
		};
		return this.update(id, data);
	}

	async deletePlantationFlow(id: string): Promise<void> {
		return this.delete(id);
	}

	async getPlantationFlowsByUser(
		userId: string,
	): Promise<PlantationFlowData[]> {
		return this.getWhere("userId", "==", userId);
	}

	async getPlantationFlowsByUserId(
		userId: string,
	): Promise<PlantationFlowData[]> {
		return this.getPlantationFlowsByUser(userId);
	}

	async getActivePlantationFlows(
		userId: string,
	): Promise<PlantationFlowData[]> {
		const flows = await this.getPlantationFlowsByUserId(userId);
		return flows.filter(
			(flow) => flow.status === "Ongoing" || flow.status === "Pending",
		);
	}

	async getPlantationFlowById(id: string): Promise<PlantationFlowData | null> {
		return this.get(id);
	}

	async updateStepStatus(
		plantationFlowId: string,
		cropId: string,
		stepId: string,
		status: PlantationStep["status"],
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = plantationFlow.crops.map((crop) => {
				if (crop.id === cropId) {
					const updatedCycle = crop.cycle.map((step) =>
						step.id === stepId ? { ...step, status } : step,
					);
					return { ...crop, cycle: updatedCycle };
				}
				return crop;
			});
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	async updateCropStatus(
		plantationFlowId: string,
		cropId: string,
		status: PlantationCycle["status"],
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = plantationFlow.crops.map((crop) =>
				crop.id === cropId ? { ...crop, status } : crop,
			);
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	async addCropToFlow(
		plantationFlowId: string,
		crop: PlantationCycle,
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = [...plantationFlow.crops, crop];
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	async removeCropFromFlow(
		plantationFlowId: string,
		cropId: string,
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = plantationFlow.crops.filter(
				(crop) => crop.id !== cropId,
			);
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	async addStepToCrop(
		plantationFlowId: string,
		cropId: string,
		step: PlantationStep,
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = plantationFlow.crops.map((crop) => {
				if (crop.id === cropId) {
					const updatedCycle = [...crop.cycle, step];
					return { ...crop, cycle: updatedCycle };
				}
				return crop;
			});
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	async removeStepFromCrop(
		plantationFlowId: string,
		cropId: string,
		stepId: string,
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = plantationFlow.crops.map((crop) => {
				if (crop.id === cropId) {
					const updatedCycle = crop.cycle.filter((step) => step.id !== stepId);
					return { ...crop, cycle: updatedCycle };
				}
				return crop;
			});
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	// New utility methods

	async updateFlowStatus(
		plantationFlowId: string,
		status: PlantationFlowData["status"],
	): Promise<void> {
		return this.updatePlantationFlow(plantationFlowId, { status });
	}

	async updateStepDates(
		plantationFlowId: string,
		cropId: string,
		stepId: string,
		startDate: Date,
		endDate: Date,
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = plantationFlow.crops.map((crop) => {
				if (crop.id === cropId) {
					const updatedCycle = crop.cycle.map((step) =>
						step.id === stepId ? { ...step, startDate, endDate } : step,
					);
					return { ...crop, cycle: updatedCycle };
				}
				return crop;
			});
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	async updateCropDates(
		plantationFlowId: string,
		cropId: string,
		startDate: Date,
		endDate: Date,
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (plantationFlow) {
			const updatedCrops = plantationFlow.crops.map((crop) =>
				crop.id === cropId ? { ...crop, startDate, endDate } : crop,
			);
			await this.updatePlantationFlow(plantationFlowId, {
				crops: updatedCrops,
			});
		}
	}

	async getFlowProgress(plantationFlowId: string): Promise<{
		totalSteps: number;
		completedSteps: number;
		percentComplete: number;
	}> {
		const plantationFlow = await this.get(plantationFlowId);
		if (!plantationFlow) {
			return { totalSteps: 0, completedSteps: 0, percentComplete: 0 };
		}

		let totalSteps = 0;
		let completedSteps = 0;

		plantationFlow.crops.forEach((crop) => {
			totalSteps += crop.cycle.length;
			completedSteps += crop.cycle.filter(
				(step) => step.status === "Completed",
			).length;
		});

		const percentComplete =
			totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

		return { totalSteps, completedSteps, percentComplete };
	}

	async updateMultipleStepsStatus(
		plantationFlowId: string,
		updates: Array<{
			cropId: string;
			stepId: string;
			status: PlantationStep["status"];
		}>,
	): Promise<void> {
		const plantationFlow = await this.get(plantationFlowId);
		if (!plantationFlow) return;

		const updatedCrops = plantationFlow.crops.map((crop) => {
			const cropUpdates = updates.filter((update) => update.cropId === crop.id);
			if (cropUpdates.length === 0) return crop;

			const updatedCycle = crop.cycle.map((step) => {
				const stepUpdate = cropUpdates.find(
					(update) => update.stepId === step.id,
				);
				return stepUpdate ? { ...step, status: stepUpdate.status } : step;
			});

			return { ...crop, cycle: updatedCycle };
		});

		await this.updatePlantationFlow(plantationFlowId, { crops: updatedCrops });
	}
}

export default new PlantationFlowService();

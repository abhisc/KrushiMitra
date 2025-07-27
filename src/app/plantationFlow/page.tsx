"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	CalendarIcon,
	Plus,
	Trash2,
	Save,
	PlusCircle,
	Edit,
	Eye,
	ArrowLeft,
	Sprout,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/agrimitra/app-layout";
import { plantationFlowService } from "@/firebaseStore/services";
import { useAuth } from "@/contexts/auth-context";
import {
	PlantationCycle,
	PlantationFlowData,
	PlantationStep,
} from "@/firebaseStore/services/plantation-flow-service";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";

type ScreenType = "list" | "add" | "edit" | "view";

export default function PlantationFlowPage() {
	const { user } = useAuth();
	const router = useRouter();
	const [currentScreen, setCurrentScreen] = useState<ScreenType>("list");
	const [plantationFlows, setPlantationFlows] = useState<PlantationFlowData[]>(
		[],
	);
	const [selectedFlow, setSelectedFlow] = useState<PlantationFlowData | null>(
		null,
	);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState<Partial<PlantationFlowData>>({
		name: "",
		description: "",
		crops: [],
		status: "Pending",
	});

	const { toast } = useToast();
	const plantationService = plantationFlowService;

	const formatDate = (newDate: any) => {
		const dater = newDate?.toDate ? newDate?.toDate() : newDate;
		return new Date(dater).toLocaleDateString();
	};

	// Load plantation flows on component mount
	useEffect(() => {
		if (currentScreen === "list") {
			loadPlantationFlows();
		}
	}, [currentScreen, user]);

	const loadPlantationFlows = async () => {
		if (!user?.uid) return;

		setIsLoading(true);
		try {
			const flows = await plantationService.getPlantationFlowsByUser(user.uid);

			setPlantationFlows(flows);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to load plantation flows.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			crops: [],
			status: "Pending",
		});
		setSelectedFlow(null);
	};

	const handleAddNew = () => {
		resetForm();
		setCurrentScreen("add");
	};

	const handleEdit = (flow: PlantationFlowData) => {
		setSelectedFlow(flow);
		setFormData(flow);
		setCurrentScreen("edit");
	};

	const handleView = (flow: PlantationFlowData) => {
		setSelectedFlow(flow);
		setCurrentScreen("view");
	};

	const handleBack = () => {
		setCurrentScreen("list");
		resetForm();
	};

	const addCrop = () => {
		const newCrop: PlantationCycle = {
			id: `crop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			name: "",
			description: "",
			startDate: new Date(),
			endDate: new Date(),
			cycle: [],
			status: "Pending",
		};

		setFormData((prev) => ({
			...prev,
			crops: [...(prev.crops || []), newCrop],
		}));
	};

	const updateCrop = (
		cropId: string,
		field: keyof PlantationCycle,
		value: any,
	) => {
		setFormData((prev) => ({
			...prev,
			crops:
				prev.crops?.map((crop) => {
					if (crop.id === cropId) {
						return { ...crop, [field]: value };
					}
					return crop;
				}) || [],
		}));
	};

	const removeCrop = (cropId: string) => {
		setFormData((prev) => ({
			...prev,
			crops: prev.crops?.filter((crop) => crop.id !== cropId) || [],
		}));
	};

	const addStepToCrop = (cropId: string) => {
		const newStep: PlantationStep = {
			id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			name: "",
			description: "",
			startDate: new Date(),
			endDate: new Date(),
			status: "Pending",
		};

		setFormData((prev) => ({
			...prev,
			crops:
				prev.crops?.map((crop) =>
					crop.id === cropId
						? { ...crop, cycle: [...crop.cycle, newStep] }
						: crop,
				) || [],
		}));
	};

	const updateStep = (
		cropId: string,
		stepId: string,
		field: keyof PlantationStep,
		value: any,
	) => {
		setFormData((prev) => {
			const newFormData = {
				...prev,
				crops:
					prev.crops?.map((crop) => {
						if (crop.id === cropId) {
							return {
								...crop,
								cycle: crop.cycle.map((step) => {
									if (step.id === stepId) {
										return { ...step, [field]: value };
									}
									return { ...step };
								}),
							};
						}
						return { ...crop };
					}) || [],
			};
			return newFormData;
		});
	};

	const removeStep = (cropId: string, stepId: string) => {
		setFormData((prev) => ({
			...prev,
			crops:
				prev.crops?.map((crop) =>
					crop.id === cropId
						? {
								...crop,
								cycle: crop.cycle.filter((step) => step.id !== stepId),
							}
						: crop,
				) || [],
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			if (currentScreen === "edit" && selectedFlow) {
				// Update existing flow
				const updatedFlow: PlantationFlowData = {
					...selectedFlow,
					...(formData as PlantationFlowData),
					updatedAt: new Date(),
				};
				await plantationService.updatePlantationFlow(
					updatedFlow.id,
					updatedFlow,
				);
				toast({
					title: "Success",
					description: "Plantation flow updated successfully!",
				});
			} else {
				// Create new flow
				const plantationFlow: PlantationFlowData = {
					...(formData as PlantationFlowData),
					id: Date.now().toString(),
					userId: user?.uid || "current-user-id",
					aiSuggestedDeviation: [],
					startDate: new Date(),
					endDate: new Date(),
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				await plantationService.storePlantationFlow(plantationFlow);
				toast({
					title: "Success",
					description: "Plantation flow created successfully!",
				});
			}
			setCurrentScreen("list");
			resetForm();
		} catch (error) {
			toast({
				title: "Error",
				description: `Failed to ${currentScreen === "edit" ? "update" : "create"} plantation flow.`,
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleDelete = async (flowId: string) => {
		if (!confirm("Are you sure you want to delete this plantation flow?"))
			return;

		setIsLoading(true);
		try {
			await plantationService.deletePlantationFlow(flowId);
			toast({
				title: "Success",
				description: "Plantation flow deleted successfully!",
			});
			loadPlantationFlows();
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to delete plantation flow.",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Helper function to convert plantation steps to timeline items
	const convertStepsToTimelineItems = (
		steps: PlantationStep[],
	): TimelineItem[] => {
		return steps.map((step) => {
			const startDate =
				step.startDate instanceof Date
					? step.startDate
					: new Date(step.startDate);
			const endDate =
				step.endDate instanceof Date ? step.endDate : new Date(step.endDate);
			const now = new Date();

			// Calculate time progress
			let timeProgress = 0;
			const totalDuration = endDate.getTime() - startDate.getTime();

			if (totalDuration <= 0) {
				timeProgress = 100;
			} else if (now < startDate) {
				timeProgress = 0;
			} else if (now > endDate) {
				timeProgress = 100;
			} else {
				const elapsed = now.getTime() - startDate.getTime();
				timeProgress = Math.round((elapsed / totalDuration) * 100);
			}

			return {
				id: step.id,
				title: step.name,
				description: step.description,
				status: step.status,
				startDate: step.startDate,
				endDate: step.endDate,
				isActive: step.status === "Ongoing",
				timeProgress: timeProgress,
			};
		});
	};

	// Helper function to convert crops to timeline items
	const convertCropsToTimelineItems = (
		crops: PlantationCycle[],
	): TimelineItem[] => {
		return crops.map((crop) => {
			const startDate =
				crop.startDate instanceof Date
					? crop.startDate
					: new Date(crop.startDate);
			const endDate =
				crop.endDate instanceof Date ? crop.endDate : new Date(crop.endDate);
			const now = new Date();

			// Calculate time progress
			let timeProgress = 0;
			const totalDuration = endDate.getTime() - startDate.getTime();

			if (totalDuration <= 0) {
				timeProgress = 100;
			} else if (now < startDate) {
				timeProgress = 0;
			} else if (now > endDate) {
				timeProgress = 100;
			} else {
				const elapsed = now.getTime() - startDate.getTime();
				timeProgress = Math.round((elapsed / totalDuration) * 100);
			}

			return {
				id: crop.id,
				title: crop.name,
				description: crop.description,
				status: crop.status,
				startDate: crop.startDate,
				endDate: crop.endDate,
				isActive: crop.status === "Ongoing",
				timeProgress: timeProgress,
			};
		});
	};

	// Get current progress for a crop
	const getCropProgress = (crop: PlantationCycle) => {
		if (!crop.cycle.length) return { completed: 0, total: 0, percentage: 0 };

		const completed = crop.cycle.filter(
			(step) => step.status === "Completed",
		).length;
		const total = crop.cycle.length;
		const percentage = Math.round((completed / total) * 100);

		return { completed, total, percentage };
	};

	// Render List Screen
	const renderListScreen = () => (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold">Plantation Flows</h2>
					<p className="text-muted-foreground">
						Manage your plantation cycles and crops
					</p>
				</div>
				<div className="flex gap-2">
					<Button
						onClick={() => router.push("/plantationFlow/ai-advisor")}
						variant="outline"
						className="flex items-center gap-2"
					>
						<Sprout className="h-4 w-4" />
						AI Advisor
					</Button>
					<Button onClick={handleAddNew} className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Add New Flow
					</Button>
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center justify-center py-12">
					<div className="flex flex-col items-center gap-2">
						<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
						<p className="text-sm text-muted-foreground">
							Loading plantation flows...
						</p>
					</div>
				</div>
			) : plantationFlows.length === 0 ? (
				<Card>
					<CardContent className="py-12">
						<div className="text-center">
							<h3 className="text-lg font-medium mb-2">No Plantation Flows</h3>
							<p className="text-muted-foreground mb-4">
								Get started by creating your first plantation flow
							</p>
							<Button onClick={handleAddNew} className="gap-2">
								<Plus className="h-4 w-4" />
								Create First Flow
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
					{plantationFlows.map((flow) => {
						// Calculate overall progress based on crops and their steps
						const totalSteps =
							flow.crops?.reduce((acc, crop) => acc + crop.cycle.length, 0) ||
							0;

						const completedSteps =
							flow.crops?.reduce(
								(acc, crop) =>
									acc +
									crop.cycle.filter((step) => step.status === "Completed")
										.length,
								0,
							) || 0;

						const progressPercentage =
							totalSteps > 0
								? Math.round((completedSteps / totalSteps) * 100)
								: 0;

						// Get active crops count
						const activeCrops =
							flow.crops?.filter((crop) => crop.status === "Ongoing").length ||
							0;

						return (
							<Card
								className="overflow-hidden transition-all hover:shadow-md"
								key={flow.id}
							>
								<div className="relative">
									{/* Status indicator strip */}
									<div
										className={`absolute h-1 top-0 left-0 right-0 ${
											flow.status === "Completed"
												? "bg-green-500"
												: flow.status === "Ongoing"
													? "bg-blue-500"
													: flow.status === "Aborted"
														? "bg-red-500"
														: "bg-yellow-500"
										}`}
									/>

									<CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
										<div
											className="space-y-1 cursor-pointer"
											onClick={() => handleView(flow)}
										>
											<CardTitle className="text-xl font-medium">
												{flow.name}
											</CardTitle>
											{flow.description && (
												<p className="text-sm text-muted-foreground line-clamp-2">
													{flow.description}
												</p>
											)}
										</div>
										<div className="flex space-x-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleEdit(flow)}
												className="h-8 w-8"
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.stopPropagation();
													handleDelete(flow.id);
												}}
												className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardHeader>

									<CardContent
										className="cursor-pointer"
										onClick={() => handleView(flow)}
									>
										<div className="space-y-4">
											{/* Progress bar */}
											<div className="space-y-1">
												<div className="flex items-center justify-between">
													<span className="text-sm font-medium">
														Overall Progress
													</span>
													<span className="text-sm font-medium">
														{progressPercentage}%
													</span>
												</div>
												<div className="h-2 w-full bg-gray-100 rounded-full">
													<div
														className={`h-2 rounded-full ${
															flow.status === "Completed"
																? "bg-green-500"
																: flow.status === "Ongoing"
																	? "bg-blue-500"
																	: flow.status === "Aborted"
																		? "bg-red-500"
																		: "bg-yellow-500"
														}`}
														style={{ width: `${progressPercentage}%` }}
													/>
												</div>
											</div>

											{/* Status badges and meta info */}
											<div className="flex flex-wrap gap-2 items-center justify-between">
												<div className="flex gap-2 flex-wrap">
													<Badge
														variant="outline"
														className={`${
															flow.status === "Completed"
																? "border-green-500 text-green-700 bg-green-50"
																: flow.status === "Ongoing"
																	? "border-blue-500 text-blue-700 bg-blue-50"
																	: flow.status === "Aborted"
																		? "border-red-500 text-red-700 bg-red-50"
																		: "border-yellow-500 text-yellow-700 bg-yellow-50"
														}`}
													>
														{flow.status}
													</Badge>

													<Badge variant="outline" className="bg-gray-50">
														{flow.crops?.length || 0}{" "}
														{flow.crops?.length === 1 ? "crop" : "crops"}
													</Badge>

													{activeCrops > 0 && (
														<Badge
															variant="outline"
															className="border-blue-500 text-blue-700 bg-blue-50"
														>
															{activeCrops} active
														</Badge>
													)}
												</div>

												<div className="text-sm text-muted-foreground">
													Created {flow.createdAt && formatDate(flow.createdAt)}
												</div>
											</div>

											{/* Quick crop preview */}
											{flow.crops && flow.crops.length > 0 && (
												<div className="mt-2 space-y-1">
													<div className="text-sm font-medium">Crops:</div>
													<div className="flex flex-wrap gap-1">
														{flow.crops.slice(0, 3).map((crop) => {
															return (
																<Badge
																	key={crop.id || crop.description}
																	variant="secondary"
																	className="text-xs"
																>
																	{crop.name}
																</Badge>
															);
														})}
														{flow.crops.length > 3 && (
															<Badge variant="outline" className="text-xs">
																+{flow.crops.length - 3} more
															</Badge>
														)}
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</div>
							</Card>
						);
					})}
				</div>
			)}
		</div>
	);

	// Enhanced View Screen with Timeline
	const renderViewScreen = () => {
		if (!selectedFlow) return null;

		const flowTimelineItems = selectedFlow.crops
			? convertCropsToTimelineItems(selectedFlow.crops)
			: [];

		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Button variant="ghost" onClick={handleBack}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to List
						</Button>
						<div>
							<h2 className="text-2xl font-bold">{selectedFlow.name}</h2>
							<p className="text-muted-foreground">
								View plantation flow details and progress
							</p>
						</div>
					</div>
					<Button
						onClick={() => handleEdit(selectedFlow)}
						variant="default"
						className="flex items-center gap-2"
					>
						<Edit className="h-4 w-4" />
						Edit Flow
					</Button>
				</div>

				<div className="max-h-[75vh] overflow-auto">
					<Card>
						<CardHeader>
							<CardTitle>Flow Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid md:grid-cols-2 gap-2">
								<div>
									<Label className="font-medium">Name</Label>
									<p className="text-sm text-muted-foreground">
										{selectedFlow.name}
									</p>
								</div>
								<div>
									<Label className="font-medium">Status</Label>
									<Badge
										className="ml-2"
										variant={
											selectedFlow.status === "Completed"
												? "default"
												: selectedFlow.status === "Ongoing"
													? "secondary"
													: selectedFlow.status === "Aborted"
														? "destructive"
														: "outline"
										}
									>
										{selectedFlow.status}
									</Badge>
								</div>
							</div>
							{selectedFlow.description && (
								<div>
									<Label className="font-medium">Description</Label>
									<p className="text-sm text-muted-foreground">
										{selectedFlow.description}
									</p>
								</div>
							)}
						</CardContent>
					</Card>

					{selectedFlow.crops && selectedFlow.crops.length > 0 && (
						<Tabs defaultValue="timeline" className="w-full">
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="timeline">Timeline View</TabsTrigger>
								<TabsTrigger value="details">Detailed View</TabsTrigger>
							</TabsList>

							<TabsContent value="timeline" className="space-y-6">
								{/* Overall Flow Timeline */}
								<Card>
									<CardHeader>
										<CardTitle>Overall Progress Timeline</CardTitle>
										<p className="text-sm text-muted-foreground">
											Track the progress of all crops in this plantation flow
										</p>
									</CardHeader>
									<CardContent>
										<Timeline
											items={flowTimelineItems}
											orientation="vertical"
											showDates={true}
										/>
									</CardContent>
								</Card>

								{/* Individual Crop Timelines */}
								<div className="space-y-6">
									{selectedFlow.crops.map((crop, index) => {
										const cropProgress = getCropProgress(crop);
										const stepTimeline = convertStepsToTimelineItems(
											crop.cycle,
										);

										return (
											<Card key={crop.id} className="border-2">
												<CardHeader>
													<div className="flex items-center justify-between">
														<div>
															<CardTitle className="text-lg">
																{crop.name} - Steps Timeline
															</CardTitle>
															<div className="flex items-center gap-2 mt-1">
																<Badge variant="outline">{crop.status}</Badge>
																{cropProgress.total > 0 && (
																	<span className="text-sm text-muted-foreground">
																		{cropProgress.completed}/
																		{cropProgress.total} steps completed (
																		{cropProgress.percentage}%)
																	</span>
																)}
															</div>
														</div>
													</div>
												</CardHeader>
												<CardContent>
													{crop.description && (
														<p className="text-sm text-muted-foreground mb-4">
															{crop.description}
														</p>
													)}

													<div className="grid md:grid-cols-2 gap-4 mb-6">
														<div>
															<Label className="font-medium">
																Crop Duration
															</Label>
															<p className="text-sm text-muted-foreground">
																{formatDate(crop.startDate, "PPP")} -{" "}
																{formatDate(crop.endDate, "PPP")}
															</p>
														</div>
														{cropProgress.total > 0 && (
															<div>
																<Label className="font-medium">Progress</Label>
																<div className="flex items-center gap-2">
																	<div className="flex-1 bg-gray-200 rounded-full h-2">
																		<div
																			className="bg-blue-600 h-2 rounded-full transition-all duration-300"
																			style={{
																				width: `${cropProgress.percentage}%`,
																			}}
																		/>
																	</div>
																	<span className="text-sm font-medium">
																		{cropProgress.percentage}%
																	</span>
																</div>
															</div>
														)}
													</div>

													{stepTimeline.length > 0 ? (
														<div>
															<Label className="font-medium mb-4 block">
																Plantation Steps Progress
															</Label>
															<Timeline
																items={stepTimeline}
																orientation="vertical"
																showDates={true}
																className="ml-4"
															/>
														</div>
													) : (
														<p className="text-muted-foreground text-center py-4">
															No steps defined for this crop
														</p>
													)}
												</CardContent>
											</Card>
										);
									})}
								</div>
							</TabsContent>

							<TabsContent value="details">
								{/* Original detailed view */}
								<Card>
									<CardHeader>
										<CardTitle>Crops ({selectedFlow.crops.length})</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											{selectedFlow.crops.map((crop, index) => (
												<Card key={crop.id} className="border-2">
													<CardHeader className="pb-3">
														<div className="flex items-center justify-between">
															<CardTitle className="text-lg">
																{crop.name} (Crop {index + 1})
															</CardTitle>
															<Badge variant="outline">{crop.status}</Badge>
														</div>
													</CardHeader>
													<CardContent>
														{crop.description && (
															<p className="text-sm text-muted-foreground mb-4">
																{crop.description}
															</p>
														)}
														<div className="grid md:grid-cols-2 gap-4 mb-4">
															<div>
																<Label className="font-medium">
																	Start Date
																</Label>
																<p className="text-sm text-muted-foreground">
																	{formatDate(crop.startDate, "PPP")}
																</p>
															</div>
															<div>
																<Label className="font-medium">End Date</Label>
																<p className="text-sm text-muted-foreground">
																	{formatDate(crop.endDate, "PPP")}
																</p>
															</div>
														</div>

														{crop.cycle.length > 0 && (
															<div>
																<Label className="font-medium mb-2 block">
																	Steps ({crop.cycle.length})
																</Label>
																<div className="space-y-2">
																	{crop.cycle.map((step, stepIndex) => (
																		<div
																			key={step.id}
																			className="border rounded p-3"
																		>
																			<div className="flex items-center justify-between mb-2">
																				<span className="font-medium text-sm">
																					{step.name} (Step {stepIndex + 1})
																				</span>
																				<Badge
																					variant="outline"
																					className="text-xs"
																				>
																					{step.status}
																				</Badge>
																			</div>
																			{step.description && (
																				<p className="text-xs text-muted-foreground mb-2">
																					{step.description}
																				</p>
																			)}
																			<div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
																				<span>
																					Start:{" "}
																					{formatDate(step.startDate, "MMM dd")}
																				</span>
																				<span>
																					End:{" "}
																					{formatDate(step.endDate, "MMM dd")}
																				</span>
																			</div>
																		</div>
																	))}
																</div>
															</div>
														)}
													</CardContent>
												</Card>
											))}
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					)}
				</div>
			</div>
		);
	};

	// Render Add/Edit Form Screen
	const renderFormScreen = () => (
		<div className="space-y-6 h-[20vh] overflow:auto">
			<div className="flex justify-between items-center gap-2">
				<div className="flex items-center">
					<Button variant="ghost" onClick={handleBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to List
					</Button>
					<div>
						<h2 className="text-2xl font-bold">
							{currentScreen === "edit" ? "Edit" : "Add"} Plantation Flow
						</h2>
						<p className="text-muted-foreground">
							{currentScreen === "edit" ? "Update" : "Create"} your plantation
							cycle and crops
						</p>
					</div>
				</div>

				{/* Submit Button */}
				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={handleBack}>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isLoading}
						className="flex items-center gap-2"
					>
						<Save className="h-4 w-4" />
						{isLoading
							? currentScreen === "edit"
								? "Updating..."
								: "Creating..."
							: currentScreen === "edit"
								? "Update Plantation Flow"
								: "Create Plantation Flow"}
					</Button>
				</div>
			</div>

			<div className="space-y-6 max-h-[70vh] overflow-auto">
				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div>
							<div>
								<Label htmlFor="name">Plantation Name *</Label>
								<Input
									id="name"
									value={formData.name || ""}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, name: e.target.value }))
									}
									placeholder="Enter plantation name"
									required
								/>
							</div>

							<div>
								<Label htmlFor="description">Description</Label>
								<Textarea
									id="description"
									value={formData.description || ""}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											description: e.target.value,
										}))
									}
									placeholder="Enter plantation description"
									rows={3}
								/>
							</div>

							<div>
								<Label htmlFor="status">Status</Label>
								<Select
									value={formData.status}
									onValueChange={(value) =>
										setFormData((prev) => ({ ...prev, status: value as any }))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Pending">Pending</SelectItem>
										<SelectItem value="Ongoing">Ongoing</SelectItem>
										<SelectItem value="Aborted">Aborted</SelectItem>
										<SelectItem value="Completed">Completed</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Crops Management */}
				<Card>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Crops & Cycles</CardTitle>
					</CardHeader>
					<CardContent>
						{formData.crops?.length === 0 ? (
							<p className="text-muted-foreground text-center py-8">
								No crops added yet. Click "Add Crop" to get started.
							</p>
						) : (
							<div className="space-y-6">
								{formData.crops?.map((crop, cropIndex) => (
									<Card key={crop.id} className="border-2">
										<CardHeader className="pb-3">
											<div className="flex items-center justify-between">
												<CardTitle className="text-lg">
													Crop {cropIndex + 1}
												</CardTitle>
												<div className="flex items-center gap-2">
													<Badge
														variant={
															crop.status === "Completed"
																? "default"
																: crop.status === "Ongoing"
																	? "secondary"
																	: crop.status === "Aborted"
																		? "destructive"
																		: "outline"
														}
													>
														{crop.status}
													</Badge>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeCrop(crop.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
										</CardHeader>
										<CardContent className="space-y-4">
											{/* Crop Basic Info */}
											<div className="grid md:grid-cols-2 gap-4">
												<div>
													<Label>Crop Name *</Label>
													<Input
														value={crop.name}
														onChange={(e) =>
															updateCrop(crop.id, "name", e.target.value)
														}
														placeholder="Enter crop name"
														required
													/>
												</div>
												<div>
													<Label>Status</Label>
													<Select
														value={crop.status}
														onValueChange={(value) =>
															updateCrop(crop.id, "status", value)
														}
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="Pending">Pending</SelectItem>
															<SelectItem value="Ongoing">Ongoing</SelectItem>
															<SelectItem value="Completed">
																Completed
															</SelectItem>
															<SelectItem value="Aborted">Aborted</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>

											<div>
												<Label>Description</Label>
												<Textarea
													value={crop.description}
													onChange={(e) =>
														updateCrop(crop.id, "description", e.target.value)
													}
													placeholder="Enter crop description"
													rows={2}
												/>
											</div>

											<div className="grid md:grid-cols-2 gap-4">
												<div>
													<Label>Start Date</Label>
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="outline"
																className="w-full justify-start text-left font-normal"
															>
																<CalendarIcon className="mr-2 h-4 w-4" />
																{formatDate(crop.startDate, "PPP")}
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0">
															<Calendar
																mode="single"
																selected={crop.startDate}
																onSelect={(date) =>
																	date && updateCrop(crop.id, "startDate", date)
																}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
												</div>
												<div>
													<Label>End Date</Label>
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="outline"
																className="w-full justify-start text-left font-normal"
															>
																<CalendarIcon className="mr-2 h-4 w-4" />
																{formatDate(crop.endDate, "PPP")}
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0">
															<Calendar
																mode="single"
																selected={crop.endDate}
																onSelect={(date) =>
																	date && updateCrop(crop.id, "endDate", date)
																}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
												</div>
											</div>

											{/* Plantation Steps */}
											<div className="mt-4">
												<div className="flex items-center justify-between mb-3">
													<Label className="text-base font-medium">
														Plantation Steps
													</Label>
												</div>

												{crop.cycle.length === 0 ? (
													<p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded">
														No steps added. Click "Add Step" to create
														plantation steps.
													</p>
												) : (
													<div className="space-y-3">
														{crop.cycle.map((step, stepIndex) => (
															<Card key={step.id} className="border">
																<CardContent className="pt-4">
																	<div className="flex items-center justify-between mb-3">
																		<h5 className="font-medium">
																			Step {stepIndex + 1}
																		</h5>
																		<div className="flex items-center gap-2">
																			<Badge
																				variant="outline"
																				className="text-xs"
																			>
																				{step.status}
																			</Badge>
																			<Button
																				type="button"
																				variant="ghost"
																				size="sm"
																				onClick={() =>
																					removeStep(crop.id, step.id)
																				}
																			>
																				<Trash2 className="h-3 w-3" />
																			</Button>
																		</div>
																	</div>

																	<div className="grid gap-3">
																		<div className="grid md:grid-cols-2 gap-3">
																			<div>
																				<Label className="text-xs">
																					Step Name
																				</Label>
																				<Input
																					value={step.name}
																					onChange={(e) =>
																						updateStep(
																							crop.id,
																							step.id,
																							"name",
																							e.target.value,
																						)
																					}
																					placeholder="Enter step name"
																					className="h-8"
																				/>
																			</div>
																			<div>
																				<Label className="text-xs">
																					Status
																				</Label>
																				<Select
																					value={step.status}
																					onValueChange={(value) =>
																						updateStep(
																							crop.id,
																							step.id,
																							"status",
																							value,
																						)
																					}
																				>
																					<SelectTrigger className="h-8">
																						<SelectValue />
																					</SelectTrigger>
																					<SelectContent>
																						<SelectItem value="Pending">
																							Pending
																						</SelectItem>
																						<SelectItem value="Ongoing">
																							Ongoing
																						</SelectItem>
																						<SelectItem value="Completed">
																							Completed
																						</SelectItem>
																						<SelectItem value="Skipped">
																							Skipped
																						</SelectItem>
																					</SelectContent>
																				</Select>
																			</div>
																		</div>

																		<div>
																			<Label className="text-xs">
																				Description
																			</Label>
																			<Textarea
																				value={step.description}
																				onChange={(e) =>
																					updateStep(
																						crop.id,
																						step.id,
																						"description",
																						e.target.value,
																					)
																				}
																				placeholder="Enter step description"
																				rows={2}
																				className="text-sm"
																			/>
																		</div>

																		<div className="grid md:grid-cols-2 gap-3">
																			<div>
																				<Label className="text-xs">
																					Start Date
																				</Label>
																				<Popover>
																					<PopoverTrigger asChild>
																						<Button
																							variant="outline"
																							className="w-full justify-start text-left font-normal h-8 text-xs"
																						>
																							<CalendarIcon className="mr-1 h-3 w-3" />
																							{formatDate(
																								step.startDate,
																								"PPP",
																							)}
																						</Button>
																					</PopoverTrigger>
																					<PopoverContent className="w-auto p-0">
																						<Calendar
																							mode="single"
																							selected={step.startDate}
																							onSelect={(date) =>
																								date &&
																								updateStep(
																									crop.id,
																									step.id,
																									"startDate",
																									date,
																								)
																							}
																							initialFocus
																						/>
																					</PopoverContent>
																				</Popover>
																			</div>
																			<div>
																				<Label className="text-xs">
																					End Date
																				</Label>
																				<Popover>
																					<PopoverTrigger asChild>
																						<Button
																							variant="outline"
																							className="w-full justify-start text-left font-normal h-8 text-xs"
																						>
																							<CalendarIcon className="mr-1 h-3 w-3" />
																							{formatDate(step.endDate, "PPP")}
																						</Button>
																					</PopoverTrigger>
																					<PopoverContent className="w-auto p-0">
																						<Calendar
																							mode="single"
																							selected={step.endDate}
																							onSelect={(date) =>
																								date &&
																								updateStep(
																									crop.id,
																									step.id,
																									"endDate",
																									date,
																								)
																							}
																							initialFocus
																						/>
																					</PopoverContent>
																				</Popover>
																			</div>
																		</div>
																	</div>
																</CardContent>
															</Card>
														))}
													</div>
												)}

												<Button
													type="button"
													variant="default"
													size="sm"
													onClick={() => addStepToCrop(crop.id)}
													className="w-full mt-4"
												>
													<PlusCircle className="h-3 w-3" />
													Add Step
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
						<Button
							type="button"
							variant="default"
							size="sm"
							onClick={addCrop}
							className="w-full mt-2"
						>
							<Plus className="h-4 w-4" />
							Add Crop
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);

	return (
		<AppLayout
			title="Plantation Flows"
			subtitle="Create and manage your plantation cycles and crops"
			showBackButton={currentScreen !== "list"}
		>
			<div className="max-w-4xl container mx-auto p-6">
				{(() => {
					switch (currentScreen) {
						case "list":
							return renderListScreen();
						case "view":
							return renderViewScreen();
						case "add":
						case "edit":
							return renderFormScreen();
						default:
							return <div>Invalid screen state</div>;
					}
				})()}
			</div>
		</AppLayout>
	);
}

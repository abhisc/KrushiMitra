import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle, Clock, AlertCircle, XCircle } from "lucide-react";
import { cn } from "@/utils/utils";

export interface TimelineItem {
	id: string;
	title: string;
	description?: string;
	status: "Pending" | "Ongoing" | "Completed" | "Skipped" | "Aborted";
	startDate: Date;
	endDate: Date;
	isActive?: boolean;
	timeProgress?: number; // Percentage of time elapsed
}

interface TimelineProps {
	items: TimelineItem[];
	orientation?: "vertical" | "horizontal";
	showDates?: boolean;
	className?: string;
}

const statusConfig = {
	Pending: {
		icon: Circle,
		color: "text-gray-400",
		bgColor: "bg-gray-100",
		badgeVariant: "outline" as const,
	},
	Ongoing: {
		icon: Clock,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
		badgeVariant: "secondary" as const,
	},
	Completed: {
		icon: CheckCircle,
		color: "text-green-600",
		bgColor: "bg-green-100",
		badgeVariant: "default" as const,
	},
	Skipped: {
		icon: AlertCircle,
		color: "text-yellow-600",
		bgColor: "bg-yellow-100",
		badgeVariant: "outline" as const,
	},
	Aborted: {
		icon: XCircle,
		color: "text-red-600",
		bgColor: "bg-red-100",
		badgeVariant: "destructive" as const,
	},
};

export function Timeline({
	items,
	orientation = "vertical",
	showDates = true,
	className,
}: TimelineProps) {
	const formatDate = (newDate: any) => {
		const dater = newDate?.toDate ? newDate.toDate() : newDate;
		return new Date(dater).toLocaleDateString();
	};

	// Calculate time progress for each item if not provided
	const itemsWithProgress = items.map((item) => {
		console.log(item?.startDate);
		const start = item?.startDate?.toDate
			? item?.startDate?.toDate()
			: new Date(item?.startDate);
		const end = item?.endDate?.toDate
			? item?.endDate?.toDate()
			: new Date(item?.endDate);

		const now = new Date();
		console.log(12, item.startDate, start, end);

		// Calculate time progress percentage
		let progress = 0;
		const totalDuration = end.getTime() - start.getTime();

		if (totalDuration <= 0) return { ...item, timeProgress: 100 };

		if (now < start) {
			progress = 0;
		} else if (now > end) {
			progress = 100;
		} else {
			const elapsed = now.getTime() - start.getTime();
			progress = Math.round((elapsed / totalDuration) * 100);
		}

		return { ...item, timeProgress: progress };
	});

	if (orientation === "horizontal") {
		return (
			<div className={cn("w-full", className)}>
				<div className="flex items-center justify-between mb-4">
					{itemsWithProgress.map((item, index) => {
						const config = statusConfig[item.status];
						const Icon = config.icon;
						const isLast = index === itemsWithProgress.length - 1;

						return (
							<div key={item.id} className="flex items-center flex-1">
								<div className="flex flex-col items-center">
									<div
										className={cn(
											"w-10 h-10 rounded-full flex items-center justify-center border-2",
											config.bgColor,
											item.isActive ? "ring-2 ring-blue-500 ring-offset-2" : "",
											config.color,
										)}
									>
										<Icon className="w-5 h-5" />
									</div>
									<div className="mt-2 text-center">
										<p className="text-sm font-medium">{item.title}</p>
										<Badge
											variant={config.badgeVariant}
											className="mt-1 text-xs"
										>
											{item.status}
										</Badge>
										{showDates && (
											<div className="mt-1 text-xs text-muted-foreground">
												<div>{formatDate(item.startDate)}</div>
												<div>to {formatDate(item.endDate)}</div>
											</div>
										)}
										{item.timeProgress !== undefined && (
											<div className="mt-2 w-full">
												<div className="w-16 bg-gray-200 rounded-full h-1 mx-auto">
													<div
														className={cn(
															"h-1 rounded-full transition-all duration-300",
															item.status === "Completed"
																? "bg-green-500"
																: item.status === "Ongoing"
																	? "bg-blue-500"
																	: item.status === "Aborted"
																		? "bg-red-500"
																		: "bg-gray-400",
														)}
														style={{ width: `${item.timeProgress}%` }}
													/>
												</div>
												<span className="text-xs text-muted-foreground">
													{item.timeProgress}%
												</span>
											</div>
										)}
									</div>
								</div>
								{!isLast && (
									<div className="flex-1 h-0.5 bg-gray-200 mx-4 mt-5" />
								)}
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	return (
		<div className={cn("space-y-4", className)}>
			{itemsWithProgress.map((item, index) => {
				const config = statusConfig[item.status];
				const Icon = config.icon;
				const isLast = index === itemsWithProgress.length - 1;

				return (
					<div key={item.id} className="flex items-start space-x-4">
						<div className="flex flex-col items-center">
							<div
								className={cn(
									"w-8 h-8 rounded-full flex items-center justify-center border-2",
									config.bgColor,
									item.isActive ? "ring-2 ring-blue-500 ring-offset-2" : "",
									config.color,
								)}
							>
								<Icon className="w-4 h-4" />
							</div>
							{!isLast && <div className="w-0.5 h-8 bg-gray-200 mt-2" />}
						</div>

						<Card
							className={cn(
								"flex-1",
								item.isActive ? "border-blue-500 shadow-md" : "",
							)}
						>
							<CardContent className="p-4">
								<div className="flex items-center justify-between mb-2">
									<h4 className="font-medium">{item.title}</h4>
									<Badge variant={config.badgeVariant}>{item.status}</Badge>
								</div>

								{item.description && (
									<p className="text-sm text-muted-foreground mb-2">
										{item.description}
									</p>
								)}

								{showDates && (
									<div className="text-xs text-muted-foreground mb-2">
										<span>
											{formatDate(item.startDate)} - {formatDate(item.endDate)}
										</span>
									</div>
								)}

								{item.timeProgress !== undefined && (
									<div>
										<div className="flex items-center justify-between mb-1">
											<span className="text-xs text-muted-foreground">
												Time Progress
											</span>
											<span className="text-xs font-medium">
												{item.timeProgress}%
											</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2">
											<div
												className={cn(
													"h-2 rounded-full transition-all duration-300",
													item.status === "Completed"
														? "bg-green-500"
														: item.status === "Ongoing"
															? "bg-blue-500"
															: item.status === "Aborted"
																? "bg-red-500"
																: "bg-gray-400",
												)}
												style={{ width: `${item.timeProgress}%` }}
											/>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				);
			})}
		</div>
	);
}

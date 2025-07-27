// src/components/plantation/Timeline.tsx
import { cn } from "@/utils/utils";
import { format } from "date-fns";
import { CalendarIcon, Leaf } from "lucide-react";

interface TimelineProps {
	startDate: Date;
	endDate: Date;
	currentLabel?: string;
	events?: Array<{
		id: string;
		date: Date;
		label: string;
		status: "Pending" | "Ongoing" | "Completed" | "Skipped" | "Aborted";
	}>;
	className?: string;
}

export function Timeline({
	startDate,
	endDate,
	events = [],
	currentLabel = "Today",
	className,
}: TimelineProps) {
	// Convert dates if they're Firestore Timestamps
	const start = startDate?.toDate?.() || startDate;
	const end = endDate?.toDate?.() || endDate;
	const now = new Date();

	// Calculate total duration in days
	const totalDuration = Math.max(
		1,
		Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
	);

	// Calculate progress percentage
	const elapsed = Math.max(
		0,
		Math.min(
			totalDuration,
			Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
		),
	);
	const progressPercent = Math.min(
		100,
		Math.max(0, (elapsed / totalDuration) * 100),
	);

	// Process events to have percentage positions
	const timelineEvents = events.map((event) => {
		const eventDate = event.date?.toDate?.() || event.date;
		const eventPosition = Math.min(
			100,
			Math.max(
				0,
				((eventDate.getTime() - start.getTime()) /
					(end.getTime() - start.getTime())) *
					100,
			),
		);
		return { ...event, position: eventPosition };
	});

	return (
		<div className={cn("relative pt-6 pb-10", className)}>
			{/* Date labels */}
			<div className="flex justify-between text-xs text-muted-foreground mb-2">
				<div className="flex items-center">
					<CalendarIcon className="h-3 w-3 mr-1" />
					{format(start, "MMM dd, yyyy")}
				</div>
				<div className="flex items-center">
					<CalendarIcon className="h-3 w-3 mr-1" />
					{format(end, "MMM dd, yyyy")}
				</div>
			</div>

			{/* Timeline bar */}
			<div className="h-2 bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-primary rounded-full"
					style={{ width: `${progressPercent}%` }}
				/>
			</div>

			{/* Today marker */}
			{progressPercent > 0 && progressPercent < 100 && (
				<div
					className="absolute top-0 flex flex-col items-center"
					style={{ left: `calc(${progressPercent}% - 8px)` }}
				>
					<div className="h-4 w-4 rounded-full bg-primary"></div>
					<span className="text-xs font-medium mt-1">{currentLabel}</span>
				</div>
			)}

			{/* Event markers */}
			{timelineEvents.map((event) => (
				<div
					key={event.id}
					className="absolute bottom-0 flex flex-col items-center"
					style={{ left: `calc(${event.position}% - 8px)` }}
				>
					<span className="text-xs mb-1">{event.label}</span>
					<div
						className={cn(
							"h-4 w-4 rounded-full",
							event.status === "Completed"
								? "bg-green-500"
								: event.status === "Ongoing"
									? "bg-blue-500"
									: event.status === "Skipped"
										? "bg-yellow-500"
										: event.status === "Aborted"
											? "bg-red-500"
											: "bg-gray-400",
						)}
					>
						<Leaf className="h-3 w-3 text-white" />
					</div>
				</div>
			))}
		</div>
	);
}

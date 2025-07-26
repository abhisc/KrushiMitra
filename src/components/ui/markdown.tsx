import { Bot } from "lucide-react";
import Markdown from "react-markdown";

export const MarkdownComponent = ({
	text,
	css = "",
}: {
	text: string;
	css?: string;
}) => {
	return (
		<div className={`max-w-full ${css}`}>
			<div className="bg-primary/5 rounded-xl p-6 border-l-4 border-primary">
				<div className="flex items-start">
					<Bot className="w-6 h-6 text-primary mr-3 mt-1 flex-shrink-0" />
					<div className="flex-1">
						<h4 className="font-semibold text-primary mb-2">
							KrushiMitra's Response:
						</h4>
						<p className="text-foreground">
							<Markdown
								children={text}
								components={{
									p: ({ children }) => <span className="py-2">{children}</span>,
									li: ({ children }) => (
										<li className="list-disc text-sm pb-2">{children}</li>
									),
									a: ({ node, ...props }) => (
										<a {...props} className="text-primary hover:underline" />
									),
								}}
							/>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

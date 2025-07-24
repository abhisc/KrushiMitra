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
			<div className="bg-green-50 rounded-xl p-6 border-l-4 border-green-500">
				<div className="flex items-start">
					<Bot className="w-6 h-6 text-green-600 mr-3 mt-1 flex-shrink-0" />
					<div className="flex-1">
						<h4 className="font-semibold text-green-800 mb-2">
							KrushiMitra's Response:
						</h4>
						<p className="text-gray-700">
							<Markdown
								children={text}
								components={{
									p: ({ children }) => <p className="py-2">{children}</p>,
									li: ({ children }) => (
										<li className="list-disc text-sm pb-2">{children}</li>
									),
									a: ({ node, ...props }) => (
										<a {...props} className="text-blue-600 hover:underline" />
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

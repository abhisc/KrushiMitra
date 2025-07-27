"use client";

import {
	Send,
	Mic,
	Bot,
	User,
	Clock,
	ChevronDown,
	Loader2,
	Trash2,
	AlertCircle,
	MicOff,
} from "lucide-react";
import { useState, useEffect, FormEvent, useRef } from "react";
import Markdown from "react-markdown";

interface Message {
	role: "user" | "model";
	content: [{ text: string }];
	timestamp?: Date;
}

interface ChatBoxProps {
	onSendMessage: (message: string) => Promise<void>;
	onClearChat?: () => void;
	loading: boolean;
	messages: Message[];
	title?: string;
	subtitle?: string;
	initialMessage?: string;
	className?: string;
}

export function ChatBox({
	onSendMessage,
	onClearChat,
	loading,
	messages,
	title = "Talk to KrushiMitra",
	subtitle = "Get instant answers, advice, and support for your farming needs.",
	initialMessage = "",
	className = "",
}: ChatBoxProps) {
	const [userInput, setUserInput] = useState(initialMessage);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef<any>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSubmit = async (e?: FormEvent) => {
		e?.preventDefault();
		if (!userInput.trim() || loading) return;

		setUserInput("");
		await onSendMessage(userInput);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleClearChat = () => {
		if (onClearChat) {
			onClearChat();
			setShowClearConfirm(false);
		}
	};

	// Speech-to-text handler
	const handleMicClick = () => {
		if (listening) {
			recognitionRef.current?.stop();
			setListening(false);
			return;
		}

		const SpeechRecognition =
			(window as any).SpeechRecognition ||
			(window as any).webkitSpeechRecognition;
		if (!SpeechRecognition) {
			alert("Speech recognition is not supported in this browser.");
			return;
		}

		const recognition = new SpeechRecognition();
		recognition.lang = "en-US";
		recognition.interimResults = false;
		recognition.maxAlternatives = 1;
		recognition.continuous = false;

		recognition.onresult = (event: any) => {
			const transcript = event.results[0][0].transcript;
			setUserInput((prev) => (prev ? prev + " " + transcript : transcript));
			setListening(false);
		};

		recognition.onerror = (event: any) => {
			console.error("Speech recognition error:", event.error);
			setListening(false);
		};

		recognition.onend = () => {
			setListening(false);
		};

		recognitionRef.current = recognition;
		setListening(true);
		recognition.start();
	};

	// Clean up recognition on unmount
	useEffect(() => {
		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
		};
	}, []);

	return (
		<div
			className={`bg-card rounded-2xl shadow-xl p-3 sm:p-5 md:p-6 border border-border transition-all duration-300 hover:shadow-2xl flex flex-col h-full ${className}`}
		>
			{!messages.length && (
				<>
					<div className="flex items-center justify-center mb-4 bg-primary/5 py-2 rounded-xl flex-shrink-0">
						<Bot className="w-7 h-7 text-primary mr-2" />
						<span className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
							{title}
						</span>
					</div>

					<p className="text-muted-foreground text-center mb-4 text-sm flex-shrink-0">
						{subtitle}
					</p>
				</>
			)}

			{messages.length > 0 ? (
				<div className="relative mb-4 flex-1 min-h-0">
					<div className="h-full overflow-y-auto border border-border rounded-xl p-3 custom-scrollbar shadow-inner">
						{messages.map((message, index) => (
							<div
								key={index}
								className={`mb-3 p-2.5 rounded-lg animate-fadeIn ${
									message.role === "user"
										? "bg-primary/10 ml-auto mr-2 max-w-[75%] sm:max-w-[65%]"
										: "bg-muted mr-auto ml-2 max-w-[75%] sm:max-w-[65%]"
								}`}
							>
								<div className="text-xs font-medium mb-1.5 flex items-center">
									{message.role === "user" ? (
										<>
											<User className="w-3.5 h-3.5 mr-1 text-primary" />{" "}
											<span>You</span>
										</>
									) : (
										<>
											<Bot className="w-3.5 h-3.5 mr-1 text-primary" />{" "}
											<span>KrushiMitra</span>
										</>
									)}
								</div>
								<div className="text-sm">
									<Markdown
										children={message.content[0].text}
										components={{
											p: ({ children }) => <p className="mb-2">{children}</p>,
											li: ({ children }) => (
												<li className="ml-4 list-disc text-sm pb-2">
													{children}
												</li>
											),
											a: ({ node, ...props }) => (
												<a
													{...props}
													className="text-primary hover:underline"
													target="_blank"
													rel="noopener noreferrer"
												/>
											),
										}}
									/>
								</div>
								{message.timestamp && (
									<div className="text-xs text-muted-foreground mt-1.5 text-right flex items-center justify-end">
										<Clock className="w-3 h-3 mr-1 opacity-70" />
										{new Date(message.timestamp).toLocaleTimeString()}
									</div>
								)}
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>

					{/* Clear Chat Button */}
					<button
						onClick={() => setShowClearConfirm(true)}
						className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive bg-background/80 hover:bg-destructive/10 rounded-full transition-colors"
						title="Clear chat history"
					>
						<Trash2 className="w-3.5 h-3.5" />
					</button>

					{/* Confirmation Dialog */}
					{showClearConfirm && (
						<div className="absolute top-0 left-0 w-full h-full bg-background/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
							<div className="bg-card p-4 rounded-xl shadow-lg border border-border max-w-[80%]">
								<div className="flex items-center text-destructive mb-3">
									<AlertCircle className="w-5 h-5 mr-2" />
									<h3 className="font-medium">Clear chat history?</h3>
								</div>
								<p className="text-sm text-muted-foreground mb-4">
									This will delete all messages in this conversation.
								</p>
								<div className="flex justify-end gap-3">
									<button
										onClick={() => setShowClearConfirm(false)}
										className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={handleClearChat}
										className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
									>
										Clear chat
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			) : (
				<div className="mb-4 p-6 border border-dashed border-border rounded-xl text-center text-muted-foreground flex flex-col items-center justify-center flex-1">
					<Bot className="w-12 h-12 mb-3 text-muted-foreground/50" />
					<p>Start a conversation with KrushiMitra</p>
					<ChevronDown className="w-5 h-5 mt-2 animate-bounce" />
				</div>
			)}

			<form onSubmit={handleSubmit} className="mx-[25w] flex-shrink-0">
				<div className="relative">
					<textarea
						rows={2}
						value={userInput}
						onChange={(e) => setUserInput(e.target.value)}
						onKeyDown={handleKeyDown}
						className={`w-full bg-background text-foreground border-2 border-border rounded-lg px-4 py-2 text-sm pr-20 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none transition-all duration-200 shadow-sm focus:shadow-md ${
							listening ? "ring-2 ring-primary/30 border-primary" : ""
						}`}
						placeholder={
							listening
								? "Listening..."
								: "Ask me anything about farming - crop diseases, market prices, weather, subsidies..."
						}
						style={
							listening ? { color: "rgb(var(--primary))", fontWeight: 600 } : {}
						}
					/>

					{/* Action buttons positioned inside the textarea */}
					<div className="absolute right-2 bottom-2 flex gap-2">
						<button
							type="button"
							onClick={handleMicClick}
							disabled={loading}
							className={`disabled:opacity-45 flex items-center justify-center p-2 bg-muted hover:bg-accent text-primary rounded-md transition-all duration-200 hover:shadow-md ${
								listening
									? "bg-primary text-primary-foreground animate-pulse"
									: "bg-muted hover:bg-accent text-primary"
							}`}
							title={listening ? "Stop listening" : "Voice input"}
						>
							{listening ? (
								<MicOff className="w-4 h-4" />
							) : (
								<Mic className="w-4 h-4" />
							)}
						</button>
						<button
							type="submit"
							disabled={loading || !userInput.trim()}
							className="disabled:opacity-45 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground p-2 rounded-md transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center hover:translate-y-[-1px] active:translate-y-[1px]"
							title="Send message"
						>
							{loading ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Send className="w-4 h-4" />
							)}
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}

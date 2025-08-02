"use client";

import {
	AlertCircle,
	Bot,
	ChevronDown,
	Clock,
	Loader2,
	Mic,
	Send,
	Trash2,
	User,
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
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
	const [focus, setFocus] = useState(true);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const [showClearConfirm, setShowClearConfirm] = useState(false);
	
	// For microphone functionality
	const [listening, setListening] = useState(false);
	const recognitionRef = useRef<any>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	// Speech-to-text handler
	const handleMicClick = () => {
		if (listening) {
			recognitionRef.current?.stop();
			setListening(false);
			return;
		}
		
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
			setUserInput(prev => prev ? prev + ' ' + transcript : transcript);
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
		
		try {
			recognition.start();
		} catch (error) {
			console.error("Failed to start speech recognition:", error);
			setListening(false);
		}
	};

	const handleSubmit = async (e?: FormEvent) => {
		e?.preventDefault();
		if (!userInput.trim() || loading) return;
		setFocus(true);
		setUserInput("");
		await onSendMessage(userInput);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

			{/* Modern Input Bar */}
			<form onSubmit={handleSubmit} className="flex-shrink-0">
				<div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-lg px-4 py-2 border border-gray-200 dark:border-gray-600 focus-within:ring-2 focus-within:ring-green-200 dark:focus-within:ring-green-600 relative transition-all duration-300">
					<input
						type="text"
						autoFocus={focus}
						value={userInput}
						onChange={e => setUserInput(e.target.value)}
						placeholder={listening ? "Listening..." : "E.g. Check price of tomato, My wheat crop looks yellow, Show fertilizer subsidies..."}
						disabled={loading}
						className="flex-1 border-none shadow-none bg-transparent focus:ring-0 focus:outline-none text-base min-w-0 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
						style={listening ? { color: '#4F46E5', fontWeight: 600 } : {}}
						onKeyDown={handleKeyDown}
					/>
					{loading ? (
						<div className="flex items-center justify-center w-10 h-10">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-gray-100"></div>
						</div>
					) : userInput ? (
						<button 
							type="submit"
							className="flex items-center justify-center bg-[#4F46E5] hover:bg-[#3730A3] rounded-full w-10 h-10 transition-colors focus:outline-none shadow" 
							title="Send"
						>
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2} className="h-6 w-6">
								<path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8m0 0l-4-4m4 4l-4 4" />
							</svg>
						</button>
					) : (
						<button
							type="button"
							onClick={handleMicClick}
							className={`flex items-center justify-center rounded-full w-10 h-10 transition-colors focus:outline-none shadow relative ${listening ? 'bg-[#4F46E5] animate-pulse' : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'}`}
							title="Voice input"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className={`h-6 w-6 transition-all duration-200 ${listening ? 'text-white' : 'text-[#4F46E5] dark:text-indigo-400'}`}
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
								strokeWidth={2}
							>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 18v2m0 0a4 4 0 01-4-4h0a4 4 0 018 0h0a4 4 0 01-4 4zm0-6v2m0-2a4 4 0 00-4 4h0a4 4 0 008 0h0a4 4 0 00-4-4zm0 0V6a4 4 0 00-8 0v6a4 4 0 008 0z" />
							</svg>
						</button>
					)}
				</div>
			</form>
		</div>
	);
}

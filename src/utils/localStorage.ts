export const storageKeys = {
	RECENT_INPUTS: "krushi_mitra_recent_inputs",
};

const MAX_INPUTS = 5;

export function storeRecentInput(input: string): void {
	if (typeof window === "undefined") return; // Server-side guard

	try {
		const existingInputs = getRecentInputs();

		// Remove the input if it already exists to avoid duplicates
		const filteredInputs = existingInputs.filter((item) => item !== input);

		// Add the new input at the beginning
		const updatedInputs = [input, ...filteredInputs];

		// Keep only the last 5 inputs
		const limitedInputs = updatedInputs.slice(0, MAX_INPUTS);

		localStorage.setItem(
			storageKeys.RECENT_INPUTS,
			JSON.stringify(limitedInputs),
		);
	} catch (error) {
		console.warn("Failed to store recent input:", error);
	}
}

export function getRecentInputs(): string[] {
	if (typeof window === "undefined") return []; // Server-side guard

	try {
		const stored = localStorage.getItem(storageKeys.RECENT_INPUTS);
		return stored ? JSON.parse(stored) : [];
	} catch (error) {
		console.warn("Failed to retrieve recent inputs:", error);
		return [];
	}
}

export function getFromLocalStorage(key: string): string | null {
	if (typeof window === "undefined") return null; // Server-side guard

	try {
		return localStorage.getItem(key);
	} catch (error) {
		console.warn(`Failed to retrieve item with key "${key}":`, error);
		return null;
	}
}

export function setToLocalStorage(key: string, value: string): void {
	if (typeof window === "undefined") return; // Server-side guard

	try {
		localStorage.setItem(key, value);
	} catch (error) {
		console.warn(`Failed to store item with key "${key}":`, error);
	}
}

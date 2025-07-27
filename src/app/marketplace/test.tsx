"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMarketplaceSearch } from "@/ai/flows/farming-marketplace";

export default function MarketplaceTest() {
	const [result, setResult] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	const testSearch = async () => {
		setLoading(true);
		try {
			const searchResult = await getMarketplaceSearch({
				productType: "tractor",
				productName: "Mahindra",
				location: "Maharashtra",
				budget: "₹5,00,000 - ₹7,00,000",
				requirements: "govt certified, delivery available",
			});
			setResult(searchResult);
		} catch (error) {
			console.error("Test failed:", error);
			setResult({ error: error instanceof Error ? error.message : "Unknown error" });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-4 max-w-4xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle>Marketplace Test</CardTitle>
				</CardHeader>
				<CardContent>
					<Button onClick={testSearch} disabled={loading}>
						{loading ? "Testing..." : "Test Marketplace Search"}
					</Button>
					
					{result && (
						<div className="mt-4">
							<h3 className="font-semibold mb-2">Test Result:</h3>
							<pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
								{JSON.stringify(result, null, 2)}
							</pre>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
} 
import { config } from "dotenv";
config();

import "@/ai/flows/diagnose-crop-disease.ts";
import "@/ai/tools/government-scheme-information.ts";
import "@/ai/flows/weather-and-irrigation-tips.ts";
import "@/ai/flows/real-time-market-analysis.ts";
import "@/ai/flows/ask-anything.ts";
import "@/ai/flows/smart-diagnose.ts";
import "@/ai/flows/farmer-schemes-chat.ts";
import "@/ai/flows/farm-journal-extract.ts";
import "@/ai/flows/marketplace-chat.ts";
import "@/ai/flows/farming-marketplace.ts";
import "@/ai/tools/GovtApisTools.ts";
import "@/ai/tools/marketplace-tool.ts";
import "@/ai/tools/weather-tool.ts";

'use server'

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskAnythingInput = z.object({
    text:  z.string(),
    photoDataUri: z.string().optional(),
});

const AskAnythingOutput =  z.object({
    response:  z.string()
});

export const askAnything = ai.definePrompt({
    name: 'askAnythingPrompt',
    input: {schema: AskAnythingInput},
    output: {schema: AskAnythingOutput},
    prompt: `You are an AI assistant providing information to farmers of India. 
 
You will provide solutions related to farmering.

You will empathise on then when they address a problem.

You will be brief about the solution.

{{#if photoDataUri}}
Here is an image: {{photoDataUri}}
{{/if}}

{{text}}
`,
  });

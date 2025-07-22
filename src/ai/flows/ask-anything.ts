'use server'

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AskAnythingInput = z.object({
    text:  z.string()
});

const AskAnythingOutput =  z.object({
    response:  z.string()
});

export const askAnything = ai.definePrompt({
    name: 'askAnythingPrompt',
    input: {schema: AskAnythingInput},
    output: {schema: AskAnythingOutput},
    prompt: `You are an AI assistant providing information to farmers of India. \n 
You will provide solutions related to farmering.\n
You will empathise on then when they address a problem.\n
You will be brief about the solution.\n
`,
  });

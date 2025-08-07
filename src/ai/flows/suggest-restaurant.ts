// This file contains the Genkit flow for suggesting a restaurant from a user-provided list, considering if the restaurants are open.

'use server';

/**
 * @fileOverview A restaurant suggestion AI agent.
 *
 * - suggestRestaurant - A function that suggests a restaurant from a list.
 * - SuggestRestaurantInput - The input type for the suggestRestaurant function.
 * - SuggestRestaurantOutput - The return type for the suggestRestaurant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRestaurantInputSchema = z.object({
  restaurants: z
    .array(z.string())
    .describe('A list of restaurants to choose from.'),
});
export type SuggestRestaurantInput = z.infer<typeof SuggestRestaurantInputSchema>;

const SuggestRestaurantOutputSchema = z.object({
  suggestedRestaurant: z.string().describe('The randomly selected restaurant from the list.'),
});
export type SuggestRestaurantOutput = z.infer<typeof SuggestRestaurantOutputSchema>;

const suggestRestaurantPrompt = ai.definePrompt({
  name: 'suggestRestaurantPrompt',
  input: {schema: SuggestRestaurantInputSchema},
  output: {schema: SuggestRestaurantOutputSchema},
  prompt: `Given the following list of restaurants:

  {{#each restaurants}}- {{this}}\n{{/each}}

  Suggest a single restaurant from the list. Assume that all restaurants are open.
  Return ONLY the name of the restaurant.`, // Removed extra spaces here
});

const suggestRestaurantFlow = ai.defineFlow(
  {
    name: 'suggestRestaurantFlow',
    inputSchema: SuggestRestaurantInputSchema,
    outputSchema: SuggestRestaurantOutputSchema,
  },
  async input => {
    const {output} = await suggestRestaurantPrompt(input);
    return output!;
  }
);

export async function suggestRestaurant(input: SuggestRestaurantInput): Promise<SuggestRestaurantOutput> {
  return suggestRestaurantFlow(input);
}

import type { HarmBlockThreshold, HarmCategory } from '@google/genai';
import type { INodeProperties } from 'n8n-workflow';

import { harmCategories, harmThresholds } from './safety-options';

export const additionalOptions: INodeProperties = {
	displayName: 'Options',
	name: 'options',
	placeholder: 'Add Option',
	description: 'Additional options to add',
	type: 'collection',
	default: {},
	// eslint-disable-next-line n8n-nodes-base/node-param-collection-type-unsorted-items
	options: [
		// // --- MODIFIED: Added Proxy URL parameter ---
		// {
		// 	displayName: 'Proxy URL',
		// 	name: 'proxy',
		// 	type: 'string',
		// 	default: '',
		// 	placeholder: 'http://user:pass@host:port',
		// 	description: 'Optional HTTP/HTTPS proxy to use for the API request',
		// },
		{
			displayName: 'Maximum Number of Tokens',
			name: 'maxOutputTokens',
			default: 2048,
			description: 'The maximum number of tokens to generate in the completion',
			type: 'number',
		},
		{
			displayName: 'Sampling Temperature',
			name: 'temperature',
			default: 0.4,
			typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
			description:
				'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
			type: 'number',
		},
		{
			displayName: 'Top K',
			name: 'topK',
			default: 32,
			typeOptions: { maxValue: 40, minValue: -1, numberPrecision: 1 },
			description:
				'Used to remove "long tail" low probability responses. Defaults to -1, which disables it.',
			type: 'number',
		},
		{
			displayName: 'Top P',
			name: 'topP',
			default: 1,
			typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
			description:
				'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
			type: 'number',
		},

		// Safety Settings
		{
			displayName: 'Safety Settings',
			name: 'safetySettings',
			type: 'fixedCollection',
			typeOptions: { multipleValues: true },
			default: {
				values: {
					category: harmCategories[0].name as HarmCategory,
					threshold: harmThresholds[0].name as HarmBlockThreshold,
				},
			},
			placeholder: 'Add Option',
			options: [
				{
					name: 'values',
					displayName: 'Values',
					values: [
						{
							displayName: 'Safety Category',
							name: 'category',
							type: 'options',
							description: 'The category of harmful content to block',
							default: 'HARM_CATEGORY_UNSPECIFIED',
							options: harmCategories,
						},
						{
							displayName: 'Safety Threshold',
							name: 'threshold',
							type: 'options',
							description: 'The threshold of harmful content to block',
							default: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
							options: harmThresholds,
						},
					],
				},
			],
		},
	],
};

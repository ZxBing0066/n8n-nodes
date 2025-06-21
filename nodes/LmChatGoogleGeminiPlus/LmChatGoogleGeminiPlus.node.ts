/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import { GoogleGenAI, SafetySetting } from '@google/genai';
import { NodeConnectionType } from 'n8n-workflow';
import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';

import { getConnectionHintNoticeField } from '../../utils/sharedFields';

import { additionalOptions } from '../gemini-common/additional-options';

export class LmChatGoogleGeminiPlus implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Gemini Chat Model Plus',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmChatGoogleGeminiPlus',
		icon: 'file:google.svg',
		group: ['transform'],
		version: 1,
		description: 'Chat Model Google Gemini',
		defaults: {
			name: 'Google Gemini Chat Model',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models', 'Root Nodes'],
				'Language Models': ['Chat Models (Recommended)'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/ZxBing0066/n8n-nodes/tree/master/nodes/LmChatGoogleGeminiPlus/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'googlePalmApi',
				required: true,
			},
		],
		requestDefaults: {
			ignoreHttpStatusErrors: true,
			baseURL: '={{ $credentials.host }}',
		},
		properties: [
			getConnectionHintNoticeField([NodeConnectionType.AiChain, NodeConnectionType.AiAgent]),
			{
				displayName: 'Model',
				name: 'modelName',
				type: 'options',
				description:
					'The model which will generate the completion. <a href="https://developers.generativeai.google/api/rest/generativelanguage/models/list">Learn more</a>.',
				typeOptions: {
					loadOptions: {
						routing: {
							request: {
								method: 'GET',
								url: '/v1beta/models',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'models',
										},
									},
									{
										type: 'filter',
										properties: {
											pass: "={{ !$responseItem.name.includes('embedding') }}",
										},
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.name}}',
											value: '={{$responseItem.name}}',
											description: '={{$responseItem.description}}',
										},
									},
									{
										type: 'sort',
										properties: {
											key: 'name',
										},
									},
								],
							},
						},
					},
				},
				routing: {
					send: {
						type: 'body',
						property: 'model',
					},
				},
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: 'models/gemini-1.0-pro',
			},
			{
				displayName: 'Enable Google Search',
				name: 'enableSearch',
				type: 'boolean',
				default: false,
				description: 'Whether to enable Google Search capability',
			},
			additionalOptions,
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('googlePalmApi');

		const modelName = this.getNodeParameter('modelName', itemIndex) as string;
		const enableSearch = this.getNodeParameter('enableSearch', itemIndex, false) as boolean;
		const options = this.getNodeParameter('options', itemIndex, {
			maxOutputTokens: 1024,
			temperature: 0.7,
			topK: 40,
			topP: 0.9,
		}) as {
			maxOutputTokens: number;
			temperature: number;
			topK: number;
			topP: number;
		};

		const safetySettings = this.getNodeParameter(
			'options.safetySettings.values',
			itemIndex,
			null,
		) as SafetySetting[];

		const genAI = new GoogleGenAI({
			apiKey: credentials.apiKey as string,
		});

		const model = {
			async call(input: string) {
				const response = await genAI.models.generateContent({
					model: modelName.replace('models/', ''),
					contents: [input],
					config: {
						maxOutputTokens: options.maxOutputTokens,
						temperature: options.temperature,
						topK: options.topK,
						topP: options.topP,
						safetySettings,
						tools: enableSearch ? [{ googleSearch: {} }] : undefined,
					},
				});

				return response.text || '';
			},
		};

		return {
			response: model,
		};
	}
}

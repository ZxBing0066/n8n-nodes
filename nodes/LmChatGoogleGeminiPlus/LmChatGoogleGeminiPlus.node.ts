import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SafetySetting } from '@google/genai'; // Keep for type safety
import { NodeConnectionType } from 'n8n-workflow';
import type {
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
} from 'n8n-workflow';

import { additionalOptions } from '../gemini-common/additional-options';
import { getConnectionHintNoticeField } from '../../utils/sharedFields';
import { createLogger } from '../../utils/logger';

const name = 'lmChatGoogleGeminiPlus';

export class LmChatGoogleGeminiPlus implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Google Gemini Chat Model Plus',
		name,
		icon: 'file:google.svg',
		group: ['transform'],
		version: 1,
		description: 'Chat Model Google Gemini Plus with Google Search and Proxy Support',
		defaults: {
			name: 'Google Gemini Chat Model Plus',
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
		inputs: [],
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
									{ type: 'rootProperty', properties: { property: 'models' } },
									{
										type: 'filter',
										properties: { pass: "={{ !$responseItem.name.includes('embedding') }}" },
									},
									{
										type: 'setKeyValue',
										properties: {
											name: '={{$responseItem.name}}',
											value: '={{$responseItem.name}}',
											description: '={{$responseItem.description}}',
										},
									},
									{ type: 'sort', properties: { key: 'name' } },
								],
							},
						},
					},
				},
				routing: { send: { type: 'body', property: 'model' } },
				// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-options
				default: 'models/gemini-1.0-pro',
			},
			{
				displayName: 'Enable Google Search',
				name: 'enableSearch',
				type: 'boolean',
				default: false,
				description:
					"Whether to enable Google Search capability. This uses the Gemini API's built-in search tool.",
			},
			{
				displayName: 'Debug Mode',
				name: 'debugMode',
				type: 'boolean',
				default: false,
				description: 'Whether to enable debug mode for additional logging in the terminal',
			},
			additionalOptions,
		],
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		const credentials = await this.getCredentials('googlePalmApi');
		const apiKey = credentials.apiKey as string;

		const modelName = this.getNodeParameter('modelName', itemIndex) as string;
		const enableSearch = this.getNodeParameter('enableSearch', itemIndex, false) as boolean;
		const debugMode = this.getNodeParameter('debugMode', itemIndex, false) as boolean;
		const options = this.getNodeParameter('options', itemIndex, {
			maxOutputTokens: 2048,
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

		const logger = createLogger(name, debugMode);

		// This is the function that will be returned and called by n8n chains.
		// It encapsulates the entire API call logic.
		const model = async (messages: any, ...args: any[]) => {
			logger.debug('Call with messages:', messages, ...args);

			// 1. Process incoming messages into a single prompt string
			let prompt: string;
			if (Array.isArray(messages)) {
				prompt = messages.map((msg: any) => msg.content || msg.text || String(msg)).join('\n');
			} else {
				prompt = String(messages.value || messages);
			}

			const modelVersion = modelName.match(/models\/gemini-(\d+)\.(\d+)/);
			const [, majorVersion, minorVersion] = modelVersion || [];

			// 2. Manually construct the REST API request body
			const requestBody = {
				contents: [{ parts: [{ text: prompt }] }],
				// Use the correct REST API format for the search tool
				tools: enableSearch
					? [
							+majorVersion >= 2
								? { google_search: {} }
								: +majorVersion === 1 && +minorVersion >= 5
									? { google_search_retrieval: {} }
									: {},
						]
					: undefined,
				generationConfig: {
					maxOutputTokens: options.maxOutputTokens,
					temperature: options.temperature,
					topK: options.topK,
					topP: options.topP,
				},
				safetySettings: safetySettings || undefined,
			};

			// 3. Create a proxy agent only if a URL is provided.
			// This agent is a local variable and does not affect any other requests.
			const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
			const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
			if (httpsAgent) {
				logger.debug(`Using proxy: ${proxyUrl}`);
			}

			// The full REST API endpoint URL
			const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

			logger.debug('Request body:', requestBody);

			try {
				// 4. Use axios to make a self-contained API call.
				// The `httpsAgent` is passed directly into the request config.
				const response = await axios.post(url, requestBody, {
					headers: { 'Content-Type': 'application/json' },
					httpsAgent: httpsAgent,
				});

				// 5. Parse the response from the REST API
				// The structure is different from the SDK's response.
				const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
				logger.debug('Response received from API:', response.data);
				return text;
			} catch (error) {
				logger.error('Error calling Gemini REST API:', error);
				throw error;
			}
		};

		logger.debug('Model function initialized with options:', {
			modelName,
			enableSearch,
			debugMode,
			options,
			safetySettings,
		});

		// Return the model function to be used by n8n
		return {
			response: model,
		};
	}
}

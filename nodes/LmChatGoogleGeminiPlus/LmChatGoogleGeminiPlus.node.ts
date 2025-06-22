import { GoogleGenAI, SafetySetting } from '@google/genai';
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
		description: 'Chat Model Google Gemini Plus with Google Search',
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

		const modelName = this.getNodeParameter('modelName', itemIndex) as string;
		const enableSearch = this.getNodeParameter('enableSearch', itemIndex, false) as boolean;
		const debugMode = this.getNodeParameter('debugMode', itemIndex, false) as boolean;
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

		const logger = createLogger(name, debugMode);

		const genAI = new GoogleGenAI({
			apiKey: credentials.apiKey as string,
		});

		// 创建一个简单的模型函数
		const model = async (messages: any, ...args: any[]) => {
			logger.debug('Call with messages:', messages, ...args);

			logger.debug('Input Data', this.getInputData());

			// 处理消息格式
			let prompt: string;
			if (Array.isArray(messages)) {
				prompt = messages
					.map((msg: any) => {
						if (typeof msg === 'string') return msg;
						return msg.content || msg.text || String(msg);
					})
					.join('\n');
			} else if (typeof messages === 'string') {
				prompt = messages;
			} else if (messages && typeof messages === 'object' && messages.value) {
				prompt = messages.value;
			} else {
				prompt = String(messages);
			}

			try {
				const response = await genAI.models.generateContent({
					model: modelName.replace('models/', ''),
					contents: [prompt],
					config: {
						maxOutputTokens: options.maxOutputTokens,
						temperature: options.temperature,
						topK: options.topK,
						topP: options.topP,
						safetySettings: safetySettings || undefined,
						tools: enableSearch ? [{ googleSearch: {} }] : undefined,
					},
				});

				logger.debug('Response:', response);

				// 返回文本内容
				return response.text || '';
			} catch (error) {
				logger.error('Error calling Gemini API:', error);
				throw error;
			}
		};

		return {
			response: model,
		};
	}
}

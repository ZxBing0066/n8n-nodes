import { NodeConnectionType } from 'n8n-workflow';
import type { INodeProperties } from 'n8n-workflow';

const connectionsString = {
	[NodeConnectionType.AiAgent]: {
		// Root AI view
		connection: '',
		locale: 'AI Agent',
	},
	[NodeConnectionType.AiChain]: {
		// Root AI view
		connection: '',
		locale: 'AI Chain',
	},
	[NodeConnectionType.AiDocument]: {
		connection: NodeConnectionType.AiDocument,
		locale: 'Document Loader',
	},
	[NodeConnectionType.AiVectorStore]: {
		connection: NodeConnectionType.AiVectorStore,
		locale: 'Vector Store',
	},
	[NodeConnectionType.AiRetriever]: {
		connection: NodeConnectionType.AiRetriever,
		locale: 'Vector Store Retriever',
	},
};

type AllowedConnectionTypes =
	| NodeConnectionType.AiAgent
	| NodeConnectionType.AiChain
	| NodeConnectionType.AiDocument
	| NodeConnectionType.AiVectorStore
	| NodeConnectionType.AiRetriever;

function determineArticle(nextWord: string): string {
	// check if the next word starts with a vowel sound
	const vowels = /^[aeiouAEIOU]/;
	return vowels.test(nextWord) ? 'an' : 'a';
}
const getConnectionParameterString = (connectionType: string) => {
	if (connectionType === '') return "data-action-parameter-creatorview='AI'";

	return `data-action-parameter-connectiontype='${connectionType}'`;
};
const getAhref = (connectionType: { connection: string; locale: string }) =>
	`<a class="test" data-action='openSelectiveNodeCreator'${getConnectionParameterString(
		connectionType.connection,
	)}'>${connectionType.locale}</a>`;

export function getConnectionHintNoticeField(
	connectionTypes: AllowedConnectionTypes[],
): INodeProperties {
	const groupedConnections = new Map<string, string[]>();

	// group connection types by their 'connection' value
	// to not create multiple links
	connectionTypes.forEach((connectionType) => {
		const connectionString = connectionsString[connectionType].connection;
		const localeString = connectionsString[connectionType].locale;

		if (!groupedConnections.has(connectionString)) {
			groupedConnections.set(connectionString, [localeString]);
			return;
		}

		groupedConnections.get(connectionString)?.push(localeString);
	});

	let displayName;

	if (groupedConnections.size === 1) {
		const [[connection, locales]] = Array.from(groupedConnections);

		displayName = `This node must be connected to ${determineArticle(locales[0])} ${locales[0]
			.toLowerCase()
			.replace(
				/^ai /,
				'AI ',
			)}. <a data-action='openSelectiveNodeCreator' ${getConnectionParameterString(
			connection,
		)}>Insert one</a>`;
	} else {
		const ahrefs = Array.from(groupedConnections, ([connection, locales]) => {
			// If there are multiple locales, join them with ' or '
			// use determineArticle to insert the correct article
			const locale =
				locales.length > 1
					? locales
							.map((localeString, index, { length }) => {
								return (
									(index === 0 ? `${determineArticle(localeString)} ` : '') +
									(index < length - 1 ? `${localeString} or ` : localeString)
								);
							})
							.join('')
					: `${determineArticle(locales[0])} ${locales[0]}`;
			return getAhref({ connection, locale });
		});

		displayName = `This node needs to be connected to ${ahrefs.join(' or ')}.`;
	}

	return {
		displayName,
		name: 'notice',
		type: 'notice',
		default: '',
		typeOptions: {
			containerClass: 'ndv-connection-hint-notice',
		},
	};
}

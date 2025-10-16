import superjson from 'superjson';

export type SerializedData = {
	json: string;
	meta?: any;
};

export const serializer = {
	serialize(data: any): string {
		return superjson.stringify(data);
	},
	deserialize<T = any>(data: string): T {
		return superjson.parse(data);
	},
	serializeForQuery(data: any): string {
		return encodeURIComponent(superjson.stringify(data));
	},
	deserializeFromQuery<T = any>(data: string): T {
		return superjson.parse(decodeURIComponent(data));
	},
};

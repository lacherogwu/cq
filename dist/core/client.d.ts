import { C as ClientType } from '../types-DktKsBVN.js';
import '@standard-schema/spec';

type Opts = {
    baseURL?: string;
};
declare function createClient<T>(opts?: Opts): ClientType<T>;

export { createClient };

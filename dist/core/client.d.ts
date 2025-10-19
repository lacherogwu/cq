import { A as ActionType, a as ActionsClient } from '../types-4mTTYEQa.js';
import '@standard-schema/spec';

type HTTPHeaders = Record<string, string[] | string | undefined>;
type Opts = {
    url?: string;
    headers?: HTTPHeaders | (() => HTTPHeaders | Promise<HTTPHeaders>);
} & DoHttpCallHooks;
declare function createActionsClient<T>(opts?: Opts): ActionsClient<T>;
type DoHttpCallParams = {
    baseUrl?: string;
    actionType: ActionType;
    actionPath: string;
    input?: any;
    headers?: HTTPHeaders;
} & DoHttpCallHooks;
type DoHttpCallHooks = {
    onRequest?: (params: {
        type: ActionType;
        action: string;
        input?: any;
    }) => void;
    onResponse?: (result: {
        type: ActionType;
        action: string;
        result: any;
    }) => void;
    onError?: (result: {
        type: ActionType;
        action: string;
        result: Record<string, any> | null;
    }) => void;
};
declare function doHttpCall(params: DoHttpCallParams): Promise<any>;

export { createActionsClient, doHttpCall };

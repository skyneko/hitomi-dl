import request = require('request');
export interface PartialRequestMetadata {
    readonly acceptRanges: string;
    readonly contentLength: number;
}
export declare class PartialRequestQuery {
    getMetadata(url: string, headers?: request.Headers): Promise<PartialRequestMetadata>;
}

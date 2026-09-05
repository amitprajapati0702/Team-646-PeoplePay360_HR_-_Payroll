export interface ApiErrorOptions{
    statuscode?: number;
    
    message:string;
    errorcode:string;
    details?:unknown
    isOperational?:boolean;
}

export class ApiError extends Error{
    public readonly statuscode : number;
    public readonly errorcode:string;
    public readonly details:unknown;
    public readonly isOperational:boolean;

    constructor({
         statuscode,
        
        message,
        errorcode,
        details,
        isOperational = true,
    }:ApiErrorOptions){
        super(message)
        const resolvedStatus =statuscode ?? 500;
        this.statuscode = resolvedStatus;
        this.errorcode = errorcode;
        this.details = details;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}


export default ApiError
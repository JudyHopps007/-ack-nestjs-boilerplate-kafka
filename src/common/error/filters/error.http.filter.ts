import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Optional,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import { Response } from 'express';
import { DebuggerService } from 'src/common/debugger/services/debugger.service';
import { ERROR_TYPE } from 'src/common/error/constants/error.enum.constant';
import {
    IErrorException,
    IErrorHttpFilter,
    IErrorHttpFilterMetadata,
    IErrors,
    IErrorsImport,
    IValidationErrorImport,
} from 'src/common/error/interfaces/error.interface';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';
import { IMessage } from 'src/common/message/interfaces/message.interface';
import { MessageService } from 'src/common/message/services/message.service';
import { IRequestApp } from 'src/common/request/interfaces/request.interface';

// If we throw error with HttpException, there will always return object
// The exception filter only catch HttpException
@Catch()
export class ErrorHttpFilter implements ExceptionFilter {
    private readonly appDefaultLanguage: string[];

    constructor(
        @Optional() private readonly debuggerService: DebuggerService,
        private readonly configService: ConfigService,
        private readonly messageService: MessageService,
        private readonly helperDateService: HelperDateService
    ) {
        this.appDefaultLanguage =
            this.configService.get<string[]>('app.language');
    }

    async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const request = ctx.getRequest<IRequestApp>();

        // get request headers
        const customLang: string[] =
            ctx.getRequest<IRequestApp>().customLang ?? this.appDefaultLanguage;

        // get metadata
        const __class = request.__class || ErrorHttpFilter.name;
        const __function = request.__function || this.catch.name;
        const __requestId = request.id;
        const __path = request.path;
        const __timestamp =
            request.timestamp || this.helperDateService.timestamp();
        const __timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const __version =
            request.version ||
            this.configService.get<string>('app.versioning.version');
        const __repoVersion =
            request.repoVersion ||
            this.configService.get<string>('app.repoVersion');

        if (exception instanceof HttpException) {
            const statusHttp: number = exception.getStatus();
            const responseExpress: Response = ctx.getResponse<Response>();

            // Debugger
            try {
                this.debuggerService.error(
                    request?.id ? request.id : ErrorHttpFilter.name,
                    {
                        description: exception.message,
                        class: __class,
                        function: __function,
                        path: __path,
                    },
                    exception
                );
            } catch (err: unknown) {}

            // Restructure
            const response = exception.getResponse();

            if (!this.isErrorException(response)) {
                responseExpress.status(statusHttp).json(response);

                return;
            }

            const responseException = response as IErrorException;
            const {
                statusCode,
                message,
                error,
                errorType,
                data,
                properties,
                metadata,
            } = responseException;

            let { errors } = responseException;
            if (errors?.length > 0) {
                errors =
                    errorType === ERROR_TYPE.IMPORT
                        ? await this.messageService.getImportErrorsMessage(
                              errors as IValidationErrorImport[],
                              customLang
                          )
                        : await this.messageService.getRequestErrorsMessage(
                              errors as ValidationError[],
                              customLang
                          );
            }

            const mapMessage: string | IMessage = await this.messageService.get(
                message,
                { customLanguages: customLang, properties }
            );

            const resMetadata: IErrorHttpFilterMetadata = {
                languages: customLang,
                timestamp: __timestamp,
                timezone: __timezone,
                requestId: __requestId,
                path: __path,
                version: __version,
                repoVersion: __repoVersion,
                ...metadata,
            };

            const resResponse: IErrorHttpFilter = {
                statusCode: statusCode || statusHttp,
                message: mapMessage,
                error:
                    error && Object.keys(error).length > 0
                        ? error
                        : exception.message,
                errors: errors as IErrors[] | IErrorsImport[],
                metadata: resMetadata,
                data,
            };

            responseExpress
                .setHeader('x-custom-lang', customLang)
                .setHeader('x-timestamp', __timestamp)
                .setHeader('x-timezone', __timezone)
                .setHeader('x-request-id', __requestId)
                .setHeader('x-version', __version)
                .setHeader('x-repo-version', __repoVersion)
                .status(statusHttp)
                .json(resResponse);
        } else {
            console.error('exception', exception);
            // In certain situations `httpAdapter` might not be available in the
            // constructor method, thus we should resolve it here.
            const message: string = (await this.messageService.get(
                'http.serverError.internalServerError'
            )) as string;

            const metadata: IErrorHttpFilterMetadata = {
                languages: customLang,
                timestamp: __timestamp,
                timezone: __timezone,
                requestId: __requestId,
                path: __path,
                version: __version,
                repoVersion: __repoVersion,
            };

            const responseBody = {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message,
                error:
                    exception instanceof Error && 'message' in exception
                        ? exception.message
                        : undefined,
                metadata,
            };

            // Debugger
            try {
                this.debuggerService.error(
                    ErrorHttpFilter.name,
                    {
                        description: message,
                        class: ErrorHttpFilter.name,
                        function: 'catch',
                        path: __path,
                    },
                    exception
                );
            } catch (err: unknown) {}

            const responseExpress: Response = ctx.getResponse<Response>();
            responseExpress
                .setHeader('x-custom-lang', customLang)
                .setHeader('x-timestamp', __timestamp)
                .setHeader('x-timezone', __timezone)
                .setHeader('x-request-id', __requestId)
                .setHeader('x-version', __version)
                .setHeader('x-repo-version', __repoVersion)
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .json(responseBody);
        }

        return;
    }

    isErrorException(obj: any): obj is IErrorException {
        return 'statusCode' in obj && 'message' in obj;
    }
}

const VALIDATION_ERROR_BRAND = Symbol.for('@@ValidationError');

export class ValidationError extends Error {
	readonly [VALIDATION_ERROR_BRAND] = true;

	issues: { code: string; path: string[]; message: string }[];
	constructor(message: string, issues?: { code: string; path: string[]; message: string }[]) {
		super(message);
		this.name = 'ValidationError';
		this.issues = issues || [];
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

export function isValidationError(error: unknown): error is ValidationError {
	return typeof error === 'object' && error !== null && VALIDATION_ERROR_BRAND in error && 'issues' in error;
}

export function createValidator(validateOrFn: any, maybeFn?: any) {
	if (!maybeFn) {
		return (arg: any) => {
			if (arg !== undefined) {
				throw new ValidationError('This action does not accept any input');
			}
		};
	}

	if ('~standard' in validateOrFn) {
		return (arg: any) => {
			const validate = validateOrFn['~standard'].validate;
			const result = validate(arg);
			if (result.issues) {
				throw new ValidationError('Invalid input', result.issues);
			}

			return result.value;
		};
	}

	throw new ValidationError('Invalid validator passed');
}

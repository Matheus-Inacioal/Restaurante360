import { NextResponse } from 'next/server';
import { type ZodError } from 'zod';

export function jsonOk<T>(data: T, status = 200) {
    return NextResponse.json(
        { ok: true, data },
        { status }
    );
}

export function jsonErro(message: string, code = "INTERNAL_ERROR", status = 500) {
    return NextResponse.json(
        { ok: false, code, message },
        { status }
    );
}

export function mapearZodError(error: ZodError) {
    return NextResponse.json(
        {
            ok: false,
            code: "VALIDATION_ERROR",
            message: "Dados de entrada inválidos ou incompletos.",
            issues: error.flatten().fieldErrors
        },
        { status: 400 }
    );
}

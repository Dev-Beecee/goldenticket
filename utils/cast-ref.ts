import type * as React from "react"

export function castRef<T>(ref: unknown): React.Ref<T> {
    return ref as React.Ref<T>
}

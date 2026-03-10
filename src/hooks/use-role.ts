'use client'

// Since next-auth is not used in this project (using custom JWT session),
// and we don't have a global Client-side User Context yet,
// these hooks currently return null/false.
// Components should ideally receive role information via props from Server Components.

export const useRole = () => {
    return null
}

export const useIsDean = () => {
    return false
}

export const useIsAdmin = () => {
    return false
}

export const useIsSecretary = () => {
    return false
}

export const useIsLabtech = () => {
    return false
}

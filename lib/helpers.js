export function rand (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

export const isOK = {
    'response code is 200': response => response.status == 200
}
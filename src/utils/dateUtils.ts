export function compareDate(a?: Date, b?: Date): boolean {
    if (!a || !b) return false;
    const aDate = new Date(a);
    const bDate = new Date(b);
    return aDate.getTime() === bDate.getTime();
}
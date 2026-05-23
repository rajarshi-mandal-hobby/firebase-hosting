const a = {
    b: 'c',
    d: 2
};

const map = Object.entries(a).reduce((acc, [key, value]) => {
    if (typeof value === 'number') acc[key] = value;
    return acc;
}, {} as Record<string, unknown>);

console.log(JSON.stringify(map, null, 2));

const a = [
    {id: 1, name: "rajar"},
    {id: 2, name: "rajar"},
    {id: 3, name: "rajar"},
];

const b = [
    {id: 1, name: "rajar"},
    {id: 2, name: "rajar"},
    {id: 4, name: "rajar"},
];

// Merge and remove duplicates
const resultMap = [...a, ...b].reduce((acc, item) => {
   acc.set(item.id, item);
   return acc;
}, new Map());
console.log(JSON.stringify([...resultMap.values()], null, 2));